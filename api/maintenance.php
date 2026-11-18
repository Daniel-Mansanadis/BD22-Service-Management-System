<?php
/**
 * BD22 Fire System & Builders Inc.
 * Maintenance Schedules & Service Request API Endpoint
 * Handles maintenance scheduling, status updates, and automatic history logging.
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

        $status = trim((string)($_GET['status'] ?? 'All'));

        $sql = 'SELECT * FROM maintenance_schedules WHERE 1=1';
        $params = [];

        if ($user['role'] !== 'admin') {
            $sql .= ' AND user_id = :uid';
            $params[':uid'] = $user['id'];
        }

        if ($status !== '' && strtolower($status) !== 'all') {
            if (strtolower($status) === 'upcoming') {
                $sql .= ' AND status = \'Scheduled\' AND scheduled_date >= CURRENT_DATE';
            } else {
                $sql .= ' AND status = :status';
                $params[':status'] = $status;
            }
        }

        $sql .= ' ORDER BY scheduled_date ASC';

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $results = $stmt->fetchAll();

        foreach ($results as &$r) {
            $r['id'] = $r['maintenance_code'];
            $r['customer'] = $r['customer_name'];
            $r['service'] = $r['service_type'];
            $r['scheduledDate'] = date('M d, Y', strtotime($r['scheduled_date']));
        }

        jsonResponse($results);
        break;

    case 'POST':
        $user = requireAuth();
        $input = getJsonInput();

        $serviceType = trim((string)($input['service'] ?? ($input['service_type'] ?? '')));
        $scheduledDate = trim((string)($input['scheduledDate'] ?? ($input['scheduled_date'] ?? '')));
        $notes = trim((string)($input['notes'] ?? ''));
        $targetUserId = isset($input['userId']) && $user['role'] === 'admin' ? (int)$input['userId'] : $user['id'];
        $customerName = trim((string)($input['customer'] ?? ($input['customer_name'] ?? $user['full_name'])));
        $projectId = isset($input['projectId']) ? (int)$input['projectId'] : null;

        if ($serviceType === '') {
            jsonError('Service type is required', 400);
        }

        $parsedDate = !empty($scheduledDate) ? date('Y-m-d', strtotime($scheduledDate)) : date('Y-m-d', strtotime('+7 days'));

        $pdo->beginTransaction();
        try {
            // Generate unique maintenance code
            $year = date('Y');
            $countStmt = $pdo->query("SELECT COUNT(*) FROM maintenance_schedules WHERE maintenance_code LIKE 'MNT-{$year}-%'");
            $nextSeq = (int)$countStmt->fetchColumn() + 1;
            do {
                $code = sprintf('MNT-%s-%04d', $year, $nextSeq);
                $chk = $pdo->prepare('SELECT id FROM maintenance_schedules WHERE maintenance_code = :c LIMIT 1');
                $chk->execute([':c' => $code]);
                if (!$chk->fetch()) {
                    break;
                }
                $nextSeq++;
            } while (true);

            $insert = $pdo->prepare("
                INSERT INTO maintenance_schedules (maintenance_code, user_id, project_id, customer_name, service_type, scheduled_date, status, technician, notes)
                VALUES (:code, :uid, :pid, :cname, :stype, :sdate, 'Scheduled', 'Unassigned', :notes)
            ");
            $insert->execute([
                ':code'  => $code,
                ':uid'   => $targetUserId,
                ':pid'   => $projectId,
                ':cname' => $customerName,
                ':stype' => $serviceType,
                ':sdate' => $parsedDate,
                ':notes' => $notes ?: 'Scheduled maintenance request'
            ]);

            // Notify admin
            $notif = $pdo->prepare("
                INSERT INTO admin_notifications (title, description, status, action_url)
                VALUES (:title, :desc, 'New', '#admin-maintenance')
            ");
            $notif->execute([
                ':title' => "Maintenance Request Logged: {$customerName} ({$code})",
                ':desc'  => "Service: {$serviceType} scheduled for " . date('M d, Y', strtotime($parsedDate))
            ]);

            $pdo->commit();
        } catch (Exception $e) {
            $pdo->rollBack();
            jsonError('Failed to record maintenance schedule: ' . $e->getMessage(), 500);
        }

        jsonResponse([
            'id'               => $code,
            'maintenance_code' => $code,
            'service'          => $serviceType,
            'scheduledDate'    => date('M d, Y', strtotime($parsedDate)),
            'status'           => 'Scheduled'
        ], 201, 'Maintenance request scheduled successfully');
        break;

    case 'PATCH':
    case 'PUT':
        requireAdmin();
        $input = getJsonInput();
        $code = trim((string)($input['id'] ?? ($input['maintenance_code'] ?? '')));

        if ($code === '') {
            jsonError('Maintenance code is required', 400);
        }

        $stmt = $pdo->prepare('SELECT * FROM maintenance_schedules WHERE maintenance_code = :c LIMIT 1');
        $stmt->execute([':c' => $code]);
        $existing = $stmt->fetch();

        if (!$existing) {
            jsonError('Maintenance record not found', 404);
        }

        $fields = [];
        $params = [':code' => $code];
        $newStatus = null;
        $tech = $existing['technician'];

        if (isset($input['status'])) {
            $st = trim((string)$input['status']);
            $valid = ['Due', 'Scheduled', 'Overdue', 'Completed'];
            if (!in_array($st, $valid, true)) {
                jsonError('Invalid maintenance status', 400);
            }
            $fields[] = 'status = :st';
            $params[':st'] = $st;
            $newStatus = $st;
        }

        if (isset($input['technician'])) {
            $techVal = trim((string)$input['technician']);
            $fields[] = 'technician = :tech';
            $params[':tech'] = $techVal;
            $tech = $techVal;
        }

        if (isset($input['scheduledDate']) || isset($input['scheduled_date'])) {
            $sd = trim((string)($input['scheduledDate'] ?? $input['scheduled_date']));
            $fields[] = 'scheduled_date = :sdate';
            $params[':sdate'] = date('Y-m-d', strtotime($sd));
        }

        if (isset($input['notes'])) {
            $fields[] = 'notes = :notes';
            $params[':notes'] = trim((string)$input['notes']);
        }

        if (empty($fields)) {
            jsonError('No fields to update', 400);
        }

        $pdo->beginTransaction();
        try {
            $sql = 'UPDATE maintenance_schedules SET ' . implode(', ', $fields) . ' WHERE maintenance_code = :code';
            $upd = $pdo->prepare($sql);
            $upd->execute($params);

            // Workflow 4: When maintenance is marked Completed, automatically record in service_history!
            if ($newStatus === 'Completed' && $existing['status'] !== 'Completed') {
                $histStmt = $pdo->prepare("
                    INSERT INTO service_history (user_id, project_id, activity_type, title, description, service_date, badge, logged_by)
                    VALUES (:uid, :pid, 'Maintenance', :title, :desc, CURRENT_DATE, 'Inspection Passed', :logged)
                ");
                $histStmt->execute([
                    ':uid'    => $existing['user_id'],
                    ':pid'    => $existing['project_id'],
                    ':title'  => "Completed: {$existing['service_type']}",
                    ':desc'   => "Preventive maintenance and testing performed by {$tech}. All valves and pressure indicators verified operational.",
                    ':logged' => $tech ?: 'Senior Engineer'
                ]);

                // Notify customer of completion
                $notif = $pdo->prepare("
                    INSERT INTO customer_messages (user_id, title, description, is_read)
                    VALUES (:uid, :title, :desc, false)
                ");
                $notif->execute([
                    ':uid'   => $existing['user_id'],
                    ':title' => "Maintenance Completed: {$existing['service_type']}",
                    ':desc'  => "Technician {$tech} has finalized maintenance inspection for {$code}. Inspection record is now stored in your Service History."
                ]);
            }

            $pdo->commit();
        } catch (Exception $e) {
            $pdo->rollBack();
            jsonError('Failed to update maintenance record: ' . $e->getMessage(), 500);
        }

        jsonResponse([
            'id'     => $code,
            'status' => $newStatus ?? $existing['status']
        ], 200, 'Maintenance record updated successfully');
        break;

    default:
        jsonError('Method Not Allowed', 405);
        break;
}
