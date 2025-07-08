<?php
require_once '../../utils/db.php';
require_once '../../utils/auth.php';

header('Content-Type: application/json');

// Get token from header and validate user
$headers = getallheaders();
$token = $headers['Authorization'] ?? '';
$user_id = validateToken($token);

if (!$user_id) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$username = $data['username'] ?? NULL;
$email = $data['email'] ?? NULL;
$mobile = $data['mobile'] ?? NULL;
if ($username==null && $email==null && $mobile==null) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'atleast one of Username, email and mobile is required']);
    exit;
}


try {
    $db = getDB();
    $stmt = $db->prepare("SELECT id FROM iot_users WHERE email = ? AND id != ?");
    $stmt->execute([$email, $user_id]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($result) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Email already exists']);
        exit;
    }

    // Build SQL query based on parameters
    $sql = "UPDATE iot_users SET ";
    $params = [];
    $isUpdate = false;
    
    if ($username !== null) {
        $sql .= " username = ?";
        $params[] = $username;
        $isUpdate = true;
    }

    if ($email !== null) {
        if ($isUpdate) { $sql .= ", "; } 
        $sql .= " email = ?";
        $params[] = $email;
        $isUpdate = true;
    }

    if ($mobile !== null) {
        if ($isUpdate) { $sql .= ", "; } 
        $sql .= " mobile = ?";
        $params[] = $mobile;
    }

    $sql .= " WHERE id = ?";
    $params[] = $user_id;

    // Prepare and execute query
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    
    http_response_code(200);
    echo json_encode(['success' => true, 'message' => 'Profile updated successfully']);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to update profile', 'error' => $e->getMessage()]);
}
?>
