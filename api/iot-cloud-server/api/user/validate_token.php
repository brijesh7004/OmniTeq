<?php
require_once '../../utils/auth.php';

header('Content-Type: application/json');
$headers = getallheaders();
$token = $headers['Authorization'] ?? '';

$user_id = validateToken($token);
if ($user_id) {
    echo json_encode(['valid' => true, 'user_id' => $user_id]);
} else {
    http_response_code(401);
    echo json_encode(['valid' => false, 'message' => 'Invalid or expired token']);
}
?>