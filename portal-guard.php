<?php
/**
 * BD22 Fire System & Builders Inc.
 * Server-Side Portal Guard & Authentication Middleware
 * Enforces server verification before delivering protected portal HTML.
 */

declare(strict_types=1);

require_once __DIR__ . '/includes/auth_middleware.php';

$requestedPage = basename((string)parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH));
$user = getCurrentUser();

if ($requestedPage === 'admin.html') {
    if (!$user || ($user['role'] ?? '') !== 'admin') {
        header('Location: login.html?redirect=admin&error=auth_required');
        exit;
    }
    header('Cache-Control: private, no-cache, no-store, must-revalidate');
    readfile(__DIR__ . '/admin.html');
    exit;
}

if ($requestedPage === 'customer-portal.html') {
    if (!$user) {
        header('Location: login.html?redirect=portal&error=auth_required');
        exit;
    }
    header('Cache-Control: private, no-cache, no-store, must-revalidate');
    readfile(__DIR__ . '/customer-portal.html');
    exit;
}

// Fallback redirect
header('Location: index.html');
exit;
