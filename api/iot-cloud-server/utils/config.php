<?php
define('DB_HOST1', 'localhost');
define('DB_USER', 'omniteq_user');
define('DB_PASS', 'omniteq@123');
define('DB_NAME1', 'omniteq_db');
define('JWT_SECRET', 'your_super_secret_key');

// Enable CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");
?>