<?php
require_once 'config.php';

function getDB() {
    try {
        $pdo = new PDO("mysql:host=" . DB_HOST1 . ";dbname=" . DB_NAME1, DB_USER, DB_PASS);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        return $pdo;
    } catch (PDOException $e) {
        die("Database connection failed: " . $e->getMessage());
    }
}
?>