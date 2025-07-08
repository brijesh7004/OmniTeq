<?php
// utils/mqtt_publish.php
require_once __DIR__ . '/../../../../vendor/autoload.php';

use PhpMqtt\Client\MqttClient;
use PhpMqtt\Client\Exceptions\MqttClientException;
use PhpMqtt\Client\ConnectionSettings;

$server   = 'keb00c20.ala.us-east-1.emqxsl.com';
// $server   = '6e871cdc0acb40ab9220a10f4a6f3498.s1.eu.hivemq.cloud';
$port     = 8883;   // TLS port
$clientId = 'php-server-' . uniqid();
$username = 'brijesh';
$password = 'Mqtt@112358';    
$clean_session = true;

try {
    $mqtt = new MqttClient($server, $port, $clientId, MqttClient::MQTT_3_1);
    $connectionSettings  = (new ConnectionSettings)
        ->setUsername($username)
        ->setPassword($password)
        ->setKeepAliveInterval(60)
        ->setConnectTimeout(3)
        ->setUseTls(false)
        ->setTlsSelfSignedAllowed(true)
        ->setTlsVerifyPeer(false)
        ->setTlsVerifyPeerName(false);

    $mqtt->connect($connectionSettings, $clean_session);

    $topic = 'device/234/status';
    $message = 'Hello world!';
    $mqtt->publish($topic, $message, 0);

    $mqtt->disconnect();

    echo "Publishing to $topic: $message\n";
} catch (MqttClientException $e) {
    error_log("MQTT publish error: " . $e->getMessage());
    echo "MQTT publish error: " . $e->getMessage();
}
?>
