<?php
/**
 * BD22 Fire System & Builders Inc.
 * Inquiries API Endpoint
 * Handles customer and public inquiry workflows with authoritative database persistence.
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/response.php';
require_once __DIR__ . '/../includes/auth_middleware.php';
require_once __DIR__ . '/../includes/rate_limiter.php';

header('Content-Type: application/json; charset=utf-8');

$pdo = getDbConnection();
$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
$user = getCurrentUser();

switch ($method) {
    case 'GET':
        $search = trim((string)($_GET['search'] ?? ''));
        $status = trim((string)($_GET['status'] ?? ''));
        $ref = trim((string)($_GET['ref'] ?? ''));

        if ($ref !== '') {
            $stmt = $pdo->prepare('SELECT * FROM inquiries WHERE reference_no = :ref LIMIT 1');
            $stmt->execute([':ref' => $ref]);
            $item = $stmt->fetch();
            if (!$item) {
                jsonError('Inquiry not found', 404);
            }

            // Customer access check - require valid server session
            if (!$user) {
                jsonError('Authentication required: Please sign in to view inquiry details.', 401);
            }
            if ($user['role'] !== 'admin' && (int)$item['user_id'] !== (int)$user['id']) {
                jsonError('Access denied: You do not own this inquiry record.', 403);
            }

            $item['reference'] = $item['reference_no'];
            $item['customer'] = $item['customer_name'];
            $item['service'] = $item['service_name'];
            $item['assignedStaff'] = $item['assigned_staff'];
            $item['trackingNote'] = $item['tracking_note'];
            $item['dateSubmitted'] = date('M d, Y', strtotime($item['created_at']));
            $item['lastUpdate'] = date('M d, Y', strtotime($item['last_update']));

            jsonResponse($item);
        }

        $sql = 'SELECT * FROM inquiries WHERE 1=1';
        $params = [];

        // Role-based customer isolation
        if (!$user || $user['role'] !== 'admin') {
            if ($user) {
                // Strictly show inquiries owned by this customer's user_id
                $sql .= ' AND user_id = :uid';
                $params[':uid'] = $user['id'];
            } else {
                jsonResponse([]);
            }
        }

        if ($status !== '' && strtolower($status) !== 'all') {
            $sql .= ' AND status = :status';
            $params[':status'] = $status;
        }

        if ($search !== '') {
            $sql .= ' AND (reference_no ILIKE :s1 OR customer_name ILIKE :s2 OR service_name ILIKE :s3 OR email ILIKE :s4)';
            $searchWild = '%' . $search . '%';
            $params[':s1'] = $searchWild;
            $params[':s2'] = $searchWild;
            $params[':s3'] = $searchWild;
            $params[':s4'] = $searchWild;
        }

        $sql .= ' ORDER BY id DESC';

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $results = $stmt->fetchAll();

        foreach ($results as &$r) {
            $r['reference'] = $r['reference_no'];
            $r['customer'] = $r['customer_name'];
            $r['service'] = $r['service_name'];
            $r['assignedStaff'] = $r['assigned_staff'];
            $r['trackingNote'] = $r['tracking_note'];
            $r['dateSubmitted'] = date('M d, Y', strtotime($r['created_at']));
            $r['lastUpdate'] = date('M d, Y', strtotime($r['last_update']));
        }

        jsonResponse($results);
        break;

    case 'POST':
        // Rate limit: Max 5 inquiries per 5 minutes per IP address
        enforceRateLimit('inquiry_submit', 5, 300);

        $input = getJsonInput();
        $customerName = trim((string)($input['customer'] ?? ($input['name'] ?? ($input['fullName'] ?? ''))));
        $email = strtolower(trim((string)($input['email'] ?? '')));
        $phone = trim((string)($input['phone'] ?? ($input['contactNumber'] ?? '')));
        $service = trim((string)($input['service'] ?? ($input['serviceNeeded'] ?? ($input['service_name'] ?? ''))));
        $message = trim((string)($input['message'] ?? ($input['notes'] ?? ($input['inquiryMessage'] ?? ''))));

        // If authenticated customer, prefill identity if omitted
        if ($user && $user['role'] === 'customer') {
            if ($customerName === '') $customerName = $user['full_name'];
            if ($email === '') $email = $user['email'];
            if ($phone === '' && !empty($user['phone'])) $phone = $user['phone'];
        }

        if ($customerName === '' || $email === '' || $service === '') {
            jsonError('Customer name, email, and service are required', 400);
        }

        if (strlen($customerName) < 2) {
            jsonError('Customer name must be at least 2 characters long', 400);
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            jsonError('Please provide a valid email address', 400);
        }

        if ($phone !== '') {
            if (preg_match('/[a-zA-Z]/', $phone)) {
                jsonError('Phone number cannot contain letters', 400);
            }
            $phoneDigits = preg_replace('/\D/', '', $phone);
            if (strlen($phoneDigits) < 7 || strlen($phoneDigits) > 15) {
                jsonError('Please provide a valid phone number (7 to 15 digits)', 400);
            }
        }

        // Generate unique reference with collision prevention
        $year = date('Y');
        $pdo->beginTransaction();
        try {
            $seqStmt = $pdo->query("SELECT COUNT(*) FROM inquiries WHERE reference_no LIKE 'INQ-{$year}-%'");
            $nextSeq = (int)$seqStmt->fetchColumn() + 1;
            do {
                $ref = sprintf('INQ-%s-%04d', $year, $nextSeq);
                $chk = $pdo->prepare('SELECT id FROM inquiries WHERE reference_no = :ref LIMIT 1');
                $chk->execute([':ref' => $ref]);
                if (!$chk->fetch()) {
                    break;
                }
                $nextSeq++;
            } while (true);

            $userId = ($user && $user['role'] === 'customer') ? $user['id'] : null;

            $insert = $pdo->prepare("
                INSERT INTO inquiries (reference_no, user_id, customer_name, email, phone, service_name, message, status, assigned_staff, tracking_note)
                VALUES (:ref, :uid, :name, :email, :phone, :srv, :msg, 'Pending Review', 'Unassigned', 'Inquiry logged into system and queued for engineering review.')
            ");
            $insert->execute([
                ':ref'   => $ref,
                ':uid'   => $userId,
                ':name'  => $customerName,
                ':email' => $email,
                ':phone' => $phone,
                ':srv'   => $service,
                ':msg'   => $message ?: 'Website inquiry'
            ]);

            // Add notification for administrators
            $notif = $pdo->prepare("
                INSERT INTO admin_notifications (title, description, status, action_url)
                VALUES (:title, :desc, 'New', '#admin-inquiries')
            ");
            $notif->execute([
                ':title' => "New Inquiry Logged: {$customerName} ({$ref})",
                ':desc'  => "Service: {$service}. Phone: {$phone}"
            ]);

            $pdo->commit();
        } catch (Exception $e) {
            $pdo->rollBack();
            jsonError('Failed to record inquiry: ' . $e->getMessage(), 500);
        }

        jsonResponse([
            'reference' => $ref,
            'reference_no' => $ref,
            'status' => 'Pending Review'
        ], 201, 'Inquiry submitted successfully');
        break;

    case 'PATCH':
    case 'PUT':
        requireAdmin();
        $input = getJsonInput();
        $ref = trim((string)($input['reference'] ?? ($input['ref'] ?? ($input['reference_no'] ?? ''))));

        if ($ref === '') {
            jsonError('Inquiry reference is required', 400);
        }

        $check = $pdo->prepare('SELECT * FROM inquiries WHERE reference_no = :ref LIMIT 1');
        $check->execute([':ref' => $ref]);
        $existing = $check->fetch();

        if (!$existing) {
            jsonError('Inquiry not found', 404);
        }

        $fields = [];
        $params = [':ref' => $ref];
        $newStatus = null;

        if (isset($input['status'])) {
            $statusVal = trim((string)$input['status']);
            $validStatuses = ['Pending Review', 'Scheduled', 'In Progress', 'Completed'];
            if (!in_array($statusVal, $validStatuses, true)) {
                jsonError("Invalid status. Must be one of: " . implode(', ', $validStatuses), 400);
            }
            $fields[] = 'status = :status';
            $params[':status'] = $statusVal;
            $newStatus = $statusVal;
        }

        if (isset($input['assignedStaff'])) {
            $fields[] = 'assigned_staff = :staff';
            $params[':staff'] = trim((string)$input['assignedStaff']);
        }

        if (isset($input['service'])) {
            $fields[] = 'service_name = :srv';
            $params[':srv'] = trim((string)$input['service']);
        }

        if (isset($input['trackingNote'])) {
            $fields[] = 'tracking_note = :note';
            $params[':note'] = trim((string)$input['trackingNote']);
        }

        if (empty($fields)) {
            jsonError('No fields provided for update', 400);
        }

        $pdo->beginTransaction();
        try {
            $sql = 'UPDATE inquiries SET ' . implode(', ', $fields) . ', last_update = CURRENT_TIMESTAMP WHERE reference_no = :ref';
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);

            // If status changed and inquiry is linked to a customer, send them a message in customer_messages
            if ($newStatus && !empty($existing['user_id'])) {
                $msgStmt = $pdo->prepare("
                    INSERT INTO customer_messages (user_id, title, description, is_read)
                    VALUES (:uid, :title, :desc, false)
                ");
                $msgStmt->execute([
                    ':uid'   => $existing['user_id'],
                    ':title' => "Inquiry Status Updated: {$ref}",
                    ':desc'  => "Your inquiry for {$existing['service_name']} is now '{$newStatus}'. Assigned Engineer: " . ($params[':staff'] ?? $existing['assigned_staff'])
                ]);
            }

            $pdo->commit();
        } catch (Exception $e) {
            $pdo->rollBack();
            jsonError('Failed to update inquiry: ' . $e->getMessage(), 500);
        }

        jsonResponse([
            'reference' => $ref,
            'status'    => $newStatus ?? $existing['status']
        ], 200, 'Inquiry updated successfully');
        break;

    default:
        jsonError('Method Not Allowed', 405);
        break;
}
