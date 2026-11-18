<?php
/**
 * BD22 Fire System & Builders Inc.
 * Service Requests API Endpoint
 * Handles emergency dispatch, maintenance requests, and status coordination.
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/response.php';
require_once __DIR__ . '/../includes/auth_middleware.php';

header('Content-Type: application/json; charset=utf-8');

$pdo = getDbConnection();
$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
$user = getCurrentUser();

switch ($method) {
    case 'GET':
        if (!$user) {
            jsonResponse([]);
        }

        if ($user['role'] === 'admin') {
            $stmt = $pdo->query('SELECT * FROM service_requests ORDER BY id DESC');
            $results = $stmt->fetchAll();
        } else {
            $stmt = $pdo->prepare('SELECT * FROM service_requests WHERE user_id = :uid ORDER BY id DESC');
            $stmt->execute([':uid' => $user['id']]);
            $results = $stmt->fetchAll();
        }

        foreach ($results as &$r) {
            $r['reference'] = $r['reference_no'];
            $r['customer'] = $r['customer_name'];
            $r['service'] = $r['service_type'];
            $r['assignedStaff'] = $r['assigned_staff'];
            $r['dateSubmitted'] = date('M d, Y', strtotime($r['created_at']));
            $r['lastUpdate'] = date('M d, Y', strtotime($r['last_update']));
        }

        jsonResponse($results);
        break;

    case 'POST':
        $user = requireAuth();
        $input = getJsonInput();

        $serviceType = trim((string)($input['serviceType'] ?? ($input['service_type'] ?? ($input['service'] ?? ''))));
        $urgency = trim((string)($input['urgency'] ?? 'Standard Maintenance'));
        $notes = trim((string)($input['notes'] ?? ($input['message'] ?? '')));

        if ($serviceType === '') {
            jsonError('Service category is required', 400);
        }

        $validUrgencies = ['Standard Maintenance', 'Priority', 'Emergency / Urgent', 'Standard', 'Urgent'];
        $cleanUrgency = ($urgency === 'Urgent' || $urgency === 'Emergency / Urgent') ? 'Emergency / Urgent' : 'Standard Maintenance';
        $status = ($cleanUrgency === 'Emergency / Urgent') ? 'Urgent' : 'Scheduled';

        $pdo->beginTransaction();
        try {
            $year = date('Y');
            $stmt = $pdo->query("SELECT COUNT(*) FROM service_requests WHERE reference_no LIKE 'REQ-{$year}-%'");
            $nextSeq = (int)$stmt->fetchColumn() + 1;
            do {
                $ref = sprintf('REQ-%s-%04d', $year, $nextSeq);
                $chk = $pdo->prepare('SELECT id FROM service_requests WHERE reference_no = :r LIMIT 1');
                $chk->execute([':r' => $ref]);
                if (!$chk->fetch()) {
                    break;
                }
                $nextSeq++;
            } while (true);

            $insert = $pdo->prepare("
                INSERT INTO service_requests (reference_no, user_id, customer_name, service_type, urgency, notes, status, assigned_staff)
                VALUES (:ref, :uid, :name, :stype, :urgency, :notes, :status, 'Unassigned')
            ");
            $insert->execute([
                ':ref'     => $ref,
                ':uid'     => $user['id'],
                ':name'    => $user['full_name'] ?: 'Customer',
                ':stype'   => $serviceType,
                ':urgency' => $cleanUrgency,
                ':notes'   => $notes ?: 'Service request logged from customer portal',
                ':status'  => $status
            ]);

            // Create admin notification
            $notif = $pdo->prepare("
                INSERT INTO admin_notifications (title, description, status, action_url)
                VALUES (:title, :desc, 'New', '#admin-service-requests')
            ");
            $notif->execute([
                ':title' => "New Service Request #{$ref}: {$serviceType}",
                ':desc'  => "Urgency: {$cleanUrgency}. Client: {$user['full_name']}"
            ]);

            $pdo->commit();
        } catch (Exception $e) {
            $pdo->rollBack();
            jsonError('Failed to record service request: ' . $e->getMessage(), 500);
        }

        jsonResponse([
            'reference'    => $ref,
            'reference_no' => $ref,
            'status'       => $status
        ], 201, 'Service request registered successfully');
        break;

    case 'PATCH':
    case 'PUT':
        requireAdmin();
        $input = getJsonInput();
        $ref = trim((string)($input['reference'] ?? ($input['reference_no'] ?? '')));

        if ($ref === '') {
            jsonError('Reference number is required', 400);
        }

        $stmt = $pdo->prepare('SELECT * FROM service_requests WHERE reference_no = :ref LIMIT 1');
        $stmt->execute([':ref' => $ref]);
        $existing = $stmt->fetch();

        if (!$existing) {
            jsonError('Service request not found', 404);
        }

        $fields = [];
        $params = [':ref' => $ref];
        $newStatus = null;

        if (isset($input['status'])) {
            $fields[] = 'status = :status';
            $params[':status'] = $input['status'];
            $newStatus = $input['status'];
        }
        if (isset($input['assignedStaff'])) {
            $fields[] = 'assigned_staff = :staff';
            $params[':staff'] = $input['assignedStaff'];
        }

        if (empty($fields)) {
            jsonError('No fields to update', 400);
        }

        $pdo->beginTransaction();
        try {
            $sql = 'UPDATE service_requests SET ' . implode(', ', $fields) . ', last_update = CURRENT_TIMESTAMP WHERE reference_no = :ref';
            $upd = $pdo->prepare($sql);
            $upd->execute($params);

            // Notify customer if status updated
            if ($newStatus && !empty($existing['user_id'])) {
                $notif = $pdo->prepare("
                    INSERT INTO customer_messages (user_id, title, description, is_read)
                    VALUES (:uid, :title, :desc, false)
                ");
                $notif->execute([
                    ':uid'   => $existing['user_id'],
                    ':title' => "Service Request Update: {$ref}",
                    ':desc'  => "Your service request for {$existing['service_type']} is currently marked '{$newStatus}'."
                ]);
            }

            $pdo->commit();
        } catch (Exception $e) {
            $pdo->rollBack();
            jsonError('Failed to update service request: ' . $e->getMessage(), 500);
        }

        jsonResponse(null, 200, 'Service request updated');
        break;

    default:
        jsonError('Method Not Allowed', 405);
        break;
}
