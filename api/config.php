<?php
// Enable error reporting for debugging
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Database configuration
define('DB_HOST', 'localhost'); // Usually 'localhost' for cPanel
define('DB_USERNAME', 'omniteq_user'); // cPanel username_mysql-username
define('DB_PASSWORD', 'omniteq@123'); // Your MySQL user password
define('DB_NAME', 'omniteq_db'); // cPanel username_database-name

// Mail server configuration
define('MAIL_HOST_TLS', 'mail.omniteq.in');
define('MAIL_HOST_SSL', 'omniteq.in');
define('MAIL_USERNAME', getenv('MAIL_USERNAME'));
define('MAIL_PASSWORD', getenv('MAIL_PASSWORD'));
define('MAIL_PORT_TLS', 587);
define('MAIL_PORT_SSL', 465);
define('MAIL_FROM', 'noreply@omniteq.in');
define('MAIL_FROM_NAME', 'OmniTeq Support');

// Additional mail settings
define('mail_host', MAIL_HOST_SSL);
define('mail_port', MAIL_PORT_SSL);
define('sendmail_from', MAIL_FROM);

// Admin email addresses
define('CONTACT_EMAIL', 'contact@omniteq.in');
define('SUPPORT_EMAIL', 'support@omniteq.in');
define('QUOTES_EMAIL', 'quotes@omniteq.in');

// Create database connection
function getConnection() {
    try {
        $conn = new mysqli(DB_HOST, DB_USERNAME, DB_PASSWORD, DB_NAME);
        
        if ($conn->connect_error) {
            throw new Exception("Connection failed: " . $conn->connect_error);
        }
        
        // Set charset to utf8mb4
        $conn->set_charset('utf8mb4');
        
        return $conn;
    } catch (Exception $e) {
        error_log('Database connection error: ' . $e->getMessage());
        header('HTTP/1.1 500 Internal Server Error');
        header('Content-Type: application/json');
        echo json_encode([
            'status' => 500,
            'message' => 'Database connection error',
            'debug_message' => $e->getMessage()
        ]);
        exit();
    }
}

// Enable CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
?>
