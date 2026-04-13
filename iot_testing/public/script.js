// Helper to display API response
function showResponse(elementId, data, isError = false) {
    const el = document.getElementById(elementId);
    el.textContent = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    el.style.color = isError ? '#f87171' : '#a5b4fc';
    el.classList.add('active');
}

// Helper to get headers
function getHeaders() {
    const key = document.getElementById('device-key').value;
    return {
        'Content-Type': 'application/json',
        'x-device-key': key
    };
}

// 1. Report State
async function testReport() {
    const deviceId = document.getElementById('report-id').value;
    const payloadStr = document.getElementById('report-state').value;
    let payload;

    try {
        payload = JSON.parse(payloadStr);
    } catch (e) {
        showResponse('report-response', 'Invalid JSON', true);
        return;
    }

    try {
        const res = await fetch(`http://100.93.48.124:3000/api/switch/device/${deviceId}/report`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        showResponse('report-response', data);
    } catch (e) {
        showResponse('report-response', e.message, true);
    }
}

// 2. Poll Commands
async function testPoll() {
    const deviceId = document.getElementById('poll-id').value;

    try {
        const res = await fetch(`http://100.93.48.124:3000/api/switch/device/${deviceId}/poll`, {
            headers: getHeaders()
        });
        const data = await res.json();
        showResponse('poll-response', data);
    } catch (e) {
        showResponse('poll-response', e.message, true);
    }
}

// 3. Ack Command
async function testAck() {
    const deviceId = document.getElementById('ack-id').value;
    const cmdId = document.getElementById('ack-cmd-id').value;
    const status = document.getElementById('ack-status').value;

    try {
        const res = await fetch(`http://100.93.48.124:3000/api/switch/device/${deviceId}/ack`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ command_id: cmdId, status })
        });
        const data = await res.json();
        showResponse('ack-response', data);
    } catch (e) {
        showResponse('ack-response', e.message, true);
    }
}

// WebSocket Logic
let ws = null;
const wsStatus = document.getElementById('ws-status');
const wsLogs = document.getElementById('ws-logs');

document.getElementById('ws-start').addEventListener('click', () => {
    const url = document.getElementById('ws-url').value;
    connectWs(url);
});

document.getElementById('ws-stop').addEventListener('click', () => {
    if (ws) {
        ws.close();
        ws = null;
        log('Stopped manually');
        updateStatus('disconnected');
    }
});

document.getElementById('ws-reload').addEventListener('click', () => {
    if (ws) ws.close();
    const url = document.getElementById('ws-url').value;
    // Small delay to allow close
    setTimeout(() => connectWs(url), 500);
});

function connectWs(url) {
    if (ws) {
        log('Closing existing connection...');
        ws.close();
    }

    try {
        updateStatus('connecting');
        log(`Connecting to ${url}...`);
        ws = new WebSocket(url);

        ws.onopen = () => {
            updateStatus('connected');
            log('Connected successfully');
        };

        ws.onmessage = (event) => {
            log(`RX: ${event.data}`);
        };

        ws.onclose = (event) => {
            updateStatus('disconnected');
            log(`Disconnected (Code: ${event.code})`);
            ws = null;
        };

        ws.onerror = (error) => {
            log('Error occurred (Check console)');
            console.error('WS Error:', error);
        };

    } catch (e) {
        log(`Error: ${e.message}`);
        updateStatus('disconnected');
    }
}

function updateStatus(status) {
    wsStatus.className = `status-${status}`;
    wsStatus.textContent = status.charAt(0).toUpperCase() + status.slice(1);
}

function log(msg) {
    const time = new Date().toLocaleTimeString();
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.innerHTML = `<span class="log-time">[${time}]</span> ${msg}`;
    wsLogs.appendChild(entry);
    wsLogs.scrollTop = wsLogs.scrollHeight;
}
