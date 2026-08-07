<?php
header('Content-Type: application/json');
require_once '../config.php';

try {
    $conn = getConnection();
    
    // Fetch active products
    $sql = "SELECT p.*, (SELECT image_url FROM product_images WHERE product_id = p.id LIMIT 1) as main_image 
            FROM products p 
            WHERE p.isActive = 1 
            ORDER BY p.id ASC";
            
    $result = $conn->query($sql);
    $products = [];
    
    while ($row = $result->fetch_assoc()) {
        $products[] = $row;
    }
    
    echo json_encode(['status' => 'success', 'products' => $products]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>
