<?php
require_once __DIR__ . '/../config.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

header('Content-Type: application/json');

if (empty($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Not authenticated']);
    exit;
}

$userId = (int)$_SESSION['user_id'];
$conn = getConnection();

// 1. Get Stats
$stats = [
    'total_devices' => 0,
    'online_devices' => 0,
    'active_alerts' => 0,
    'open_queries' => 0
];

// Total and Online Devices
$res = $conn->query("SELECT COUNT(*) as total, SUM(CASE WHEN status = 'online' THEN 1 ELSE 0 END) as online FROM user_devices WHERE user_id = $userId");
if ($row = $res->fetch_assoc()) {
    $stats['total_devices'] = (int)$row['total'];
    $stats['online_devices'] = (int)($row['online'] ?? 0);
}

// Active Alerts (unread)
$res = $conn->query("SELECT COUNT(*) as total FROM user_alerts WHERE user_id = $userId AND is_read = 0");
if ($row = $res->fetch_assoc()) {
    $stats['active_alerts'] = (int)$row['total'];
}

// Open Queries (open or in_progress)
$res = $conn->query("SELECT COUNT(*) as total FROM support_tickets WHERE user_id = $userId AND status IN ('open', 'in_progress')");
if ($row = $res->fetch_assoc()) {
    $stats['open_queries'] = (int)$row['total'];
}

// 2. Recent Alerts (last 5)
$alerts = [];
$res = $conn->query("SELECT * FROM user_alerts WHERE user_id = $userId ORDER BY created_at DESC LIMIT 5");
while ($row = $res->fetch_assoc()) {
    $alerts[] = $row;
}

echo json_encode([
    'status' => 'success',
    'stats' => $stats,
    'alerts' => $alerts
]);

$conn->close();
