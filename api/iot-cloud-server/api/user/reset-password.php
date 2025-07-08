<?php
session_start();
require_once __DIR__ . '/../../utils/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Get form data
$reset_token = $_POST['token'] ?? '';
$password = $_POST['password'] ?? '';
$confirm_password = $_POST['confirm_password'] ?? '';
$returnUrl = '/reset-password.php?token='.$reset_token;

// Validate passwords match
if ($password !== $confirm_password) {
    http_response_code(400);
    //echo json_encode(['success' => false, 'message' => 'Passwords do not match!']);
    header('Location: '.$returnUrl.'&success=false&error=Passwords do not match!');
    exit;
}

// Validate password strength
if (strlen($password) < 8) {
    http_response_code(400);
    //echo json_encode(['success' => false, 'message' => 'Password must be at least 8 characters long!']);
    header('Location: '.$returnUrl.'&success=false&error=Password must be at least 8 characters long!');
    exit;
}

try {
    $db = getDB();
    $stmt = $db->prepare("SELECT id, reset_token, reset_expires FROM iot_users WHERE reset_token = ?");
    $stmt->execute([$reset_token]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($user == null) {
        http_response_code(400);
        //echo json_encode(['success' => false, 'message' => 'Invalid reset token']);
        header('Location: '.$returnUrl.'&success=false&error=Invalid reset token');
        exit;
    }
    
    $current_time = date('Y-m-d H:i:s');
    
    if ($current_time > $user['reset_expires']) {
        http_response_code(400);
        // echo json_encode(['success' => false, 'message' => 'Reset token has expired']);
        header('Location: '.$returnUrl.'&success=false&error=Reset token has expired');
        exit;
    }
    
    // Hash the new password
    $hashed_password = password_hash($password, PASSWORD_DEFAULT);
    
    // Update user's password and clear reset token
    $stmt = $db->prepare("UPDATE iot_users SET password = ?, reset_token = NULL, reset_expires = NULL WHERE id = ?");
    $stmt->execute([$hashed_password, $user['id']]);
    
    // Redirect to success page
    header('Location: '.$returnUrl.'&success=true');
    exit;
    
} catch (Exception $e) {
    http_response_code(500);
    //echo json_encode(['success' => false, 'message' => 'Failed to reset password', 'error' => $e->getMessage()]);
    header('Location: '.$returnUrl.'&success=false&error=Failed to reset password');
   exit;
}
?>
