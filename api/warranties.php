<?php
/**
 * BD22 Fire System & Builders Inc.
 * Warranties API Endpoint
 * Manages warranty policies, dynamic expiration calculations, and project coverage.
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

        $sql = 'SELECT * FROM warranties WHERE 1=1';
        $params = [];

        if ($user['role'] !== 'admin') {
            $sql .= ' AND user_id = :uid';
            $params[':uid'] = $user['id'];
        }

        $sql .= ' ORDER BY id ASC';

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $results = $stmt->fetchAll();

        $today = new DateTime();
        $filtered = [];

        foreach ($results as &$r) {
            $r['ref'] = $r['warranty_code'];
            $r['customer'] = $r['customer_name'];
            $r['systemCovered'] = $r['system_covered'];
            $r['coverage'] = $r['coverage_summary'];
            $r['installDate'] = date('M d, Y', strtotime($r['install_date']));
            $r['expiryDate'] = date('M d, Y', strtotime($r['expiry_date']));

            // Dynamically evaluate active/expired/expiring status from dates
            $expiry = new DateTime($r['expiry_date']);
            if ($expiry < $today) {
                $computedStatus = 'Expired';
            } else {
                $diffDays = (int)$today->diff($expiry)->format('%r%a');
                if ($diffDays <= 60) {
                    $computedStatus = 'Expiring Soon';
                } else {
                    $computedStatus = 'Active';
                }
            }
            $r['status'] = $computedStatus;

            // Apply filter if specified
            if ($status !== '' && strtolower($status) !== 'all') {
                if (strcasecmp($computedStatus, $status) !== 0) {
                    continue;
                }
            }
            $filtered[] = $r;
        }

        jsonResponse($filtered);
        break;

    case 'POST':
        requireAdmin();
        $input = getJsonInput();

        $systemCovered = trim((string)($input['systemCovered'] ?? ($input['system_covered'] ?? '')));
        $customerId = (int)($input['userId'] ?? ($input['user_id'] ?? 0));
        $customerName = trim((string)($input['customer'] ?? ($input['customer_name'] ?? '')));
        $installDate = trim((string)($input['installDate'] ?? ($input['install_date'] ?? date('Y-m-d'))));
        $expiryDate = trim((string)($input['expiryDate'] ?? ($input['expiry_date'] ?? '')));
        $coverage = trim((string)($input['coverage'] ?? ($input['coverage_summary'] ?? 'Full parts and labor coverage per warranty policy.')));
        $projectId = isset($input['projectId']) ? (int)$input['projectId'] : null;

        if ($systemCovered === '' || $customerId <= 0) {
            jsonError('System covered and customer ID are required', 400);
        }

        $parsedInstall = date('Y-m-d', strtotime($installDate));
        $parsedExpiry = !empty($expiryDate) ? date('Y-m-d', strtotime($expiryDate)) : date('Y-m-d', strtotime('+2 years', strtotime($parsedInstall)));

        $pdo->beginTransaction();
        try {
            $year = date('Y');
            $countStmt = $pdo->query("SELECT COUNT(*) FROM warranties WHERE warranty_code LIKE 'WAR-{$year}-%'");
            $nextSeq = (int)$countStmt->fetchColumn() + 1;
            do {
                $code = sprintf('WAR-%s-%04d', $year, $nextSeq);
                $chk = $pdo->prepare('SELECT id FROM warranties WHERE warranty_code = :c LIMIT 1');
                $chk->execute([':c' => $code]);
                if (!$chk->fetch()) {
                    break;
                }
                $nextSeq++;
            } while (true);

            $insert = $pdo->prepare("
                INSERT INTO warranties (warranty_code, user_id, project_id, customer_name, system_covered, install_date, expiry_date, status, coverage_summary)
                VALUES (:code, :uid, :pid, :cname, :sys, :idate, :edate, 'Active', :cov)
            ");
            $insert->execute([
                ':code'  => $code,
                ':uid'   => $customerId,
                ':pid'   => $projectId,
                ':cname' => $customerName,
                ':sys'   => $systemCovered,
                ':idate' => $parsedInstall,
                ':edate' => $parsedExpiry,
                ':cov'   => $coverage
            ]);

            // Notify customer
            $notif = $pdo->prepare("
                INSERT INTO customer_messages (user_id, title, description, is_read)
                VALUES (:uid, :title, :desc, false)
            ");
            $notif->execute([
                ':uid'   => $customerId,
                ':title' => "Warranty Policy Active: {$code}",
                ':desc'  => "Warranty certificate for {$systemCovered} is active through " . date('M d, Y', strtotime($parsedExpiry))
            ]);

            $pdo->commit();
        } catch (Exception $e) {
            $pdo->rollBack();
            jsonError('Failed to record warranty: ' . $e->getMessage(), 500);
        }

        jsonResponse([
            'ref'           => $code,
            'warranty_code' => $code,
            'status'        => 'Active'
        ], 201, 'Warranty policy created successfully');
        break;

    default:
        jsonError('Method Not Allowed', 405);
        break;
}
