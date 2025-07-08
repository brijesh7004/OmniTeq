<?php
require_once '../../utils/db.php';

header('Content-Type: application/json');
$data = json_decode(file_get_contents('php://input'), true);

$username = $data['username'] ?? '';
$email = $data['email'] ?? '';
$password = password_hash($data['password'] ?? '', PASSWORD_DEFAULT);

if (!$username || !$email || !$password) {
    http_response_code(400);
    echo json_encode(['message' => 'Missing fields']);
    exit;
}

try {
    $db = getDB();
    $stmt = $db->prepare("INSERT INTO iot_users (username, email, password) VALUES (?, ?, ?)");
    $stmt->execute([$username, $email, $password]);
    echo json_encode(['message' => 'User created successfully']);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['message' => 'User creation failed', 'error' => $e->getMessage()]);
}
?>