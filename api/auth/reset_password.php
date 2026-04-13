<?php
require_once __DIR__ . '/db.php';
header('Content-Type: application/json');

$data = json_decode(file_get_contents('php://input'), true) ?? [];
$token = trim($data['token'] ?? '');
$password = trim($data['password'] ?? '');

if (!$token || !$password) {
    echo json_encode(['status' => 'error', 'message' => 'Missing token or password']);
    exit;
}

try {
    $conn = getConnection();
    
    // Validate token
    $stmt = $conn->prepare("SELECT email FROM password_reset_tokens WHERE token = ? AND expires_at > NOW() LIMIT 1");
    $stmt->bind_param("s", $token);
    $stmt->execute();
    $resetData = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$resetData) {
        echo json_encode(['status' => 'error', 'message' => 'Invalid or expired token']);
        exit;
    }

    $email = $resetData['email'];
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

    // Update User
    $stmt = $conn->prepare("UPDATE users SET password_hash = ? WHERE email = ?");
    $stmt->bind_param("ss", $hashedPassword, $email);
    if ($stmt->execute()) {
        // Success: Clean up ALL tokens for this email
        $stmt->close();
        $stmt = $conn->prepare("DELETE FROM password_reset_tokens WHERE email = ?");
        $stmt->bind_param("s", $email);
        $stmt->execute();
        $stmt->close();

        echo json_encode(['status' => 'success', 'message' => 'Password reset successfully!']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Failed to update password']);
    }

} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => 'Server error: ' . $e->getMessage()]);
}
?>
