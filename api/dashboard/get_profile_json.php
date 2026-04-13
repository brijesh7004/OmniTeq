<?php
require_once __DIR__ . '/../auth/db.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
    exit;
}

$userId = $_SESSION['user_id'];
$conn = getConnection();

$stmt = $conn->prepare("SELECT id, full_name, email, mobile, preferences, created_at FROM users WHERE id = ?");
$stmt->bind_param("i", $userId);
$stmt->execute();
$user = $stmt->get_result()->fetch_assoc();

if ($user) {
    if ($user['preferences']) {
        $user['preferences'] = json_decode($user['preferences'], true);
    } else {
        $user['preferences'] = [
            'email_notifications' => true,
            'sms_alerts' => true,
            'theme' => 'dark'
        ];
    }
    echo json_encode(['status' => 'success', 'user' => $user]);
} else {
    echo json_encode(['status' => 'error', 'message' => 'User not found']);
}

$stmt->close();
$conn->close();
