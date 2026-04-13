<?php
require_once __DIR__ . '/db.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

header('Content-Type: application/json');

if (strpos($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') !== false) {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true) ?? [];
} else {
    $data = $_POST;
}

$email = trim($data['email'] ?? '');
$password = (string)($data['password'] ?? '');

if (!$email || !$password) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Missing email or password']);
    exit;
}

try {
    $conn = getConnection();

    $stmt = $conn->prepare('SELECT id, full_name, email, mobile, password_hash, role, status FROM users WHERE email = ? LIMIT 1');
    $stmt->bind_param('s', $email);
    $stmt->execute();
    $user = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$user || !password_verify($password, $user['password_hash'])) {
        http_response_code(401);
        echo json_encode(['status' => 'error', 'message' => 'Invalid credentials']);
        exit;
    }

    if (($user['status'] ?? 'disabled') !== 'active') {
        http_response_code(403);
        echo json_encode(['status' => 'error', 'message' => 'Account disabled']);
        exit;
    }

    // Set session for dashboard/admin/employee access.
    $_SESSION['user_id'] = (int)$user['id'];
    $_SESSION['role'] = $user['role'] ?? 'customer';
    $_SESSION['full_name'] = $user['full_name'] ?? '';
    $_SESSION['email'] = $user['email'] ?? '';
    $_SESSION['mobile'] = $user['mobile'] ?? '';

    $upd = $conn->prepare('UPDATE users SET last_login_at = NOW() WHERE id = ?');
    $upd->bind_param('i', $user['id']);
    $upd->execute();
    $upd->close();

    $role = $user['role'] ?? 'customer';
    $redirect = 'index.html'; // Redirect to home page as requested

    echo json_encode([
        'status' => 'success',
        'message' => 'Login successful',
        'redirect' => 'index.html',
        'user' => [
            'id' => (int)$user['id'],
            'full_name' => $user['full_name'],
            'email' => $user['email'],
            'role' => $role
        ]
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Login failed', 'debug' => $e->getMessage()]);
}

