<?php
/**
 * BD22 Fire System & Builders Inc.
 * Services Catalog API Endpoint
 * Serves active services and compliance standards from database.
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/response.php';

header('Content-Type: application/json; charset=utf-8');

$pdo = getDbConnection();
$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

if ($method !== 'GET') {
    jsonError('Method Not Allowed', 405);
}

$stmt = $pdo->query('SELECT * FROM services WHERE is_active = true ORDER BY id ASC');
$services = $stmt->fetchAll();

foreach ($services as &$s) {
    if (isset($s['standards']) && is_string($s['standards'])) {
        $s['standards'] = json_decode($s['standards'], true) ?: [];
    }
}

jsonResponse($services);
