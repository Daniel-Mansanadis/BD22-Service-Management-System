<?php
/**
 * BD22 Fire System & Builders Inc.
 * High-Performance Rate Limiter Middleware
 * Protects authentication, public forms, and APIs against brute force and DDoS.
 */

declare(strict_types=1);

require_once __DIR__ . '/response.php';

function getClientIpAddress(): string {
    $headers = [
        'HTTP_CF_CONNECTING_IP', // Cloudflare
        'HTTP_X_REAL_IP',        // Nginx proxy
        'HTTP_X_FORWARDED_FOR',  // Standard proxy
        'REMOTE_ADDR'            // Direct connection
    ];

    foreach ($headers as $header) {
        if (!empty($_SERVER[$header])) {
            $ipList = explode(',', (string)$_SERVER[$header]);
            $ip = trim($ipList[0]);
            if (filter_var($ip, FILTER_VALIDATE_IP)) {
                return $ip;
            }
        }
    }

    return '127.0.0.1';
}

/**
 * Enforces rate limiting per IP address.
 * 
 * @param string $actionIdentifier Name of the action (e.g. 'auth_login', 'auth_register', 'inquiry_submit')
 * @param int $maxAttempts Maximum number of allowed requests in window
 * @param int $windowSeconds Time window in seconds
 */
function enforceRateLimit(string $actionIdentifier, int $maxAttempts, int $windowSeconds): void {
    $ip = getClientIpAddress();
    $cacheKey = preg_replace('/[^a-zA-Z0-9_\-]/', '_', $actionIdentifier) . '_' . md5($ip);
    $storageDir = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'bd22_ratelimits';

    if (!is_dir($storageDir)) {
        @mkdir($storageDir, 0700, true);
    }

    $filePath = $storageDir . DIRECTORY_SEPARATOR . $cacheKey . '.json';
    $now = time();

    $fp = @fopen($filePath, 'c+');
    if (!$fp) {
        // If file cannot be opened, permit request to avoid breaking production
        return;
    }

    $locked = flock($fp, LOCK_EX);
    if (!$locked) {
        fclose($fp);
        return;
    }

    $raw = stream_get_contents($fp);
    $data = [];
    if (!empty($raw)) {
        $decoded = json_decode($raw, true);
        if (is_array($decoded)) {
            $data = $decoded;
        }
    }

    // Filter out timestamps outside the sliding window
    $timestamps = array_filter(
        $data['timestamps'] ?? [],
        fn($t) => is_numeric($t) && ($t > ($now - $windowSeconds))
    );

    if (count($timestamps) >= $maxAttempts) {
        $oldest = reset($timestamps);
        $retryAfter = max(1, ($oldest + $windowSeconds) - $now);
        flock($fp, LOCK_UN);
        fclose($fp);

        header('Retry-After: ' . $retryAfter);
        jsonError("Too many attempts. Rate limit exceeded. Please wait {$retryAfter} seconds before trying again.", 429);
        exit;
    }

    // Append current timestamp
    $timestamps[] = $now;
    ftruncate($fp, 0);
    rewind($fp);
    fwrite($fp, json_encode(['timestamps' => array_values($timestamps)]));
    fflush($fp);
    flock($fp, LOCK_UN);
    fclose($fp);
}
