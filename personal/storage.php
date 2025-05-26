<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

define("CIPHER_METHOD", "AES-256-CBC");
define("FILE_PATH", __DIR__ . "/data.enc");

function getUserKey() {
    $userKeyword = $_POST['keyword'] ?? $_GET['keyword'] ?? null;
    if (!$userKeyword || strlen(trim($userKeyword)) < 3) {
        forbid("Missing or invalid keyword");
    }
    return hash('sha256', $userKeyword, true);
}

function encrypt($plaintext, $key) {
    $iv = openssl_random_pseudo_bytes(16);
    $cipher = openssl_encrypt($plaintext, CIPHER_METHOD, $key, OPENSSL_RAW_DATA, $iv);
    return base64_encode($iv . $cipher);
}

function decrypt($encrypted, $key) {
    $data = base64_decode($encrypted);
    if ($data === false || strlen($data) < 17) return false;
    $iv = substr($data, 0, 16);
    $cipher = substr($data, 16);
    return openssl_decrypt($cipher, CIPHER_METHOD, $key, OPENSSL_RAW_DATA, $iv);
}

function forbid($msg = "403 Forbidden - Access denied") {
    header('HTTP/1.1 403 Forbidden');
    echo json_encode(["error" => $msg]);
    exit;
}

$key = getUserKey();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $plainData = $_POST['data'] ?? '';
    $encData = encrypt($plainData, $key);
    if (file_put_contents(FILE_PATH, $encData) === false) {
        echo json_encode(["error" => "Could not write file."]);
    } else {
        echo json_encode(["status" => "OK"]);
    }
} else {
    if (file_exists(FILE_PATH)) {
        $encData = file_get_contents(FILE_PATH);
        $decrypted = decrypt($encData, $key);
        if ($decrypted === false) {
            forbid("Decryption failed");
        }
        echo $decrypted;
    } else {
        echo "[]";
    }
}
?>
