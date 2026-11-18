<?php
/**
 * BD22 Fire System & Builders Inc.
 * Authentication Middleware & Session Management
 */

declare(strict_types=1);

require_once __DIR__ . '/response.php';

function initSession(): void {
    if (session_status() === PHP_SESSION_NONE) {
        $cookieParams = session_get_cookie_params();
        session_set_cookie_params([
            'lifetime' => $cookieParams['lifetime'],
            'path'     => '/',
            'domain'   => $cookieParams['domain'],
            'secure'   => isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on',
            'httponly' => true,
            'samesite' => 'Lax'
        ]);
        session_start();
    }

    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
}

initSession();

function getCsrfToken(): string {
    return $_SESSION['csrf_token'] ?? '';
}

function verifyCsrf(): void {
    // Only check for state-altering HTTP methods
    $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
    if (in_array($method, ['GET', 'HEAD', 'OPTIONS'], true)) {
        return;
    }

    $token = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? null;
    if (!$token) {
        $input = getJsonInput();
        $token = $input['csrf_token'] ?? ($_POST['csrf_token'] ?? null);
    }

    if (!$token || !hash_equals($_SESSION['csrf_token'] ?? '', $token)) {
        jsonError('Invalid or missing CSRF token', 403);
    }
}

function getCurrentUser(): ?array {
    return $_SESSION['user'] ?? null;
}

function isAuthenticated(): bool {
    return !empty($_SESSION['user']['id']);
}

function requireAuth(): array {
    if (!isAuthenticated()) {
        jsonError('Authentication required. Please sign in.', 401);
    }
    return $_SESSION['user'];
}

function requireAdmin(): array {
    $user = requireAuth();
    if (($user['role'] ?? '') !== 'admin') {
        jsonError('Access denied: Administrator privileges required.', 403);
    }
    return $user;
}

function requireCustomer(): array {
    $user = requireAuth();
    if (($user['role'] ?? '') !== 'customer') {
        jsonError('Access denied: Customer account required.', 403);
    }
    return $user;
}

function loginUser(array $user): void {
    session_regenerate_id(true);
    unset($user['password_hash']);
    $_SESSION['user'] = $user;
}

function logoutUser(): void {
    $_SESSION = [];
    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(
            session_name(),
            '',
            time() - 42000,
            $params["path"],
            $params["domain"],
            $params["secure"],
            $params["httponly"]
        );
    }
    session_destroy();
}
