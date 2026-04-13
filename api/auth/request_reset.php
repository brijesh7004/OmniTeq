<?php
require_once __DIR__ . '/db.php';
header('Content-Type: application/json');

$data = json_decode(file_get_contents('php://input'), true) ?? [];
$email = trim($data['email'] ?? '');

if (!$email) {
    echo json_encode(['status' => 'error', 'message' => 'Email is required']);
    exit;
}

try {
    $conn = getConnection();
    
    // Check if user exists
    $stmt = $conn->prepare("SELECT id FROM users WHERE email = ? LIMIT 1");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $user = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$user) {
        // For security, don't reveal if email exists. But for this project, let's be helpful.
        echo json_encode(['status' => 'error', 'message' => 'No account found with this email']);
        exit;
    }

    // Generate token
    $token = bin2hex(random_bytes(20));
    $expires = date("Y-m-d H:i:s", strtotime("+1 hour"));

    // Save token (overwrite any existing for this email)
    $stmt = $conn->prepare("DELETE FROM password_reset_tokens WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $stmt->close();

    $stmt = $conn->prepare("INSERT INTO password_reset_tokens (email, token, expires_at) VALUES (?, ?, ?)");
    $stmt->bind_param("sss", $email, $token, $expires);
    $stmt->execute();
    $stmt->close();

    // In a real app, send email. For demo, we return the token/link.
    $resetLink = "reset-password.html?token=" . $token;

    echo json_encode([
        'status' => 'success',
        'message' => 'Reset link generated successfully!',
        'debug_link' => $resetLink // Return for testing convenience
    ]);

} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => 'Server error: ' . $e->getMessage()]);
}
?>
