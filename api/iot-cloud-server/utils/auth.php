<?php
require_once 'config.php';

function generateToken($user_id) {
    $accessPayload  = [
        'uid' => $user_id,
        'iat' => time(),
        'exp' => time() + (3600 * 24)
    ];
    return base64_encode(json_encode($accessPayload )) . '.' . hash_hmac('sha256', json_encode($payload), JWT_SECRET);
}

function validateToken($token) {
    $parts = explode('.', $token);
    if (count($parts) !== 2) return false;

    $payload = json_decode(base64_decode($parts[0]), true);
    $signature = $parts[1];

    if (hash_hmac('sha256', json_encode($payload), JWT_SECRET) !== $signature) return false;
    if (time() > $payload['exp']) return false;

    return $payload['uid'];
}
?>