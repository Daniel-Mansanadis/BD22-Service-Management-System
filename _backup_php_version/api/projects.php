<?php
/**
 * BD22 Fire System & Builders Inc.
 * Projects API Endpoint
 * Handles project creation, milestone tracking, and customer synchronization.
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
        $projectId = trim((string)($_GET['id'] ?? ''));

        if ($projectId !== '') {
            $stmt = $pdo->prepare('SELECT p.*, u.full_name as owner_name, u.email as owner_email FROM projects p LEFT JOIN users u ON p.user_id = u.id WHERE p.project_code = :code OR p.id::text = :id LIMIT 1');
            $stmt->execute([':code' => $projectId, ':id' => $projectId]);
            $proj = $stmt->fetch();
            if (!$proj) {
                jsonError('Project not found', 404);
            }

            // Customer security check
            if ($user && $user['role'] !== 'admin' && (int)$proj['user_id'] !== (int)$user['id']) {
                jsonError('Access denied: You do not have permission to view this project.', 403);
            }

            $proj['customer'] = $proj['customer_name'];
            $proj['team'] = $proj['assigned_team'];
            $proj['targetDate'] = $proj['target_date'] ? date('M d, Y', strtotime($proj['target_date'])) : 'TBD';
            jsonResponse($proj);
        }

        if (!$user) {
            jsonResponse([]);
        }

        if ($user['role'] === 'admin') {
            $stmt = $pdo->prepare('SELECT * FROM projects ORDER BY id DESC');
            $stmt->execute();
            $results = $stmt->fetchAll();
        } else {
            // Strictly show projects associated with this customer
            $stmt = $pdo->prepare('SELECT * FROM projects WHERE user_id = :uid ORDER BY id DESC');
            $stmt->execute([':uid' => $user['id']]);
            $results = $stmt->fetchAll();
        }

        foreach ($results as &$r) {
            $r['id'] = $r['project_code'];
            $r['customer'] = $r['customer_name'];
            $r['team'] = $r['assigned_team'];
            $r['targetDate'] = $r['target_date'] ? date('M d, Y', strtotime($r['target_date'])) : 'TBD';
        }

        jsonResponse($results);
        break;

    case 'POST':
        requireAdmin();
        $input = getJsonInput();

        $name = trim((string)($input['name'] ?? ($input['title'] ?? '')));
        $customer = trim((string)($input['customer'] ?? ($input['client'] ?? '')));
        $targetDate = trim((string)($input['targetDate'] ?? ($input['target_date'] ?? '')));
        $milestones = trim((string)($input['milestones'] ?? ''));
        $customerId = isset($input['customerId']) ? (int)$input['customerId'] : null;

        if ($name === '' || $customer === '') {
            jsonError('Project name and customer are required', 400);
        }

        $parsedDate = !empty($targetDate) ? date('Y-m-d', strtotime($targetDate)) : date('Y-m-d', strtotime('+3 months'));

        $pdo->beginTransaction();
        try {
            // Generate project code with collision avoidance
            $countStmt = $pdo->query('SELECT COUNT(*) FROM projects');
            $nextNum = (int)$countStmt->fetchColumn() + 1;
            do {
                $code = 'proj-' . $nextNum;
                $chk = $pdo->prepare('SELECT id FROM projects WHERE project_code = :c LIMIT 1');
                $chk->execute([':c' => $code]);
                if (!$chk->fetch()) {
                    break;
                }
                $nextNum++;
            } while (true);

            // Match customer user if not explicitly given
            $targetUserId = $customerId;
            if (!$targetUserId) {
                $userMatch = $pdo->prepare('SELECT id FROM users WHERE (company ILIKE :c1 OR full_name ILIKE :c2) AND role = \'customer\' LIMIT 1');
                $userMatch->execute([':c1' => $customer, ':c2' => $customer]);
                $matchedUser = $userMatch->fetch();
                $targetUserId = $matchedUser ? (int)$matchedUser['id'] : null;
            }

            $insert = $pdo->prepare("
                INSERT INTO projects (project_code, user_id, name, customer_name, assigned_team, progress, target_date, status, milestones, description)
                VALUES (:code, :uid, :name, :cust, 'Team Alpha (Operations)', 10, :target, 'In Progress', :milestones, :desc)
            ");
            $insert->execute([
                ':code'       => $code,
                ':uid'        => $targetUserId,
                ':name'       => $name,
                ':cust'       => $customer,
                ':target'     => $parsedDate,
                ':milestones' => $milestones ?: "Phase 1: Project kick-off, engineering survey, and procurement",
                ':desc'       => "Fire protection project for {$customer}"
            ]);

            // Notify customer if project is assigned
            if ($targetUserId) {
                $notif = $pdo->prepare("
                    INSERT INTO customer_messages (user_id, title, description, is_read)
                    VALUES (:uid, :title, :desc, false)
                ");
                $notif->execute([
                    ':uid'   => $targetUserId,
                    ':title' => "New Project Initiated: {$name}",
                    ':desc'  => "Project {$code} has been scheduled with target completion on " . date('M d, Y', strtotime($parsedDate))
                ]);
            }

            $pdo->commit();
        } catch (Exception $e) {
            $pdo->rollBack();
            jsonError('Failed to create project: ' . $e->getMessage(), 500);
        }

        jsonResponse([
            'id'           => $code,
            'project_code' => $code,
            'name'         => $name,
            'customer'     => $customer
        ], 201, 'Project created successfully');
        break;

    case 'PATCH':
    case 'PUT':
        requireAdmin();
        $input = getJsonInput();
        $code = trim((string)($input['id'] ?? ($input['project_code'] ?? '')));

        if ($code === '') {
            jsonError('Project code is required', 400);
        }

        $stmt = $pdo->prepare('SELECT * FROM projects WHERE project_code = :c OR id::text = :c LIMIT 1');
        $stmt->execute([':c' => $code]);
        $existing = $stmt->fetch();
        if (!$existing) {
            jsonError('Project not found', 404);
        }

        $fields = [];
        $params = [':code' => $existing['project_code']];
        $newProgress = null;
        $newStatus = null;

        if (isset($input['progress'])) {
            $prog = max(0, min(100, (int)$input['progress']));
            $fields[] = 'progress = :prog';
            $params[':prog'] = $prog;
            $newProgress = $prog;
            if ($prog >= 100) {
                $fields[] = "status = 'Completed'";
                $newStatus = 'Completed';
            }
        }
        if (isset($input['status']) && $newStatus === null) {
            $validStatuses = ['Planning', 'In Progress', 'On Hold', 'Completed'];
            $st = trim((string)$input['status']);
            if (in_array($st, $validStatuses, true)) {
                $fields[] = 'status = :status';
                $params[':status'] = $st;
                $newStatus = $st;
            }
        }
        if (isset($input['milestones'])) {
            $fields[] = 'milestones = :milestones';
            $params[':milestones'] = trim((string)$input['milestones']);
        }
        if (isset($input['targetDate']) || isset($input['target_date'])) {
            $td = trim((string)($input['targetDate'] ?? $input['target_date']));
            $fields[] = 'target_date = :tdate';
            $params[':tdate'] = date('Y-m-d', strtotime($td));
        }

        if (empty($fields)) {
            jsonError('No fields to update', 400);
        }

        $pdo->beginTransaction();
        try {
            $sql = 'UPDATE projects SET ' . implode(', ', $fields) . ', updated_at = CURRENT_TIMESTAMP WHERE project_code = :code';
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);

            // If project is completed, automatically record in service_history for customer
            if ($newStatus === 'Completed' && $existing['status'] !== 'Completed' && !empty($existing['user_id'])) {
                $histStmt = $pdo->prepare("
                    INSERT INTO service_history (user_id, project_id, activity_type, title, description, service_date, badge, logged_by)
                    VALUES (:uid, :pid, 'Installation', :title, :desc, CURRENT_DATE, 'Project Completed', 'Engineering Admin')
                ");
                $histStmt->execute([
                    ':uid'   => $existing['user_id'],
                    ':pid'   => $existing['id'],
                    ':title' => "Project Completed: {$existing['name']}",
                    ':desc'  => "All installation milestones completed and tested per BFP Fire Code standards."
                ]);

                // Create customer notification
                $notif = $pdo->prepare("
                    INSERT INTO customer_messages (user_id, title, description, is_read)
                    VALUES (:uid, :title, :desc, false)
                ");
                $notif->execute([
                    ':uid'   => $existing['user_id'],
                    ':title' => "Project Turnover Complete: {$existing['name']}",
                    ':desc'  => "Your project has reached 100% completion. BFP certification and warranty documents are now active."
                ]);
            }

            $pdo->commit();
        } catch (Exception $e) {
            $pdo->rollBack();
            jsonError('Failed to update project: ' . $e->getMessage(), 500);
        }

        jsonResponse([
            'id'       => $existing['project_code'],
            'progress' => $newProgress ?? $existing['progress'],
            'status'   => $newStatus ?? $existing['status']
        ], 200, 'Project updated successfully');
        break;

    default:
        jsonError('Method Not Allowed', 405);
        break;
}
