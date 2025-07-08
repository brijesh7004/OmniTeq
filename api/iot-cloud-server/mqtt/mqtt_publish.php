<?php
// utils/mqtt_publish.php
require_once __DIR__ . '/../../../../vendor/autoload.php';

use PhpMqtt\Client\MqttClient;
use PhpMqtt\Client\Exceptions\MqttClientException;
use PhpMqtt\Client\ConnectionSettings;

function mqtt_publish(string $topic, string $message): void {
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
            ->setUseTls(true)
            ->setTlsSelfSignedAllowed(true)
            ->setTlsVerifyPeer(false)
            ->setTlsVerifyPeerName(false);
        $mqtt->connect(null, $clean_session);
        // $mqtt->subscribe($topic, function ($topic, $message) {
        //     printf("Received message on topic [%s]: %s\n", $topic, $message);
        // }, 0);
        $mqtt->publish($topic, $message, 0);  // QoS 1 (at least once)
        // $mqtt->loop(true);
        $mqtt->disconnect();
    } catch (MqttClientException $e) {
        error_log("MQTT publish error: " . $e->getMessage());
    }
}
?>
