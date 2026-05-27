<?php
require_once __DIR__ . '/db.php';

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
// Trust role/name stored in session, but keep an option to validate from DB later.
$role = $_SESSION['role'] ?? 'customer';
$fullName = $_SESSION['full_name'] ?? '';
$email = $_SESSION['email'] ?? '';
$mobile = $_SESSION['mobile'] ?? '';

$redirect = 'dashboard.html';
if ($role === 'admin') $redirect = 'admin.html';
if ($role === 'employee') $redirect = 'employee.html';

echo json_encode([
    'status' => 'success',
        'user' => [
            'id' => $userId,
            'full_name' => $fullName,
            'email' => $email,
            'mobile' => $mobile,
            'role' => $role
        ],
    'redirect' => $redirect
]);

