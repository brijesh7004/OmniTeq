<?php

$server   = 'keb00c20.ala.us-east-1.emqxsl.com';
// $server   = '6e871cdc0acb40ab9220a10f4a6f3498.s1.eu.hivemq.cloud';
$port     = 8883;   // TLS port

$fp = fsockopen($server, $port, $errno, $errstr, 5);
if (!$fp) {
    echo "Port $port is BLOCKED: $errstr ($errno)";
} else {
    echo "Port $port is OPEN!";
    fclose($fp);
}
?>