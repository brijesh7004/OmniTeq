<?php
// bin/ws_server.php
// A simple raw PHP WebSocket Server for testing

$host = '100.93.48.124';
$port = 3000;

echo "Starting WebSocket Server on ws://$host:$port\n";

$socket = stream_socket_server("ws://$host:$port/ws/device?device_id=dS1&device_key=123", $errno, $errstr);

if (!$socket) {
    die("$errstr ($errno)\n");
}

$clients = [];

while (true) {
    // Prepare array of sockets to read
    $read = $clients;
    $read[] = $socket;
    $write = null;
    $except = null;

    if (stream_select($read, $write, $except, 0, 10) < 1) {
        continue;
    }

    // Handle new connections
    if (in_array($socket, $read)) {
        $client = stream_socket_accept($socket);
        if ($client) {
            // Perform Handshake
            $headers = [];
            $line = fgets($client);
            $reqLine = trim($line);
            
            while ($line = fgets($client)) {
                if (trim($line) === '') break;
                if (strpos($line, ':') !== false) {
                    list($key, $val) = explode(':', $line, 2);
                    $headers[trim($key)] = trim($val);
                }
            }

            if (isset($headers['Sec-WebSocket-Key'])) {
                $key = $headers['Sec-WebSocket-Key'];
                $acceptKey = base64_encode(pack('H*', sha1($key . '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')));
                
                $upgrade = "HTTP/1.1 101 Switching Protocols\r\n" .
                           "Upgrade: websocket\r\n" .
                           "Connection: Upgrade\r\n" .
                           "Sec-WebSocket-Accept: $acceptKey\r\n\r\n";
                
                fwrite($client, $upgrade);
                $clients[] = $client;
                
                // Parse Query Params from Request Line for Device ID
                // GET /ws/device?device_id=dS1&... HTTP/1.1
                $parts = explode(' ', $reqLine);
                $path = $parts[1] ?? '';
                echo "New connection: $path\n";
            } else {
                fclose($client);
            }
        }
        
        // Remove listening socket from read array
        $key = array_search($socket, $read);
        unset($read[$key]);
    }

    // Handle incoming messages
    foreach ($read as $client) {
        $data = fread($client, 8192); // Read chunk
        
        if ($data === false || $data === '') {
            // Client disconnected
            $key = array_search($client, $clients);
            unset($clients[$key]);
            fclose($client);
            echo "Client disconnected\n";
            continue;
        }

        // Decode WebSocket Frame (Simple unmasking)
        $payload = decode_frame($data);
        if ($payload) {
            echo "Received: $payload\n";
            // Echo back or process?
            // For now just log.
        }
    }
}

function decode_frame($data) {
    if (strlen($data) < 2) return null;
    
    $bytes = array_values(unpack('C*', $data));
    $firstByte = $bytes[0];
    $secondByte = $bytes[1];
    
    $opcode = $firstByte & 0x0F;
    $isMasked = ($secondByte & 0x80) >> 7;
    $payloadLen = $secondByte & 0x7F;
    
    $headLen = 2;
    
    if ($payloadLen === 126) {
        $headLen = 4;
    } elseif ($payloadLen === 127) {
        $headLen = 10;
    }
    
    if ($isMasked) {
        $maskingKey = array_slice($bytes, $headLen, 4);
        $headLen += 4;
    }
    
    $payloadData = array_slice($bytes, $headLen);
    $text = '';
    
    if ($isMasked) {
        for ($i = 0; $i < count($payloadData); $i++) {
            $text .= chr($payloadData[$i] ^ $maskingKey[$i % 4]);
        }
    } else {
        foreach ($payloadData as $byte) {
            $text .= chr($byte);
        }
    }
    
    return $text;
}
