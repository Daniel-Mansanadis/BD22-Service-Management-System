<?php

declare(strict_types=1);

function bd22LoadEnvironmentFile(string $path): void {
    if (!is_file($path)) {
        return;
    }

    $lines = file($path, FILE_IGNORE_NEW_LINES);
    if ($lines === false) {
        throw new RuntimeException('Unable to read the project environment file.');
    }

    foreach ($lines as $lineNumber => $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#')) {
            continue;
        }

        if (str_starts_with($line, 'export ')) {
            $line = substr($line, 7);
        }

        $separator = strpos($line, '=');
        if ($separator === false) {
            throw new RuntimeException('Invalid environment assignment on line ' . ($lineNumber + 1) . '.');
        }

        $name = trim(substr($line, 0, $separator));
        $value = trim(substr($line, $separator + 1));
        if (!preg_match('/^[A-Za-z_][A-Za-z0-9_]*$/', $name)) {
            throw new RuntimeException('Invalid environment variable name on line ' . ($lineNumber + 1) . '.');
        }

        if (strlen($value) >= 2 && (($value[0] === '"' && $value[-1] === '"') || ($value[0] === "'" && $value[-1] === "'"))) {
            $value = substr($value, 1, -1);
        }

        if (getenv($name) === false) {
            putenv($name . '=' . $value);
            $_ENV[$name] = $value;
        }
    }
}

bd22LoadEnvironmentFile(dirname(__DIR__) . DIRECTORY_SEPARATOR . '.env');

define('SUPABASE_DB_URL', getenv('SUPABASE_DB_URL') ?: '');

define('DB_DRIVER', getenv('DB_DRIVER') ?: (!empty(SUPABASE_DB_URL) ? 'pgsql' : 'mysql'));
define('DB_HOST',   getenv('DB_HOST')   ?: '127.0.0.1');
define('DB_PORT',   getenv('DB_PORT')   ?: (DB_DRIVER === 'pgsql' ? '6543' : '3306'));
define('DB_NAME',   getenv('DB_NAME')   ?: (DB_DRIVER === 'pgsql' ? 'postgres' : 'bd22_db'));
define('DB_USER',   getenv('DB_USER')   ?: (DB_DRIVER === 'pgsql' ? 'postgres' : 'root'));
define('DB_PASS',   getenv('DB_PASS')   ?: '');

function getDbConnection(): PDO {
    static $pdo = null;

    if ($pdo === null) {
        $supabaseUrl = trim(SUPABASE_DB_URL);

        if (!empty($supabaseUrl)) {
            $parsed = parse_url($supabaseUrl);
            if (!$parsed || empty($parsed['host'])) {
                handleDbError('Supabase URI', new PDOException('Invalid SUPABASE_DB_URL format.'));
            }

            $host = $parsed['host'];
            $port = (string)($parsed['port'] ?? 6543);
            $user = urldecode($parsed['user'] ?? 'postgres');
            $pass = urldecode($parsed['pass'] ?? '');
            $db   = ltrim($parsed['path'] ?? 'postgres', '/');

            $dsn = sprintf('pgsql:host=%s;port=%s;dbname=%s;sslmode=require', $host, $port, $db);
            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => true
            ];

            try {
                $pdo = new PDO($dsn, $user, $pass, $options);
                return $pdo;
            } catch (PDOException $e) {
                handleDbError('Supabase PostgreSQL', $e);
            }
        }

        $driver = strtolower(DB_DRIVER);

        if ($driver === 'pgsql') {
            $dsn = sprintf(
                'pgsql:host=%s;port=%s;dbname=%s;sslmode=require',
                DB_HOST,
                DB_PORT,
                DB_NAME
            );
            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => true
            ];
        } else {
            $dsn = sprintf(
                'mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4',
                DB_HOST,
                DB_PORT,
                DB_NAME
            );
            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
            ];
        }

        try {
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            handleDbError($driver === 'pgsql' ? 'Supabase PostgreSQL' : 'MySQL/MariaDB', $e);
        }
    }

    return $pdo;
}

function handleDbError(string $serverName, PDOException $e): void {
    if (php_sapi_name() === 'cli') {
        fwrite(STDERR, "Database connection error ({$serverName}): " . $e->getMessage() . PHP_EOL);
        exit(1);
    }

    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'success' => false,
        'error'   => "Database connection failed. Please check the server-side environment configuration for {$serverName}.",
        'details' => $e->getMessage()
    ]);
    exit;
}
