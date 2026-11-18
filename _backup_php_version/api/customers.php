<?php
/**
 * BD22 Fire System & Builders Inc.
 * Customers Management API Endpoint (Admin Only)
 * Aggregates customer accounts, active projects, warranties, and inquiries.
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/response.php';
require_once __DIR__ . '/../includes/auth_middleware.php';

header('Content-Type: application/json; charset=utf-8');

$pdo = getDbConnection();
$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
requireAdmin();

if ($method !== 'GET') {
    jsonError('Method Not Allowed', 405);
}

$customerId = isset($_GET['id']) ? (int)$_GET['id'] : 0;

if ($customerId > 0) {
    // Single customer detail
    $stmt = $pdo->prepare('SELECT id, role, email, full_name, first_name, last_name, company, phone, pref_sms, pref_email, pref_warranty, created_at FROM users WHERE id = :id AND role = \'customer\' LIMIT 1');
    $stmt->execute([':id' => $customerId]);
    $customer = $stmt->fetch();

    if (!$customer) {
        jsonError('Customer not found', 404);
    }

    // Associated projects
    $projStmt = $pdo->prepare('SELECT * FROM projects WHERE user_id = :uid ORDER BY id DESC');
    $projStmt->execute([':uid' => $customerId]);
    $projects = $projStmt->fetchAll();

    // Associated inquiries
    $inqStmt = $pdo->prepare('SELECT * FROM inquiries WHERE user_id = :uid ORDER BY id DESC');
    $inqStmt->execute([':uid' => $customerId]);
    $inquiries = $inqStmt->fetchAll();

    // Associated payments
    $payStmt = $pdo->prepare('SELECT * FROM payments WHERE user_id = :uid ORDER BY id DESC');
    $payStmt->execute([':uid' => $customerId]);
    $payments = $payStmt->fetchAll();

    // Associated warranties
    $warrStmt = $pdo->prepare('SELECT * FROM warranties WHERE user_id = :uid ORDER BY id DESC');
    $warrStmt->execute([':uid' => $customerId]);
    $warranties = $warrStmt->fetchAll();

    jsonResponse([
        'customer'   => $customer,
        'projects'   => $projects,
        'inquiries'  => $inquiries,
        'payments'   => $payments,
        'warranties' => $warranties
    ]);
}

// List all customer accounts
$stmt = $pdo->query('
    SELECT u.id, u.role, u.email, u.full_name, u.first_name, u.last_name, u.company, u.phone, u.created_at,
           COUNT(DISTINCT p.id) as project_count,
           COUNT(DISTINCT i.id) as inquiry_count,
           COUNT(DISTINCT w.id) as warranty_count,
           COALESCE(SUM(CASE WHEN pay.status IN (\'Partial\', \'Overdue\', \'Pending\') THEN pay.amount ELSE 0 END), 0) as outstanding_balance
    FROM users u
    LEFT JOIN projects p ON u.id = p.user_id
    LEFT JOIN inquiries i ON u.id = i.user_id
    LEFT JOIN warranties w ON u.id = w.user_id
    LEFT JOIN payments pay ON u.id = pay.user_id
    WHERE u.role = \'customer\'
    GROUP BY u.id
    ORDER BY u.id DESC
');

$customers = $stmt->fetchAll();
foreach ($customers as &$c) {
    $c['registeredDate'] = date('M d, Y', strtotime($c['created_at']));
    $c['outstandingBalance'] = (float)$c['outstanding_balance'];
}

jsonResponse($customers);
