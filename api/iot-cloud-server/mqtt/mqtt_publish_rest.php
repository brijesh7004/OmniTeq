<?php

// Publish function
function publishToEMQX($topic, $payload, $qos = 1) {
    $apiUrl = getenv('MQTT_Deploy_API');
    $appId  = getenv('MQTT_App_ID');
    $appSecret = getenv('MQTT_App_Secret');
    $url    = rtrim($apiUrl, '/') . '/publish';
    $isSuccess = false;
    //$qos    = 1;  // QoS level: 0, 1, or 2


    $postData = json_encode([
        'topic'   => $topic,
        'qos'     => $qos,
        'payload' => $payload
    ]);

    $auth = base64_encode("$appId:$appSecret");

    $headers = [
        "Content-Type: application/json",
        "Authorization: Basic $auth"
    ];

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10); // Optional timeout

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

    if (curl_errno($ch)) {
        echo "cURL Error: " . curl_error($ch) . PHP_EOL;
    } 
    else {
        // echo "Published to topic '$topic' with payload: $payload" . PHP_EOL;
        // echo "HTTP Response Code: $httpCode" . PHP_EOL;
        // echo "Response Body: $response" . PHP_EOL;
        $isSuccess = true;
    }

    curl_close($ch);

    return $isSuccess;
}
?>
