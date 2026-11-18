<?php
/**
 * BD22 Fire System & Builders Inc.
 * Payments & Invoicing API Endpoint
 * Handles invoice generation, payment recording, and balance calculation.
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
            jsonResponse(['payments' => [], 'stats' => ['billed' => 0, 'paid' => 0, 'balance' => 0, 'overdue' => 0]]);
        }

        if ($user['role'] === 'admin') {
            $sql = '
                SELECT p.*, pr.name AS project_name, pr.assigned_team AS assigned_staff
                FROM payments p
                LEFT JOIN projects pr ON p.project_id = pr.id
                ORDER BY p.id DESC
            ';
            $stmt = $pdo->query($sql);
            $results = $stmt->fetchAll();
        } else {
            // Strictly customer-owned invoices
            $sql = '
                SELECT p.*, pr.name AS project_name, pr.assigned_team AS assigned_staff
                FROM payments p
                LEFT JOIN projects pr ON p.project_id = pr.id
                WHERE p.user_id = :uid
                ORDER BY p.id DESC
            ';
            $stmt = $pdo->prepare($sql);
            $stmt->execute([':uid' => $user['id']]);
            $results = $stmt->fetchAll();
        }

        $totalBilled = 0.0;
        $totalPaid = 0.0;
        $totalBalance = 0.0;
        $overdueCount = 0;

        foreach ($results as &$r) {
            $r['invoice'] = $r['invoice_no'];
            $r['project'] = $r['project_name'] ?: 'Fire Safety Compliance Service';
            $r['customer'] = $r['customer_name'];
            $r['assignedStaff'] = $r['assigned_staff'] ?: 'Operations Accounting';
            $r['dueDate'] = date('M d, Y', strtotime($r['due_date']));
            $r['lastUpdate'] = date('M d, Y', strtotime($r['last_update']));
            $amt = (float)$r['amount'];
            $r['amount'] = $amt;

            $totalBilled += $amt;
            if ($r['status'] === 'Paid') {
                $totalPaid += $amt;
            } else {
                $totalBalance += $amt;
                if ($r['status'] === 'Overdue') {
                    $overdueCount++;
                }
            }
        }

        jsonResponse([
            'payments' => $results,
            'stats'    => [
                'billed'  => $totalBilled,
                'paid'    => $totalPaid,
                'balance' => $totalBalance,
                'overdue' => $overdueCount
            ]
        ]);
        break;

    case 'POST':
        $user = requireAuth();
        $input = getJsonInput();
        $invoiceNo = trim((string)($input['invoice'] ?? ($input['invoice_no'] ?? '')));
        $methodUsed = trim((string)($input['method'] ?? 'Bank Transfer'));
        $refNo = trim((string)($input['reference'] ?? ($input['payment_reference'] ?? '')));

        if ($invoiceNo === '') {
            jsonError('Invoice number is required', 400);
        }

        $stmt = $pdo->prepare('SELECT * FROM payments WHERE invoice_no = :inv LIMIT 1');
        $stmt->execute([':inv' => $invoiceNo]);
        $inv = $stmt->fetch();

        if (!$inv) {
            jsonError('Invoice not found', 404);
        }

        // Customer authorization: verify ownership
        if ($user['role'] !== 'admin' && (int)$inv['user_id'] !== (int)$user['id']) {
            jsonError('Access denied: You cannot settle another customer\'s invoice.', 403);
        }

        $pdo->beginTransaction();
        try {
            $update = $pdo->prepare("
                UPDATE payments 
                SET status = 'Paid', method_used = :pmethod, payment_reference = :pref, last_update = CURRENT_TIMESTAMP
                WHERE invoice_no = :inv
            ");
            $update->execute([
                ':pmethod' => $methodUsed,
                ':pref'    => $refNo ?: 'VERIFIED-' . strtoupper(bin2hex(random_bytes(4))),
                ':inv'     => $invoiceNo
            ]);

            // Notify admin
            $notif = $pdo->prepare("
                INSERT INTO admin_notifications (title, description, status, action_url)
                VALUES (:title, :desc, 'New', '#admin-payments')
            ");
            $notif->execute([
                ':title' => "Payment Settlement Recorded: {$invoiceNo}",
                ':desc'  => "Amount ₱" . number_format((float)$inv['amount'], 2) . " via {$methodUsed}. Ref: {$refNo}"
            ]);

            // Notify customer
            $custNotif = $pdo->prepare("
                INSERT INTO customer_messages (user_id, title, description, is_read)
                VALUES (:uid, :title, :desc, false)
            ");
            $custNotif->execute([
                ':uid'   => $inv['user_id'],
                ':title' => "Payment Verified: {$invoiceNo}",
                ':desc'  => "Your payment of ₱" . number_format((float)$inv['amount'], 2) . " has been successfully recorded."
            ]);

            $pdo->commit();
        } catch (Exception $e) {
            $pdo->rollBack();
            jsonError('Failed to record payment: ' . $e->getMessage(), 500);
        }

        jsonResponse([
            'invoice' => $invoiceNo,
            'status'  => 'Paid'
        ], 200, 'Payment settlement recorded successfully');
        break;

    case 'PATCH':
    case 'PUT':
        requireAdmin();
        $input = getJsonInput();
        $invoiceNo = trim((string)($input['invoice'] ?? ($input['invoice_no'] ?? '')));

        if ($invoiceNo === '') {
            jsonError('Invoice number is required', 400);
        }

        $stmt = $pdo->prepare('SELECT * FROM payments WHERE invoice_no = :inv LIMIT 1');
        $stmt->execute([':inv' => $invoiceNo]);
        $inv = $stmt->fetch();
        if (!$inv) {
            jsonError('Invoice not found', 404);
        }

        $fields = [];
        $params = [':inv' => $invoiceNo];

        if (isset($input['status'])) {
            $st = trim((string)$input['status']);
            $valid = ['Paid', 'Partial', 'Overdue', 'Pending'];
            if (!in_array($st, $valid, true)) {
                jsonError('Invalid status value', 400);
            }
            $fields[] = 'status = :st';
            $params[':st'] = $st;
        }

        if (isset($input['amount'])) {
            $amt = (float)$input['amount'];
            if ($amt < 0) jsonError('Amount cannot be negative', 400);
            $fields[] = 'amount = :amt';
            $params[':amt'] = $amt;
        }

        if (isset($input['dueDate'])) {
            $fields[] = 'due_date = :dd';
            $params[':dd'] = date('Y-m-d', strtotime($input['dueDate']));
        }

        if (empty($fields)) {
            jsonError('No fields to update', 400);
        }

        $pdo->beginTransaction();
        try {
            $sql = 'UPDATE payments SET ' . implode(', ', $fields) . ', last_update = CURRENT_TIMESTAMP WHERE invoice_no = :inv';
            $upd = $pdo->prepare($sql);
            $upd->execute($params);
            $pdo->commit();
        } catch (Exception $e) {
            $pdo->rollBack();
            jsonError('Failed to update invoice: ' . $e->getMessage(), 500);
        }

        jsonResponse([
            'invoice' => $invoiceNo,
            'status'  => $params[':st'] ?? $inv['status']
        ], 200, 'Invoice updated successfully');
        break;

    default:
        jsonError('Method Not Allowed', 405);
        break;
}
