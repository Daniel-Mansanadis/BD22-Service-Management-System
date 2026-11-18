<?php
/**
 * BD22 Fire System & Builders Inc.
 * Service History Audit Log API Endpoint
 * Tracks completed inspections, testing, certifications, and repairs.
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
        $sql = 'SELECT * FROM service_history WHERE 1=1';
        $params = [];

        if ($user['role'] !== 'admin') {
            $sql .= ' AND user_id = :uid';
            $params[':uid'] = $user['id'];
        }

        $sql .= ' ORDER BY service_date DESC, id DESC';

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $results = $stmt->fetchAll();

        foreach ($results as &$r) {
            $r['date'] = date('M d, Y', strtotime($r['service_date']));
            $r['performedBy'] = $r['logged_by'];
            $r['loggedBy'] = $r['logged_by'];
            $r['eventType'] = $r['activity_type'];
            $r['activityType'] = $r['activity_type'];
            $r['badge'] = $r['badge'];
            $r['title'] = $r['title'];
            $r['description'] = $r['description'];
        }

        jsonResponse($results);
        break;

    case 'POST':
        requireAdmin();
        $input = getJsonInput();

        $customerId = (int)($input['userId'] ?? ($input['user_id'] ?? 0));
        $activityType = trim((string)($input['activityType'] ?? ($input['activity_type'] ?? 'Maintenance')));
        $title = trim((string)($input['title'] ?? ''));
        $description = trim((string)($input['description'] ?? ''));
        $serviceDate = trim((string)($input['serviceDate'] ?? ($input['service_date'] ?? date('Y-m-d'))));
        $badge = trim((string)($input['badge'] ?? 'Passed Audit'));
        $loggedBy = trim((string)($input['loggedBy'] ?? ($input['logged_by'] ?? 'Senior Inspector')));
        $projectId = isset($input['projectId']) ? (int)$input['projectId'] : null;

        if ($title === '' || $customerId <= 0) {
            jsonError('Activity title and customer ID are required', 400);
        }

        $insert = $pdo->prepare("
            INSERT INTO service_history (user_id, project_id, activity_type, title, description, service_date, badge, logged_by)
            VALUES (:uid, :pid, :atype, :title, :desc, :sdate, :badge, :logged)
        ");
        $insert->execute([
            ':uid'   => $customerId,
            ':pid'   => $projectId,
            ':atype' => $activityType,
            ':title' => $title,
            ':desc'  => $description,
            ':sdate' => date('Y-m-d', strtotime($serviceDate)),
            ':badge' => $badge,
            ':logged'=> $loggedBy
        ]);

        jsonResponse(null, 201, 'Service history entry recorded');
        break;

    default:
        jsonError('Method Not Allowed', 405);
        break;
}
