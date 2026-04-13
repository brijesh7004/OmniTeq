<?php
header('Content-Type: application/json');
require_once '../config.php';

if (!isset($_GET['id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Product ID required']);
    exit;
}

$productId = (int)$_GET['id'];

try {
    $conn = getConnection();
    
    // Fetch product info
    $stmt = $conn->prepare("SELECT * FROM products WHERE id = ?");
    $stmt->bind_param("i", $productId);
    $stmt->execute();
    $product = $stmt->get_result()->fetch_assoc();
    
    if (!$product) {
        echo json_encode(['status' => 'error', 'message' => 'Product not found']);
        exit;
    }
    
    // Fetch features
    $stmt = $conn->prepare("SELECT detail FROM product_key_features WHERE product_id = ?");
    $stmt->bind_param("i", $productId);
    $stmt->execute();
    $features = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    
    // Fetch use cases
    $stmt = $conn->prepare("SELECT topic, detail FROM product_use_cases WHERE product_id = ?");
    $stmt->bind_param("i", $productId);
    $stmt->execute();
    $useCases = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    
    // Fetch images
    $stmt = $conn->prepare("SELECT image_url FROM product_images WHERE product_id = ?");
    $stmt->bind_param("i", $productId);
    $stmt->execute();
    $images = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    
    echo json_encode([
        'status' => 'success', 
        'product' => $product,
        'features' => array_column($features, 'detail'),
        'use_cases' => $useCases,
        'images' => array_column($images, 'image_url')
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>
