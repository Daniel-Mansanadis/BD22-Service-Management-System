<?php
/**
 * BD22 Fire System & Builders Inc.
 * Authentication & Session API Endpoint
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/response.php';
require_once __DIR__ . '/../includes/auth_middleware.php';

header('Content-Type: application/json; charset=utf-8');

$action = $_GET['action'] ?? '';
$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
$pdo = getDbConnection();

switch ($action) {
    case 'csrf':
        jsonResponse([
            'csrf_token' => getCsrfToken()
        ]);
        break;

    case 'me':
        $user = getCurrentUser();
        jsonResponse([
            'authenticated' => $user !== null,
            'user'          => $user,
            'csrf_token'    => getCsrfToken()
        ]);
        break;

    case 'login':
        if ($method !== 'POST') {
            jsonError('Method Not Allowed', 405);
        }

        $input = getJsonInput();
        $email = trim((string)($input['email'] ?? ''));
        $password = (string)($input['password'] ?? '');

        if ($email === '' || $password === '') {
            jsonError('Email and password are required', 400);
        }

        $stmt = $pdo->prepare('SELECT * FROM users WHERE email = :email LIMIT 1');
        $stmt->execute([':email' => $email]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($password, $user['password_hash'])) {
            jsonError('Invalid email or password', 401);
        }

        loginUser($user);

        $redirect = ($user['role'] === 'admin') ? 'admin.html' : 'customer-portal.html';

        jsonResponse([
            'user'       => getCurrentUser(),
            'redirect'   => $redirect,
            'csrf_token' => getCsrfToken()
        ], 200, 'Login successful');
        break;

    case 'register':
        if ($method !== 'POST') {
            jsonError('Method Not Allowed', 405);
        }

        $input = getJsonInput();
        $name = trim((string)($input['name'] ?? ($input['fullName'] ?? ($input['full_name'] ?? ''))));
        $company = trim((string)($input['company'] ?? ''));
        $email = strtolower(trim((string)($input['email'] ?? '')));
        $phone = trim((string)($input['phone'] ?? ''));
        $password = (string)($input['password'] ?? '');

        if ($name === '' || $email === '' || $password === '') {
            jsonError('Full name, email, and password are required', 400);
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            jsonError('Please provide a valid email address', 400);
        }

        if (strlen($password) < 6) {
            jsonError('Password must be at least 6 characters long', 400);
        }

        // Check if email already registered
        $checkStmt = $pdo->prepare('SELECT id FROM users WHERE email = :email LIMIT 1');
        $checkStmt->execute([':email' => $email]);
        if ($checkStmt->fetch()) {
            jsonError('An account with this email address already exists', 409);
        }

        $hash = password_hash($password, PASSWORD_DEFAULT);

        // Split name into first and last name if possible
        $parts = explode(' ', $name, 2);
        $firstName = $parts[0] ?? $name;
        $lastName = $parts[1] ?? '';

        $insertStmt = $pdo->prepare("
            INSERT INTO users (role, email, password_hash, full_name, first_name, last_name, company, phone)
            VALUES ('customer', :email, :hash, :full_name, :first_name, :last_name, :company, :phone)
        ");

        $insertStmt->execute([
            ':email'      => $email,
            ':hash'       => $hash,
            ':full_name'  => $name,
            ':first_name' => $firstName,
            ':last_name'  => $lastName,
            ':company'    => $company,
            ':phone'      => $phone
        ]);

        // Get newly inserted user
        $fetchStmt = $pdo->prepare('SELECT * FROM users WHERE email = :email LIMIT 1');
        $fetchStmt->execute([':email' => $email]);
        $createdUser = $fetchStmt->fetch();
        $newUserId = (int)$createdUser['id'];

        // Seed welcome message
        $msgStmt = $pdo->prepare("
            INSERT INTO customer_messages (user_id, title, description)
            VALUES (:uid, 'Welcome to BD22 Fire System Portal', 'Your account is active. You can now request fire protection services, review project milestones, monitor warranties, and track BFP compliance audits.')
        ");
        $msgStmt->execute([':uid' => $newUserId]);

        loginUser($createdUser);

        jsonResponse([
            'user'       => getCurrentUser(),
            'redirect'   => 'customer-portal.html',
            'csrf_token' => getCsrfToken()
        ], 201, 'Account created successfully');
        break;

    case 'logout':
        logoutUser();
        jsonResponse(null, 200, 'Logged out successfully');
        break;

    default:
        jsonError('Unknown authentication action', 404);
        break;
}
