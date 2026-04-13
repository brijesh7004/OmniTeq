# IoT Device Manager Webapp

A simple local web application to test IoT devices connecting via HTTP API and WebSocket.

## Prerequisites

- **PHP**: Ensure PHP is installed and added to your system PATH.
  - Test by running `php -v` in your terminal.

## Project Structure

- `public/`: Frontend files (HTML, CSS, JS).
- `api/`: Backend PHP logic (`router.php`).
- `bin/`: WebSocket server script.
- `data/`: JSON files for storing device state and commands.

## How to Run

### 1. Start the HTTP API & Dashboard

Open a terminal in the project root and run:

```bash
php -S localhost:3000 api/router.php
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

### 2. Start the WebSocket Server

Open a **second** terminal and run:

```bash
php bin/ws_server.php
```

This will start the WebSocket server on **port 3001**.
> **Note**: Standard PHP cannot easily handle HTTP and WebSocket on the same port. Please configure your device to connect to `ws://<HOST>:3001` if possible.

## API Endpoints (Port 3000)

- `POST /api/switch/device/:deviceId/report` - Device reports state.
- `GET /api/switch/device/:deviceId/poll` - Device checks for commands.
- `POST /api/switch/device/:deviceId/ack` - Device acknowledges commands.

## WebSocket (Port 3001)

- `ws://<HOST>:3001/ws/device?device_id=<ID>&device_key=<KEY>`
- The server currently logs incoming connections and messages to the console.

## Dashboard

The dashboard allows you to:
- View connected devices and their reported state (Polling every 2s).
- Send commands (Toggle Relay, Reboot) to devices.
