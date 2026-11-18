<?php
/**
 * BD22 Fire System & Builders Inc.
 * User Profile & Settings API Endpoint
 * Handles contact settings, password updates, and preference flags.
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/response.php';
require_once __DIR__ . '/../includes/auth_middleware.php';

header('Content-Type: application/json; charset=utf-8');

$pdo = getDbConnection();
$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
$user = requireAuth();

switch ($method) {
    case 'GET':
        $stmt = $pdo->prepare('SELECT id, role, email, full_name, first_name, last_name, company, phone, pref_sms, pref_email, pref_warranty, created_at FROM users WHERE id = :id LIMIT 1');
        $stmt->execute([':id' => $user['id']]);
        $profile = $stmt->fetch();

        if (!$profile) {
            jsonError('User not found', 404);
        }

        $profile['name'] = $profile['full_name'];
        $profile['prefSms'] = (bool)$profile['pref_sms'];
        $profile['prefEmail'] = (bool)$profile['pref_email'];
        $profile['prefWarranty'] = (bool)$profile['pref_warranty'];
        $profile['createdDate'] = date('M d, Y', strtotime($profile['created_at']));

        jsonResponse($profile);
        break;

    case 'PUT':
    case 'POST':
    case 'PATCH':
        $input = getJsonInput();

        $fields = [];
        $params = [':id' => $user['id']];

        if (isset($input['name']) || isset($input['fullName'])) {
            $name = trim((string)($input['name'] ?? $input['fullName']));
            if ($name !== '') {
                $fields[] = 'full_name = :name';
                $params[':name'] = $name;

                if (!isset($input['firstName'])) {
                    $parts = explode(' ', $name, 2);
                    $fields[] = 'first_name = :fname';
                    $params[':fname'] = $parts[0] ?? $name;
                    $fields[] = 'last_name = :lname';
                    $params[':lname'] = $parts[1] ?? '';
                }
            }
        }

        if (isset($input['firstName'])) {
            $fields[] = 'first_name = :fname';
            $params[':fname'] = trim((string)$input['firstName']);
        }
        if (isset($input['lastName'])) {
            $fields[] = 'last_name = :lname';
            $params[':lname'] = trim((string)$input['lastName']);
        }
        if (isset($input['company'])) {
            $fields[] = 'company = :company';
            $params[':company'] = trim((string)$input['company']);
        }
        if (isset($input['phone'])) {
            $fields[] = 'phone = :phone';
            $params[':phone'] = trim((string)$input['phone']);
        }
        if (isset($input['email'])) {
            $email = strtolower(trim((string)$input['email']));
            if (filter_var($email, FILTER_VALIDATE_EMAIL)) {
                // Verify email uniqueness if changing email
                $check = $pdo->prepare('SELECT id FROM users WHERE email = :email AND id != :id LIMIT 1');
                $check->execute([':email' => $email, ':id' => $user['id']]);
                if ($check->fetch()) {
                    jsonError('Email address is already in use by another account', 409);
                }
                $fields[] = 'email = :email';
                $params[':email'] = $email;
            } else {
                jsonError('Invalid email format', 400);
            }
        }

        if (isset($input['prefSms'])) {
            $fields[] = 'pref_sms = :psms';
            $params[':psms'] = filter_var($input['prefSms'], FILTER_VALIDATE_BOOLEAN) ? 'true' : 'false';
        }
        if (isset($input['prefEmail'])) {
            $fields[] = 'pref_email = :pemail';
            $params[':pemail'] = filter_var($input['prefEmail'], FILTER_VALIDATE_BOOLEAN) ? 'true' : 'false';
        }
        if (isset($input['prefWarranty'])) {
            $fields[] = 'pref_warranty = :pwarr';
            $params[':pwarr'] = filter_var($input['prefWarranty'], FILTER_VALIDATE_BOOLEAN) ? 'true' : 'false';
        }

        // Handle optional password update
        if (!empty($input['newPassword'])) {
            $newPass = (string)$input['newPassword'];
            $currentPass = (string)($input['currentPassword'] ?? '');

            if (strlen($newPass) < 6) {
                jsonError('New password must be at least 6 characters', 400);
            }

            // Verify current password
            $passCheck = $pdo->prepare('SELECT password_hash FROM users WHERE id = :id LIMIT 1');
            $passCheck->execute([':id' => $user['id']]);
            $currentHash = $passCheck->fetchColumn();

            if (!password_verify($currentPass, (string)$currentHash)) {
                jsonError('Current password verification failed', 401);
            }

            $fields[] = 'password_hash = :newhash';
            $params[':newhash'] = password_hash($newPass, PASSWORD_DEFAULT);
        }

        if (empty($fields)) {
            jsonError('No fields provided to update', 400);
        }

        $pdo->beginTransaction();
        try {
            $sql = 'UPDATE users SET ' . implode(', ', $fields) . ', updated_at = CURRENT_TIMESTAMP WHERE id = :id';
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);

            // Refresh authenticated session
            $fetch = $pdo->prepare('SELECT id, role, email, full_name, first_name, last_name, company, phone, pref_sms, pref_email, pref_warranty FROM users WHERE id = :id LIMIT 1');
            $fetch->execute([':id' => $user['id']]);
            $updated = $fetch->fetch();
            loginUser($updated);

            $pdo->commit();
        } catch (Exception $e) {
            $pdo->rollBack();
            jsonError('Failed to update profile: ' . $e->getMessage(), 500);
        }

        jsonResponse(getCurrentUser(), 200, 'Profile settings updated successfully');
        break;

    default:
        jsonError('Method Not Allowed', 405);
        break;
}
