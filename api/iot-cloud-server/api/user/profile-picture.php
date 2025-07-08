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
$baseUrl = 'https://omniteq.in/api/iot-cloud-server/uploads/profile-pictures/';

try {
    switch ($_SERVER['REQUEST_METHOD']) {
        case 'POST':
            // Upload new profile picture
            if (!isset($_FILES['profile_picture'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'No file uploaded']);
                exit;
            }
            
            $file = $_FILES['profile_picture'];
            
            // Validate file type
            $allowed_types = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
            if (!in_array($file['type'], $allowed_types)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Invalid file type. Only JPEG, PNG, JPG and WebP are allowed.', 'file' => $file['type']]);
                exit;
            }
            
            // Validate file size (max 2MB)
            if ($file['size'] > 2 * 1024 * 1024) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'File size too large. Maximum allowed size is 2MB.']);
                exit;
            }
            
            // Create upload directory if not exists
            $upload_dir = __DIR__ . '/../../uploads/profile-pictures';
            if (!file_exists($upload_dir)) {
                mkdir($upload_dir, 0777, true);
            }
            
            // Generate unique filename
            $filename = 'user_' . $user_id . '_' . time() . '.' . pathinfo($file['name'], PATHINFO_EXTENSION);
            $target_path = $upload_dir . '/' . $filename;
            
            // Move uploaded file
            if (move_uploaded_file($file['tmp_name'], $target_path)) {
                // Update database
                $conn = getDB();
                $stmt = $conn->prepare("UPDATE iot_users SET profile_pic = ? WHERE id = ?");
                $stmt->execute([$filename, $user_id]);
                
                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'message' => 'Profile picture uploaded successfully',
                    'url' => $baseUrl . $filename
                ]);
            } else {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Failed to upload file']);
            }
            break;
            
        case 'GET':
            // Get current profile picture
            $conn = getDB();
            $stmt = $conn->prepare("SELECT profile_pic FROM iot_users WHERE id = ?");
            $stmt->execute([$user_id]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($user == null) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'User not found']);
                exit;
            }
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'profile_image' => $user['profile_pic'] ? 
                    $baseUrl . $user['profile_pic'] : 
                    null
            ]);
            break;
            
        case 'DELETE':
            // Delete profile picture
            $conn = getDB();
            $stmt = $conn->prepare("SELECT profile_pic FROM iot_users WHERE id = ?");
            $stmt->execute([$user_id]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($user == null) {
                http_response_code(404);
                echo json_encode([  
                    'success' => false, 
                    'message' => 'User not found'
                ]);
                exit;
            }
            
            // Delete file if exists
            if ($user['profile_pic']) {
                $file_path = $baseUrl . $user['profile_pic'];
                if (file_exists($file_path)) {
                    unlink($file_path);
                }
            }
            
            // Update database
            $stmt = $conn->prepare("UPDATE iot_users SET profile_pic = NULL WHERE id = ?");
            $stmt->execute([$user_id]);
            
            http_response_code(200);
            echo json_encode([
                'success' => true, 
                'message' => 'Profile picture deleted successfully'
            ]);
            break;
            
        default:
            http_response_code(405);
            echo json_encode([
                'success' => false, 
                'message' => 'Method not allowed'
            ]);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to update profile', 'error' => $e->getMessage()]);
}
?>
