<?php
// router.php

// Set timezone
date_default_timezone_set('UTC');

// Helper to send JSON response
function jsonResponse($data, $code = 200) {
    header('Content-Type: application/json');
    http_response_code($code);
    echo json_encode($data);
    exit;
}

// Helper to get JSON input
function getJsonInput() {
    return json_decode(file_get_contents('php://input'), true);
}

// Data file paths
$DEVICES_FILE = __DIR__ . '/../data/devices.json';
$COMMANDS_FILE = __DIR__ . '/../data/commands.json';

// Helper to read/write data
function readData($file) {
    if (!file_exists($file)) return [];
    $content = file_get_contents($file);
    return json_decode($content, true) ?: [];
}

function writeData($file, $data) {
    file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT));
}

// Routing Logic
$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

// Serve Static Files (Simple implementation)
if (preg_match('/\.(?:png|jpg|jpeg|gif|css|js|html)$/', $requestUri)) {
    $file = __DIR__ . '/../public' . $requestUri;
    if (file_exists($file)) {
        $ext = pathinfo($file, PATHINFO_EXTENSION);
        $mimes = [
            'css' => 'text/css',
            'js'  => 'application/javascript',
            'html'=> 'text/html',
            'png' => 'image/png',
            'jpg' => 'image/jpeg'
        ];
        if (isset($mimes[$ext])) header("Content-Type: $mimes[$ext]");
        readfile($file);
        exit;
    }
}

// Root -> Index
if ($requestUri === '/' || $requestUri === '/index.html') {
    readfile(__DIR__ . '/../public/index.html');
    exit;
}

// API Routes
// Regex for device routes: /api/switch/device/{id}/{action}
if (preg_match('#^/api/switch/device/([^/]+)/([^/]+)$#', $requestUri, $matches)) {
    $deviceId = $matches[1];
    $action = $matches[2];

    // 1. Report State
    if ($method === 'POST' && $action === 'report') {
        $input = getJsonInput();
        $devices = readData($DEVICES_FILE);
        
        // Update device state
        // Merge input data but ensure critical fields are present
        $telemetry = $input;
        $telemetry['last_seen'] = date('Y-m-d H:i:s');
        $telemetry['ip'] = $_SERVER['REMOTE_ADDR'];
        
        $devices[$deviceId] = $telemetry;
        
        writeData($DEVICES_FILE, $devices);
        jsonResponse(['status' => 'ok']);
    }

    // 2. Poll for commands
    if ($method === 'GET' && $action === 'poll') {
        $commands = readData($COMMANDS_FILE);
        $nextCommand = null;

        if (isset($commands[$deviceId]) && count($commands[$deviceId]) > 0) {
            // Get the first command (FIFO)
            // But usually we don't remove it until ACK? 
            // The prompt says "fetches next pending command".
            // Let's just peek at the first one.
            // Or maybe we send it and wait for ACK to remove.
            // Let's implement a simple queue.
            foreach ($commands[$deviceId] as $cmdId => $cmd) {
                if (($cmd['status'] ?? 'pending') === 'pending') {
                    $nextCommand = $cmd;
                    // Mark as sent? Or just send it.
                    // For simplicity, we send it. The ACK will remove it.
                    break;
                }
            }
        }

        jsonResponse($nextCommand ? $nextCommand : new stdClass()); // Return empty object if none
    }

    // 3. Ack Command
    if ($method === 'POST' && $action === 'ack') {
        $input = getJsonInput();
        $cmdId = $input['command_id'] ?? null;
        $status = $input['status'] ?? 'ack';

        if ($cmdId) {
            $commands = readData($COMMANDS_FILE);
            if (isset($commands[$deviceId][$cmdId])) {
                if ($status === 'ack') {
                    // Remove command on success
                    unset($commands[$deviceId][$cmdId]);
                } else {
                    // Update status on failure
                    $commands[$deviceId][$cmdId]['status'] = $status;
                }
                writeData($COMMANDS_FILE, $commands);
            }
        }
        jsonResponse(['status' => 'ok']);
    }
}

// Dashboard API Routes
if ($requestUri === '/api/dashboard/devices' && $method === 'GET') {
    jsonResponse(readData($DEVICES_FILE));
}

if ($requestUri === '/api/dashboard/command' && $method === 'POST') {
    $input = getJsonInput();
    $deviceId = $input['device_id'] ?? null;
    $command = $input['command'] ?? null;

    if ($deviceId && $command) {
        $commands = readData($COMMANDS_FILE);
        if (!isset($commands[$deviceId])) $commands[$deviceId] = [];
        
        $cmdId = uniqid();
        $commands[$deviceId][$cmdId] = [
            'command_id' => $cmdId,
            'command' => $command,
            'status' => 'pending',
            'created_at' => date('Y-m-d H:i:s')
        ];
        
        writeData($COMMANDS_FILE, $commands);
        jsonResponse(['status' => 'ok', 'command_id' => $cmdId]);
    } else {
        jsonResponse(['error' => 'Invalid input'], 400);
    }
}

// 404
http_response_code(404);
echo "Not Found";
