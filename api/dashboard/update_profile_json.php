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
$data = json_decode(file_get_contents('php://input'), true);

if (!$data || !isset($data['mode'])) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid request']);
    exit;
}

$mode = $data['mode'];

if ($mode === 'update_info') {
    $fullName = $data['full_name'] ?? '';
    $phone = $data['phone'] ?? '';
    
    $stmt = $conn->prepare("UPDATE users SET full_name = ?, mobile = ? WHERE id = ?");
    $stmt->bind_param("ssi", $fullName, $phone, $userId);
    if ($stmt->execute()) {
        $_SESSION['full_name'] = $fullName;
        $_SESSION['mobile'] = $phone;
        echo json_encode(['status' => 'success', 'message' => 'Profile updated']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Update failed: ' . $stmt->error]);
    }
    $stmt->close();

} else if ($mode === 'update_preferences') {
    $prefs = json_encode($data['preferences']);
    $stmt = $conn->prepare("UPDATE users SET preferences = ? WHERE id = ?");
    $stmt->bind_param("si", $prefs, $userId);
    $stmt->execute();
    echo json_encode(['status' => 'success']);
    $stmt->close();

} else if ($mode === 'update_security') {
    $currentPass = $data['current_password'] ?? '';
    $newPass = $data['new_password'] ?? '';
    
    $stmt = $conn->prepare("SELECT password_hash FROM users WHERE id = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $res = $stmt->get_result()->fetch_assoc();
    
    if (password_verify($currentPass, $res['password_hash'])) {
        $hashed = password_hash($newPass, PASSWORD_DEFAULT);
        $upd = $conn->prepare("UPDATE users SET password_hash = ? WHERE id = ?");
        $upd->bind_param("si", $hashed, $userId);
        $upd->execute();
        echo json_encode(['status' => 'success', 'message' => 'Password updated']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Current password incorrect']);
    }
}

$conn->close();
