<?php
require_once 'config.php';

try {
    $conn = getConnection();
    echo json_encode([
        'status' => 200,
        'message' => 'Database connection successful',
        'server_info' => $conn->server_info,
        'client_info' => $conn->client_info,
        'host_info' => $conn->host_info
    ]);
    $conn->close();
} catch (Exception $e) {
    echo json_encode([
        'status' => 500,
        'message' => 'Error',
        'error' => $e->getMessage()
    ]);
}
?>
