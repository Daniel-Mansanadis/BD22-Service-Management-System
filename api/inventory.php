<?php
/**
 * BD22 Fire System & Builders Inc.
 * Inventory API Endpoint
 * Manages equipment, stock levels, and associated installations.
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/response.php';
require_once __DIR__ . '/../includes/auth_middleware.php';

header('Content-Type: application/json; charset=utf-8');

$pdo = getDbConnection();
$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

switch ($method) {
    case 'GET':
        requireAdmin();
        $stmt = $pdo->query('SELECT * FROM inventory_items ORDER BY id ASC');
        $results = $stmt->fetchAll();

        foreach ($results as &$r) {
            $r['id'] = $r['item_code'];
            $r['type'] = $r['item_type'];
            $r['customerProject'] = $r['customer_project'];
            $r['serviceStatus'] = $r['service_status'];
            $r['nextMaintenance'] = $r['next_maintenance'];
            $r['stockStatus'] = $r['stock_status'];
        }

        jsonResponse($results);
        break;

    case 'POST':
        requireAdmin();
        $input = getJsonInput();

        $name = trim((string)($input['name'] ?? ''));
        $type = trim((string)($input['type'] ?? 'Fire Protection Component'));
        $customerProject = trim((string)($input['customerProject'] ?? 'General Warehouse'));
        $rawQty = (int)($input['quantity'] ?? 1);
        $nextMaintenance = trim((string)($input['nextMaintenance'] ?? ''));

        if ($name === '') {
            jsonError('Equipment name is required', 400);
        }

        if ($rawQty < 0) {
            jsonError('Quantity cannot be negative', 400);
        }

        $quantity = $rawQty;
        $stockStatus = ($quantity <= 0) ? 'Out of Stock' : (($quantity <= 2) ? 'Low Stock' : 'Available');

        $pdo->beginTransaction();
        try {
            // Generate next eq-N code
            $stmt = $pdo->query('SELECT COUNT(*) FROM inventory_items');
            $nextNum = (int)$stmt->fetchColumn() + 1;
            do {
                $code = 'eq-' . $nextNum;
                $chk = $pdo->prepare('SELECT id FROM inventory_items WHERE item_code = :c LIMIT 1');
                $chk->execute([':c' => $code]);
                if (!$chk->fetch()) {
                    break;
                }
                $nextNum++;
            } while (true);

            $insert = $pdo->prepare("
                INSERT INTO inventory_items (item_code, name, item_type, quantity, customer_project, service_status, next_maintenance, stock_status)
                VALUES (:code, :name, :type, :qty, :cproj, 'Current', :nmaint, :stock)
            ");
            $insert->execute([
                ':code'   => $code,
                ':name'   => $name,
                ':type'   => $type,
                ':qty'    => $quantity,
                ':cproj'  => $customerProject,
                ':nmaint' => $nextMaintenance ?: null,
                ':stock'  => $stockStatus
            ]);

            $pdo->commit();
        } catch (Exception $e) {
            $pdo->rollBack();
            jsonError('Failed to add inventory: ' . $e->getMessage(), 500);
        }

        jsonResponse([
            'id'          => $code,
            'item_code'   => $code,
            'quantity'    => $quantity,
            'stockStatus' => $stockStatus
        ], 201, 'Equipment added successfully');
        break;

    case 'PATCH':
    case 'PUT':
        requireAdmin();
        $input = getJsonInput();
        $code = trim((string)($input['id'] ?? ($input['item_code'] ?? '')));

        if ($code === '') {
            jsonError('Equipment code is required', 400);
        }

        $stmt = $pdo->prepare('SELECT * FROM inventory_items WHERE item_code = :code LIMIT 1');
        $stmt->execute([':code' => $code]);
        $eq = $stmt->fetch();

        if (!$eq) {
            jsonError('Equipment item not found', 404);
        }

        $fields = [];
        $params = [':code' => $code];

        if (isset($input['quantity'])) {
            $newQty = (int)$input['quantity'];
            if ($newQty < 0) {
                jsonError('Quantity cannot be negative', 400);
            }
            $stockStatus = ($newQty <= 0) ? 'Out of Stock' : (($newQty <= 2) ? 'Low Stock' : 'Available');

            $fields[] = 'quantity = :qty';
            $params[':qty'] = $newQty;
            $fields[] = 'stock_status = :stock';
            $params[':stock'] = $stockStatus;
        } else {
            $newQty = (int)$eq['quantity'];
            $stockStatus = $eq['stock_status'];
        }

        if (isset($input['name'])) {
            $nameVal = trim((string)$input['name']);
            if ($nameVal === '') jsonError('Equipment name cannot be empty', 400);
            $fields[] = 'name = :name';
            $params[':name'] = $nameVal;
        }
        if (isset($input['type'])) {
            $fields[] = 'item_type = :type';
            $params[':type'] = trim((string)$input['type']);
        }
        if (isset($input['customerProject'])) {
            $fields[] = 'customer_project = :cproj';
            $params[':cproj'] = trim((string)$input['customerProject']);
        }
        if (isset($input['nextMaintenance'])) {
            $fields[] = 'next_maintenance = :nmaint';
            $params[':nmaint'] = trim((string)$input['nextMaintenance']) ?: null;
        }

        if (empty($fields)) {
            jsonError('No fields to update', 400);
        }

        $pdo->beginTransaction();
        try {
            $sql = 'UPDATE inventory_items SET ' . implode(', ', $fields) . ', updated_at = CURRENT_TIMESTAMP WHERE item_code = :code';
            $updateStmt = $pdo->prepare($sql);
            $updateStmt->execute($params);

            // If stock becomes low or depleted, alert the operations team
            if ($stockStatus !== 'Available' && $eq['stock_status'] === 'Available') {
                $alert = $pdo->prepare("
                    INSERT INTO admin_notifications (title, description, status, action_url)
                    VALUES (:title, :desc, 'New', '#admin-inventory')
                ");
                $alert->execute([
                    ':title' => "Low Stock Alert: {$eq['name']} ({$newQty} units remaining)",
                    ':desc'  => "Inventory has dropped below reserve threshold for {$eq['customer_project']}."
                ]);
            }

            $pdo->commit();
        } catch (Exception $e) {
            $pdo->rollBack();
            jsonError('Failed to update inventory: ' . $e->getMessage(), 500);
        }

        jsonResponse([
            'id'          => $code,
            'quantity'    => $newQty,
            'stockStatus' => $stockStatus
        ], 200, 'Equipment updated successfully');
        break;

    default:
        jsonError('Method Not Allowed', 405);
        break;
}
