<?php
/**
 * BD22 Fire System & Builders Inc.
 * Messages & Notifications API Endpoint
 * Handles communication between customer accounts and administration.
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/response.php';
require_once __DIR__ . '/../includes/auth_middleware.php';

header('Content-Type: application/json; charset=utf-8');

$pdo = getDbConnection();
$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
$user = getCurrentUser();

if (!$user) {
    jsonResponse([]);
}

switch ($method) {
    case 'GET':
        if ($user['role'] === 'admin') {
            $stmt = $pdo->query('SELECT * FROM admin_notifications ORDER BY id DESC LIMIT 50');
            $results = $stmt->fetchAll();
            foreach ($results as &$r) {
                $r['actionUrl'] = $r['action_url'];
                $r['desc'] = $r['description'];
                $r['time'] = date('M d, Y h:i A', strtotime($r['created_at']));
            }
        } else {
            $stmt = $pdo->prepare('SELECT * FROM customer_messages WHERE user_id = :uid ORDER BY id DESC LIMIT 50');
            $stmt->execute([':uid' => $user['id']]);
            $results = $stmt->fetchAll();
            foreach ($results as &$r) {
                $r['desc'] = $r['description'];
                $r['read'] = (bool)$r['is_read'];
                $r['time'] = date('M d, Y h:i A', strtotime($r['created_at']));
            }
        }

        jsonResponse($results);
        break;

    case 'POST':
        $user = requireAuth();
        $input = getJsonInput();

        $title = trim((string)($input['title'] ?? ''));
        $content = trim((string)($input['message'] ?? ($input['content'] ?? ($input['description'] ?? ''))));

        if ($title === '' && $content === '') {
            jsonError('Message content cannot be empty', 400);
        }

        $pdo->beginTransaction();
        try {
            if ($user['role'] === 'admin') {
                // Admin sends to a customer
                $targetUserId = (int)($input['userId'] ?? ($input['user_id'] ?? ($input['customerId'] ?? 0)));
                if ($targetUserId <= 0) {
                    jsonError('Recipient customer ID is required', 400);
                }

                // Verify recipient
                $chk = $pdo->prepare('SELECT id FROM users WHERE id = :id AND role = \'customer\' LIMIT 1');
                $chk->execute([':id' => $targetUserId]);
                if (!$chk->fetch()) {
                    jsonError('Recipient customer does not exist', 404);
                }

                $stmt = $pdo->prepare("
                    INSERT INTO customer_messages (user_id, title, description, is_read)
                    VALUES (:uid, :title, :desc, false)
                ");
                $stmt->execute([
                    ':uid'   => $targetUserId,
                    ':title' => $title ?: 'Operations Notification',
                    ':desc'  => $content
                ]);
            } else {
                // Customer sends message to Admin
                $stmt = $pdo->prepare("
                    INSERT INTO admin_notifications (title, description, status, action_url)
                    VALUES (:title, :desc, 'New', '#admin-notifications')
                ");
                $stmt->execute([
                    ':title' => "Customer Message: " . ($title ?: $user['full_name']),
                    ':desc'  => $content . " (From: {$user['full_name']} <{$user['email']}>)"
                ]);
            }

            $pdo->commit();
        } catch (Exception $e) {
            $pdo->rollBack();
            jsonError('Failed to send message: ' . $e->getMessage(), 500);
        }

        jsonResponse(null, 201, 'Message dispatched successfully');
        break;

    case 'PATCH':
    case 'PUT':
        $input = getJsonInput();
        $id = (int)($input['id'] ?? 0);

        $pdo->beginTransaction();
        try {
            if ($user['role'] === 'admin') {
                if ($id > 0) {
                    $stmt = $pdo->prepare("UPDATE admin_notifications SET status = 'Read' WHERE id = :id");
                    $stmt->execute([':id' => $id]);
                } else {
                    $pdo->query("UPDATE admin_notifications SET status = 'Read' WHERE status = 'New'");
                }
            } else {
                if ($id > 0) {
                    $stmt = $pdo->prepare('UPDATE customer_messages SET is_read = true WHERE id = :id AND user_id = :uid');
                    $stmt->execute([':id' => $id, ':uid' => $user['id']]);
                } else {
                    $stmt = $pdo->prepare('UPDATE customer_messages SET is_read = true WHERE user_id = :uid');
                    $stmt->execute([':uid' => $user['id']]);
                }
            }

            $pdo->commit();
        } catch (Exception $e) {
            $pdo->rollBack();
            jsonError('Failed to update read status: ' . $e->getMessage(), 500);
        }

        jsonResponse(null, 200, 'Notification marked as read');
        break;

    default:
        jsonError('Method Not Allowed', 405);
        break;
}
