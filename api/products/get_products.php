<?php
header('Content-Type: application/json');
require_once '../config.php';

try {
    $conn = getConnection();
    
    // Fetch active products
    $sql = "SELECT p.* FROM products p WHERE p.isActive = 1 ORDER BY p.id ASC";
    $result = $conn->query($sql);
    $products = [];
    
    while ($row = $result->fetch_assoc()) {
        $productId = (int)$row['id'];
        
        // Fetch images
        $imgStmt = $conn->prepare("SELECT image_url FROM product_images WHERE product_id = ?");
        $imgStmt->bind_param("i", $productId);
        $imgStmt->execute();
        $imagesRes = $imgStmt->get_result()->fetch_all(MYSQLI_ASSOC);
        $row['images'] = array_column($imagesRes, 'image_url');
        $row['main_image'] = !empty($row['images']) ? $row['images'][0] : '';
        
        // Fetch features
        $featStmt = $conn->prepare("SELECT detail FROM product_key_features WHERE product_id = ?");
        $featStmt->bind_param("i", $productId);
        $featStmt->execute();
        $featRes = $featStmt->get_result()->fetch_all(MYSQLI_ASSOC);
        $row['features'] = array_column($featRes, 'detail');
        
        // Fetch use cases
        $ucStmt = $conn->prepare("SELECT topic, detail FROM product_use_cases WHERE product_id = ?");
        $ucStmt->bind_param("i", $productId);
        $ucStmt->execute();
        $row['use_cases'] = $ucStmt->get_result()->fetch_all(MYSQLI_ASSOC);
        
        $products[] = $row;
    }
    
    echo json_encode(['status' => 'success', 'products' => $products]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>
