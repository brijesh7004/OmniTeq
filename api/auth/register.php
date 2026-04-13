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

$fullName = trim($data['full_name'] ?? $data['fullname'] ?? '');
$email = trim($data['email'] ?? '');
$mobile = trim($data['mobile'] ?? '');
$password = (string)($data['password'] ?? '');
$confirmPassword = (string)($data['confirm_password'] ?? '');

if (!$fullName || !$email || !$mobile || !$password || !$confirmPassword) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Missing required fields (Name, Email, Mobile, Password)']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Invalid email']);
    exit;
}

if ($password !== $confirmPassword) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Passwords do not match']);
    exit;
}

// Basic password strength check (minimum length).
if (strlen($password) < 8) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Password must be at least 8 characters']);
    exit;
}

try {
    $conn = getConnection();

    // Ensure email is unique.
    $stmt = $conn->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
    $stmt->bind_param('s', $email);
    $stmt->execute();
    $existing = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if ($existing) {
        http_response_code(409);
        echo json_encode(['status' => 'error', 'message' => 'Email already registered']);
        exit;
    }

    $passwordHash = password_hash($password, PASSWORD_DEFAULT);

    $role = 'customer';
    $status = 'active';

    $stmt = $conn->prepare('
        INSERT INTO users (full_name, email, mobile, password_hash, role, status)
        VALUES (?, ?, ?, ?, ?, ?)
    ');
    $stmt->bind_param('ssssss', $fullName, $email, $mobile, $passwordHash, $role, $status);
    $stmt->execute();
    $newId = $conn->insert_id;
    $stmt->close();

    // Auto-login: Set session details for the newly registered user.
    $_SESSION['user_id'] = (int)$newId;
    $_SESSION['role'] = $role;
    $_SESSION['full_name'] = $fullName;
    $_SESSION['email'] = $email;

    // Update last_login_time for the new user.
    $upd = $conn->prepare('UPDATE users SET last_login_at = NOW() WHERE id = ?');
    $upd->bind_param('i', $newId);
    $upd->execute();
    $upd->close();

    echo json_encode([
        'status' => 'success',
        'message' => 'Account created successfully',
        'user_id' => $newId,
        'redirect' => 'index.html'
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Registration failed', 'debug' => $e->getMessage()]);
}

