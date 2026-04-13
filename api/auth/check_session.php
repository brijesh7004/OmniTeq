<?php
session_start();
header('Content-Type: application/json');
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');

if (isset($_SESSION['user_id'])) {
    $userId = (int)$_SESSION['user_id'];
    
    // Auto-sync: If email or mobile is missing in session, fetch from DB
    if (!isset($_SESSION['email']) || !isset($_SESSION['mobile'])) {
        try {
            require_once __DIR__ . '/db.php';
            $conn = getConnection();
            $stmt = $conn->prepare('SELECT email, mobile FROM users WHERE id = ? LIMIT 1');
            $stmt->bind_param('i', $userId);
            $stmt->execute();
            $u = $stmt->get_result()->fetch_assoc();
            $stmt->close();
            
            if ($u) {
                $_SESSION['email'] = $u['email'] ?? '';
                $_SESSION['mobile'] = $u['mobile'] ?? '';
            }
        } catch (Throwable $e) {
            // Silently fail, just use what we have
        }
    }

    echo json_encode([
        'authenticated' => true,
        'user' => [
            'id' => $userId,
            'full_name' => $_SESSION['full_name'] ?? 'User',
            'email' => $_SESSION['email'] ?? '',
            'mobile' => $_SESSION['mobile'] ?? '',
            'role' => $_SESSION['role'] ?? 'customer'
        ]
    ]);
} else {
    echo json_encode([
        'authenticated' => false
    ]);
}
?>
