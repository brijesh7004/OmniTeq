<?php
require_once 'config.php';

function sendResponse($status, $message, $data = null) {
    http_response_code($status);
    echo json_encode([
        'status' => $status,
        'message' => $message,
        'data' => $data
    ]);
    exit();
}

function validateRequired($data, $fields) {
    foreach ($fields as $field) {
        if (!isset($data[$field]) || empty(trim($data[$field]))) {
            sendResponse(400, "Missing required field: $field");
        }
    }
}

function getPaginationParams() {
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $size = isset($_GET['size']) ? (int)$_GET['size'] : 20;
    
    if ($page < 1) $page = 1;
    if ($size < 1) $size = 10;
    if ($size > 100) $size = 100;
    
    $offset = ($page - 1) * $size;
    
    return ['offset' => $offset, 'size' => $size];
}

function sanitizeInput($data) {
    $conn = getConnection();
    $sanitized = [];
    
    foreach ($data as $key => $value) {
        if (is_string($value)) {
            $sanitized[$key] = $conn->real_escape_string(trim($value));
        } else {
            $sanitized[$key] = $value;
        }
    }
    
    $conn->close();
    return $sanitized;
}

function getRequestData() {
    if ($_SERVER['CONTENT_TYPE'] && strpos($_SERVER['CONTENT_TYPE'], 'application/json') !== false) {
        // Handle JSON data
        $data = json_decode(file_get_contents('php://input'), true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            sendResponse(400, 'Invalid JSON data');
        }
        return $data;
    } else {
        // Handle form data
        return $_POST;
    }
}
?>
