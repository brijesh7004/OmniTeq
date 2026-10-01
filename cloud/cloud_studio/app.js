/**
 * IoT Cloud Studio - Main Application Engine v2.4
 * Handles state management, dynamic UI rendering, multi-step page wizard,
 * dedicated modal catalogs for adding sensors/actuators/rules, GPIO conflict checking,
 * and real-time Arduino C++ firmware generation for IoT Clouds.
 */

// // Active Input Sensors
// sensors: [
//   {
//     id: "sens_1",
//     type: "dht22",
//     name: "DHT22 Climate Sensor",
//     pin: 4,
//     varTemp: "temperature",
//     varHum: "humidity",
//     unitTemp: "°C",
//     unitHum: "%RH",
//     readInterval: 2000
//   },
//   {
//     id: "sens_2",
//     type: "soil",
//     name: "Capacitive Soil Sensor",
//     pin: 34,
//     varVal: "soilMoisture",
//     unit: "%",
//     readInterval: 3000
//   },
//   {
//     id: "sens_3",
//     type: "ldr",
//     name: "Ambient Light Sensor",
//     pin: 35,
//     varVal: "lightIntensity",
//     unit: "lux",
//     readInterval: 2500
//   }
// ],
// // Active Output Actuators
// actuators: [
//   {
//     id: "act_1",
//     type: "relay",
//     name: "Exhaust Fan Relay",
//     pin: 32,
//     activeLow: true,
//     defaultState: "LOW",
//     varState: "fanRelayState"
//   },
//   {
//     id: "act_2",
//     type: "relay",
//     name: "Irrigation Pump",
//     pin: 33,
//     activeLow: true,
//     defaultState: "LOW",
//     varState: "pumpState"
//   },
//   {
//     id: "act_3",
//     type: "pwm_led",
//     name: "Grow Light Array",
//     pin: 25,
//     channel: 0,
//     frequency: 5000,
//     defaultState: "0",
//     varState: "growLightBrightness"
//   }
// ],
// // Automation / Logic Rules
// rules: [
//   {
//     id: "rule_1",
//     sensorId: "sens_1",
//     subVar: "temperature",
//     operator: ">",
//     threshold: 32.0,
//     hysteresis: 1.0,
//     actuatorId: "act_1",
//     targetState: "HIGH",
//     cloudAlert: true
//   },
//   {
//     id: "rule_2",
//     sensorId: "sens_2",
//     subVar: "soilMoisture",
//     operator: "<",
//     threshold: 35.0,
//     hysteresis: 2.0,
//     actuatorId: "act_2",
//     targetState: "HIGH",
//     cloudAlert: true
//   }
// ]

// Global Application State
const state = {
  viewMode: "studio", // 'studio' | 'wizard'
  wizardStep: 1, // 1 to 6
  project: {
    name: "Smart Greenhouse Node 01",
    location: "Greenhouse Sector 4B",
    wifiSSID: "IoT_Lab_WiFi",
    wifiPass: "SecurePass@2026",
    cloudUrl: "https://omniteq-server.tail206540.ts.net/api/v1",
    projectId: "",
    // true  -> the status variable UUID is server-issued and read-only
    // false -> the user owns the value and the field stays editable
    statusVariableAuto: true,
    statusVariableKey: "nodeStatus",
    deviceId: "YOUR_DEVICE_ID",
    secretKey: "YOUR_SECRET_KEY",
    deviceRegisteredAt: "",
    macAddress: "",
    macAuto: true,
    cpuFrequency: "240 MHz",
    flashSize: "4 MB",
    uploadSpeed: "921600",
    nodeRole: "field_node",
    statusVariableId: "YOUR_STATUS_VARIABLE_UUID",
    firmwareVersion: "1.0.4",
    debug: true,
    telemetryInterval: 10000,
    heartbeatInterval: 30000,
    commandPollInterval: 10000,
    maxCommands: 5,
    httpTimeout: 10000,
    retryCount: 2,
    baudRate: 115200
  },
  controller: "esp32_devkit", // 'esp32_devkit' | 'esp32_s3' | 'esp8266' | 'nano33_iot'
  failsafePolicy: "keep_local_loop", // 'keep_local_loop' | 'safe_shutdown' | 'freeze_state'

  // Active Input Sensors (Empty by default)
  sensors: [],

  // Active Output Actuators (Empty by default)
  actuators: [],

  // Cloud command templates (main-project schema: name/description/parameters[])
  commands: [],

  // Server-side rule engine entries (main-project schema)
  cloudRules: [],

  // On-device edge automation rules (compiled into the sketch)
  rules: []
};

// Available Microcontroller Pin Capacities
const CONTROLLER_PINS = {
  esp32_devkit: [
    { pin: 2, label: "GPIO 2 (Onboard LED / Boot strap)", adc: false, pwm: true, inputOnly: false },
    { pin: 4, label: "GPIO 4 (ADC2_CH0 / Touch 0)", adc: true, pwm: true, inputOnly: false },
    { pin: 5, label: "GPIO 5 (VSPI CS / Strapping)", adc: false, pwm: true, inputOnly: false },
    { pin: 12, label: "GPIO 12 (ADC2_CH5 / MTDI)", adc: true, pwm: true, inputOnly: false },
    { pin: 13, label: "GPIO 13 (ADC2_CH4 / Touch 4)", adc: true, pwm: true, inputOnly: false },
    { pin: 14, label: "GPIO 14 (ADC2_CH6 / Touch 6)", adc: true, pwm: true, inputOnly: false },
    { pin: 15, label: "GPIO 15 (ADC2_CH3 / MTDO)", adc: true, pwm: true, inputOnly: false },
    { pin: 16, label: "GPIO 16 (UART2 RX)", adc: false, pwm: true, inputOnly: false },
    { pin: 17, label: "GPIO 17 (UART2 TX)", adc: false, pwm: true, inputOnly: false },
    { pin: 18, label: "GPIO 18 (VSPI SCK)", adc: false, pwm: true, inputOnly: false },
    { pin: 19, label: "GPIO 19 (VSPI MISO)", adc: false, pwm: true, inputOnly: false },
    { pin: 21, label: "GPIO 21 (I2C SDA)", adc: false, pwm: true, inputOnly: false, i2c: "SDA" },
    { pin: 22, label: "GPIO 22 (I2C SCL)", adc: false, pwm: true, inputOnly: false, i2c: "SCL" },
    { pin: 23, label: "GPIO 23 (VSPI MOSI)", adc: false, pwm: true, inputOnly: false },
    { pin: 25, label: "GPIO 25 (ADC2_CH8 / DAC1)", adc: true, pwm: true, inputOnly: false },
    { pin: 26, label: "GPIO 26 (ADC2_CH9 / DAC2)", adc: true, pwm: true, inputOnly: false },
    { pin: 27, label: "GPIO 27 (ADC2_CH7 / Touch 7)", adc: true, pwm: true, inputOnly: false },
    { pin: 32, label: "GPIO 32 (ADC1_CH4 / Touch 9)", adc: true, pwm: true, inputOnly: false },
    { pin: 33, label: "GPIO 33 (ADC1_CH5 / Touch 8)", adc: true, pwm: true, inputOnly: false },
    { pin: 34, label: "GPIO 34 (ADC1_CH6 - Input Only)", adc: true, pwm: false, inputOnly: true },
    { pin: 35, label: "GPIO 35 (ADC1_CH7 - Input Only)", adc: true, pwm: false, inputOnly: true },
    { pin: 36, label: "GPIO 36 / VP (ADC1_CH0 - Input Only)", adc: true, pwm: false, inputOnly: true },
    { pin: 39, label: "GPIO 39 / VN (ADC1_CH3 - Input Only)", adc: true, pwm: false, inputOnly: true }
  ],
  esp32_s3: [
    { pin: 1, label: "GPIO 1 (ADC1_CH0)", adc: true, pwm: true, inputOnly: false },
    { pin: 2, label: "GPIO 2 (ADC1_CH1)", adc: true, pwm: true, inputOnly: false },
    { pin: 4, label: "GPIO 4 (ADC1_CH3)", adc: true, pwm: true, inputOnly: false },
    { pin: 5, label: "GPIO 5 (ADC1_CH4)", adc: true, pwm: true, inputOnly: false },
    { pin: 6, label: "GPIO 6 (ADC1_CH5)", adc: true, pwm: true, inputOnly: false },
    { pin: 7, label: "GPIO 7 (ADC1_CH6)", adc: true, pwm: true, inputOnly: false },
    { pin: 8, label: "GPIO 8 (I2C SDA)", adc: false, pwm: true, inputOnly: false, i2c: "SDA" },
    { pin: 9, label: "GPIO 9 (I2C SCL)", adc: false, pwm: true, inputOnly: false, i2c: "SCL" },
    { pin: 10, label: "GPIO 10", adc: false, pwm: true, inputOnly: false },
    { pin: 11, label: "GPIO 11", adc: false, pwm: true, inputOnly: false },
    { pin: 12, label: "GPIO 12 (SPI SCK)", adc: false, pwm: true, inputOnly: false },
    { pin: 13, label: "GPIO 13 (SPI MISO)", adc: false, pwm: true, inputOnly: false },
    { pin: 14, label: "GPIO 14", adc: false, pwm: true, inputOnly: false }
  ],
  esp8266: [
    { pin: 0, label: "D3 / GPIO 0 (Flash button)", adc: false, pwm: true, inputOnly: false },
    { pin: 2, label: "D4 / GPIO 2 (TX1 / LED)", adc: false, pwm: true, inputOnly: false },
    { pin: 4, label: "D2 / GPIO 4 (I2C SDA)", adc: false, pwm: true, inputOnly: false, i2c: "SDA" },
    { pin: 5, label: "D1 / GPIO 5 (I2C SCL)", adc: false, pwm: true, inputOnly: false, i2c: "SCL" },
    { pin: 12, label: "D6 / GPIO 12 (SPI MISO)", adc: false, pwm: true, inputOnly: false },
    { pin: 13, label: "D7 / GPIO 13 (SPI MOSI)", adc: false, pwm: true, inputOnly: false },
    { pin: 14, label: "D5 / GPIO 14 (SPI CLK)", adc: false, pwm: true, inputOnly: false },
    { pin: 15, label: "D8 / GPIO 15 (Boot pull-down)", adc: false, pwm: true, inputOnly: false },
    { pin: 17, label: "A0 / ADC0 (Max 1.0V)", adc: true, pwm: false, inputOnly: true }
  ],
  nano33_iot: [
    { pin: 2, label: "D2 (Digital)", adc: false, pwm: true, inputOnly: false },
    { pin: 3, label: "D3 (Digital/PWM)", adc: false, pwm: true, inputOnly: false },
    { pin: 4, label: "D4 (Digital)", adc: false, pwm: false, inputOnly: false },
    { pin: 5, label: "D5 (Digital/PWM)", adc: false, pwm: true, inputOnly: false },
    { pin: 6, label: "D6 (Digital/PWM)", adc: false, pwm: true, inputOnly: false },
    { pin: 7, label: "D7 (Digital)", adc: false, pwm: false, inputOnly: false },
    { pin: 8, label: "D8 (Digital)", adc: false, pwm: false, inputOnly: false },
    { pin: 14, label: "A0 (ADC)", adc: true, pwm: false, inputOnly: false },
    { pin: 15, label: "A1 (ADC)", adc: true, pwm: false, inputOnly: false },
    { pin: 16, label: "A2 (ADC)", adc: true, pwm: false, inputOnly: false },
    { pin: 17, label: "A3 (ADC)", adc: true, pwm: false, inputOnly: false },
    { pin: 18, label: "A4 / SDA (I2C)", adc: true, pwm: false, inputOnly: false, i2c: "SDA" },
    { pin: 19, label: "A5 / SCL (I2C)", adc: true, pwm: false, inputOnly: false, i2c: "SCL" }
  ]
};

// Fixed Hardware Bus Allocations per Controller Architecture
const CONTROLLER_BUSES = {
  esp32_devkit: {
    i2c: { label: "I2C (SDA:21, SCL:22)", sda: 21, scl: 22 },
    spi: { label: "SPI (SCK:18, MISO:19, MOSI:23)", sck: 18, miso: 19, mosi: 23, csPins: [5, 15, 4, 13, 27], defaultCs: 5 },
    uart: { label: "UART2 (RX:16, TX:17)", rx: 16, tx: 17 },
    stepper: { label: "Stepper 4-Pin (IN1:26, IN2:27, IN3:14, IN4:12)", pins: [26, 27, 14, 12] },
    ultrasonic: { label: "Ultrasonic (Trig:5, Echo:18)", trig: 5, echo: 18 }
  },
  esp32_s3: {
    i2c: { label: "I2C (SDA:8, SCL:9)", sda: 8, scl: 9 },
    spi: { label: "SPI (SCK:12, MISO:13, MOSI:11)", sck: 12, miso: 13, mosi: 11, csPins: [10, 14, 5, 6, 7], defaultCs: 10 },
    uart: { label: "UART2 (RX:44, TX:43)", rx: 44, tx: 43 },
    stepper: { label: "Stepper 4-Pin (IN1:4, IN2:5, IN3:6, IN4:7)", pins: [4, 5, 6, 7] },
    ultrasonic: { label: "Ultrasonic (Trig:1, Echo:2)", trig: 1, echo: 2 }
  },
  esp8266: {
    i2c: { label: "I2C (SDA:D2/4, SCL:D1/5)", sda: 4, scl: 5 },
    spi: { label: "SPI (SCK:D5/14, MISO:D6/12, MOSI:D7/13)", sck: 14, miso: 12, mosi: 13, csPins: [15, 0, 2], defaultCs: 15 },
    uart: { label: "UART (RX:3, TX:1)", rx: 3, tx: 1 },
    stepper: { label: "Stepper 4-Pin (IN1:14, IN2:12, IN3:13, IN4:15)", pins: [14, 12, 13, 15] },
    ultrasonic: { label: "Ultrasonic (Trig:12, Echo:14)", trig: 12, echo: 14 }
  },
  nano33_iot: {
    i2c: { label: "I2C (SDA:A4/18, SCL:A5/19)", sda: 18, scl: 19 },
    spi: { label: "SPI (SCK:13, MISO:12, MOSI:11)", sck: 13, miso: 12, mosi: 11, csPins: [10, 4, 7, 8], defaultCs: 10 },
    uart: { label: "UART1 (RX:0, TX:1)", rx: 0, tx: 1 },
    stepper: { label: "Stepper 4-Pin (IN1:2, IN2:3, IN3:5, IN4:6)", pins: [2, 3, 5, 6] },
    ultrasonic: { label: "Ultrasonic (Trig:2, Echo:3)", trig: 2, echo: 3 }
  }
};

/**
 * Board-level metadata per controller. Drives the "Device Identity & Cloud
 * Provisioning" panel in Section 02: detected board label, sensible build
 * defaults, and a per-architecture MAC prefix used by the MAC/UUID generators.
 *
 * The MAC prefixes are locally administered (first octet has the U/L bit set),
 * so a generated value is a valid, non-vendor-claiming placeholder that the user
 * replaces with the real hardware MAC.
 */
const CONTROLLER_META = {
  esp32_devkit: {
    label: "ESP32 DevKit V1 (30/38 Pins)",
    chip: "Espressif ESP32-D0WDQ6 (Xtensa Dual-Core 240MHz)",
    cpuFrequency: "240 MHz",
    flashSize: "4 MB",
    uploadSpeed: "921600",
    runtime: "Arduino-ESP32 core (WiFi.h)",
    macPrefix: "02:1A:C4",
    // Onboard LED used as command confirmation. ESP32 DevKit V1: active HIGH on GPIO 2.
    builtInLed: { pin: 2, activeLow: false, macro: "LED_BUILTIN", note: "Onboard blue LED on GPIO 2 (active HIGH)" }
  },
  esp32_s3: {
    label: "ESP32-S3 DevKitC-1",
    chip: "Espressif ESP32-S3 (Xtensa Dual-Core LX7 240MHz)",
    cpuFrequency: "240 MHz",
    flashSize: "8 MB",
    uploadSpeed: "921600",
    runtime: "Arduino-ESP32 core (WiFi.h)",
    macPrefix: "02:1A:C5",
    // ESP32-S3 DevKitC-1 exposes an addressable RGB LED on GPIO 48; driving it as a
    // plain on/off pin still works for simple visual feedback.
    builtInLed: { pin: 48, activeLow: false, macro: "LED_BUILTIN", note: "Onboard RGB LED on GPIO 48 (active HIGH)" }
  },
  esp8266: {
    label: "NodeMCU 1.0 (ESP-12E Module)",
    chip: "Espressif ESP8266EX (Single Core 80MHz)",
    cpuFrequency: "80 MHz",
    flashSize: "4 MB",
    uploadSpeed: "115200",
    runtime: "Arduino-ESP8266 core (ESP8266WiFi.h)",
    macPrefix: "02:0C:F7",
    // NodeMCU D4 = GPIO 2, wired active LOW.
    builtInLed: { pin: 2, activeLow: true, macro: "LED_BUILTIN", note: "Onboard LED on GPIO 2 / D4 (active LOW, inverted)" }
  },
  nano33_iot: {
    label: "Arduino Nano 33 IoT (NINA-W102)",
    chip: "Microchip SAMD21 Cortex-M0+ 48MHz",
    cpuFrequency: "48 MHz",
    flashSize: "256 KB",
    uploadSpeed: "115200",
    runtime: "WiFiNINA library (SAMD21)",
    macPrefix: "02:33:1A",
    builtInLed: { pin: 13, activeLow: false, macro: "LED_BUILTIN", note: "Onboard LED on pin 13 (active HIGH) via LED_BUILTIN" }
  }
};

function getControllerMeta(controllerKey) {
  return CONTROLLER_META[controllerKey || state.controller] || CONTROLLER_META.esp32_devkit;
}

/**
 * Onboard LED descriptor for the active controller. Used both by the actuator
 * cards (to label the "Built-in LED feedback" toggle) and by the code generator
 * (to emit the mirroring writes).
 */
function getBuiltInLed(controllerKey) {
  const meta = getControllerMeta(controllerKey);
  return meta.builtInLed || { pin: 2, activeLow: false, macro: "LED_BUILTIN", note: "Onboard LED" };
}

/** Human-readable node role labels, used in the sketch header and NODE_ROLE. */
const NODE_ROLE_LABELS = {
  field_node: "Field Node (Sensors + Actuators)",
  sensor_only: "Sensor Node (Telemetry Only)",
  actuator_only: "Actuator Node (Command Sink)",
  gateway: "Local Gateway / Bridge"
};

/**
 * Random UUID v4. crypto.randomUUID() is preferred; the manual path keeps the
 * generator working on file:// pages and in older browsers.
 */
function generateUuidV4() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const bytes = new Uint8Array(16);
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // RFC 4122 variant
  const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function randomHex(bytes) {
  const out = [];
  for (let i = 0; i < bytes; i++) {
    let value;
    if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
      const buf = new Uint8Array(1);
      crypto.getRandomValues(buf);
      value = buf[0];
    } else {
      value = Math.floor(Math.random() * 256);
    }
    out.push(value.toString(16).padStart(2, "0").toUpperCase());
  }
  return out.join("");
}

/**
 * Random locally-administered MAC, seeded with a per-architecture prefix so an
 * ESP32 and an ESP8266 never produce the same default.
 */
function generateMacAddress(controllerKey) {
  const meta = getControllerMeta(controllerKey);
  return `${meta.macPrefix}:${randomHex(1)}:${randomHex(1)}:${randomHex(1)}`;
}

function normalizeMac(value) {
  const hex = String(value || "").toUpperCase().replace(/[^0-9A-F]/g, "");
  if (hex.length !== 12) return null;
  return hex.match(/.{2}/g).join(":");
}

function isValidMac(value) {
  return normalizeMac(value) !== null;
}

function isValidUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(value || "").trim());
}

/** FNV-1a, used to seed the deterministic MAC -> UUID derivation. */
function fnv1aHash(str) {
  let hash = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash >>> 0;
}

/**
 * Deterministic UUID derived from a MAC address.
 *
 * The same MAC always yields the same UUID, so re-deriving never invalidates an
 * already-registered device. A seeded xorshift fills all 16 bytes, then the
 * version/variant bits are set, producing a well-formed RFC 4122 UUID.
 */
function uuidFromMac(mac) {
  const normalized = normalizeMac(mac);
  if (!normalized) return null;

  const hex = normalized.replace(/:/g, "");
  let seed = fnv1aHash(`omniteq-cloud-device:${hex}`) || 1;
  const bytes = [];
  for (let i = 0; i < 16; i++) {
    seed ^= seed << 13; seed >>>= 0;
    seed ^= seed >>> 17;
    seed ^= seed << 5; seed >>>= 0;
    bytes.push(seed & 0xff);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const out = bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${out.slice(0, 8)}-${out.slice(8, 12)}-${out.slice(12, 16)}-${out.slice(16, 20)}-${out.slice(20)}`;
}

/**
 * Device name as the gateway expects it: derived from the project/node name and
 * kept unique-per-project friendly by appending the MAC tail when present.
 */
function buildDeviceRegistrationName() {
  const base = (state.project.name || "IoT Node").trim() || "IoT Node";
  return base;
}

/**
 * Description sent with the device record.
 *
 * POST /projects/:projectId/devices accepts only `name` and `description`, so the
 * hardware metadata (MAC, board, firmware, role, location) is folded into the
 * description to keep it persisted server-side, mirroring cloud_device_add.html.
 */
function buildDeviceRegistrationDescription() {
  const p = state.project;
  const meta = [];
  if (p.macAddress) meta.push(`MAC: ${p.macAddress}`);
  if (p.boardLabel) meta.push(`Hardware: ${p.boardLabel}`);
  if (p.firmwareVersion) meta.push(`Firmware: ${p.firmwareVersion}`);
  if (p.nodeRole) meta.push(`Role: ${NODE_ROLE_LABELS[p.nodeRole] || p.nodeRole}`);
  if (p.location) meta.push(`Location: ${p.location}`);
  meta.push("Provisioned from OmniTeq Cloud Studio");
  return meta.join(" | ");
}

function resolveProjectIdForProvisioning() {
  const params = new URLSearchParams(window.location.search);
  return state.project.projectId || params.get("project_id") || params.get("projectId") || null;
}

/**
 * "Add Device": registers the node on the gateway and reads back the one-time
 * secret key.
 *
 * The key is generated server-side and returned exactly once, which is why the
 * Device Secret Key field is read-only: this button is the only way it is filled
 * in, and its value is then written into the generated sketch.
 */
async function provisionDeviceOnServer() {
  const btn = document.getElementById("btn-add-device-server");
  const status = document.getElementById("add-device-status");

  const setStatus = (message, stateClass) => {
    if (!status) return;
    status.classList.remove("is-pending", "is-success", "is-error");
    if (stateClass) status.classList.add(stateClass);
    status.innerHTML = message;
  };

  const cfg = window.OMNITEQ_CONFIG;
  let token = null;
  try { token = localStorage.getItem("access_token"); } catch (e) { /* private mode */ }

  if (!cfg || typeof cfg.resolve !== "function") {
    setStatus("Gateway configuration (<code>js/config.js</code>) is unavailable, so the device cannot be registered from here.", "is-error");
    showToast("Gateway configuration unavailable");
    return;
  }
  if (!token) {
    setStatus("Sign in to OmniTeq Cloud first — device registration requires your account session.", "is-error");
    showToast("Sign in required to register a device");
    return;
  }

  const restoreButton = () => {
    if (!btn) return;
    btn.disabled = false;
    btn.innerHTML = `<svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg> Add Device`;
  };

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = "Provisioning…";
  }
  setStatus("Contacting the gateway…", "is-pending");

  try {
    const baseUrl = cfg.resolve().apiBaseUrl;
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

    // Fall back to the account's first project when the studio was opened
    // without a project context, matching cloud_project_view.html behaviour.
    let projectId = resolveProjectIdForProvisioning();
    if (!projectId) {
      const projectsRes = await fetch(`${baseUrl}/projects`, { headers });
      const projectsBody = projectsRes.ok ? await projectsRes.json().catch(() => null) : null;
      if (projectsBody && projectsBody.success && Array.isArray(projectsBody.data) && projectsBody.data.length > 0) {
        projectId = projectsBody.data[0].id;
        state.project.projectId = projectId;
      }
    }
    if (!projectId) {
      setStatus("No project is available for this account. Create one in <strong>Cloud → Projects</strong> first.", "is-error");
      showToast("No project available for device registration");
      restoreButton();
      return;
    }

    const payload = {
      name: buildDeviceRegistrationName(),
      description: buildDeviceRegistrationDescription()
    };

    const res = await fetch(`${baseUrl}/projects/${encodeURIComponent(projectId)}/devices`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload)
    });
    const body = await res.json().catch(() => null);

    if (!res.ok || !body || body.success !== true || !body.data) {
      const code = body && body.error ? body.error.code : `HTTP_${res.status}`;
      const message = body && body.error && body.error.message ? body.error.message : `Registration failed (${code}).`;
      setStatus(`${escapeHtmlText(message)} <span style="color: var(--text-dim);">[${escapeHtmlText(code)}]</span>`, "is-error");
      showToast(`Device registration failed: ${message}`);
      restoreButton();
      return;
    }

    const device = body.data;
    const issuedSecret = device.secret_key || "";
    if (!issuedSecret) {
      // The gateway only returns secret_key on create; without it the sketch
      // would be unusable, so surface it as an explicit failure.
      setStatus("The gateway registered the device but returned no secret key. Re-create the device or copy the key from <strong>Cloud → Devices</strong>.", "is-error");
      showToast("Device created without a secret key");
      if (device.id) state.project.deviceId = device.id;
      updateStudio();
      restoreButton();
      return;
    }

    state.project.projectId = projectId;
    state.project.deviceId = device.id || state.project.deviceId;
    state.project.secretKey = issuedSecret;
    state.project.deviceRegisteredAt = new Date().toISOString();

    setStatus(`<strong>${escapeHtmlText(device.name || "Device")}</strong> registered. Secret key received and embedded in the sketch — it is shown only once, so copy it somewhere safe now.`, "is-success");
    showToast("Device registered — secret key embedded in the firmware");
    updateStudio();
    restoreButton();
  } catch (err) {
    const offline = err && err.name === "TypeError";
    const message = offline
      ? "Cannot reach the OmniTeq gateway. Check the Cloud API Base URL in Section 01 and that the server is running."
      : (err && err.message) || "Device registration failed.";
    setStatus(message, "is-error");
    showToast(message);
    restoreButton();
  }
}

/**
 * Intelligent Pin Filtering Helper
 * Strictly enforces fixed bus pins for I2C, SPI, and UART peripherals,
 * ADC-only pins for analog sensors, digital-only pins for digital sensors,
 * and eliminates input-only pins for actuators.
 */
/**
 * Response mapping: how a received command parameter drives the actuator.
 *
 * A command template only carries a value; this decides what the hardware does
 * with it. `direct` writes the value as-is, `scale` correlates an input range
 * with the actuator's output range (e.g. 0-100% -> 0-255 PWM duty), `threshold`
 * turns a numeric command into on/off, `fixed` ignores the payload entirely and
 * `invert` flips a boolean command.
 */
const RESPONSE_MODES = {
  direct: "Direct value (as received)",
  scale: "Correlate range (map input to output)",
  threshold: "Threshold (numeric to ON/OFF)",
  fixed: "Fixed value (ignore payload)",
  invert: "Invert (boolean command to opposite state)"
};

/**
 * Physical output range of an actuator, used as the default mapping target and
 * as the clamp bound in the generated firmware.
 */
function getActuatorOutputRange(actuator) {
  if (!actuator) return { min: 0, max: 1, unit: "", kind: "digital" };
  switch (actuator.type) {
    case "pwm_led":
    case "motor_pwm":
      return { min: 0, max: 255, unit: "duty", kind: "pwm" };
    case "servo":
      return { min: 0, max: 180, unit: "deg", kind: "servo" };
    case "stepper_motor":
      return { min: -10000, max: 10000, unit: "steps", kind: "stepper" };
    case "lcd_16x2":
    case "lcd_20x4":
    case "oled":
      return { min: 0, max: 0, unit: "text", kind: "display" };
    default:
      return { min: 0, max: 1, unit: "", kind: "digital" };
  }
}

/**
 * Default mapping for an actuator.
 *
 * Analogue outputs default to a 0-100 percentage correlation, because that is how
 * dashboards usually express a command ("set speed to 60") while the hardware needs
 * the full duty cycle. Digital outputs default to a direct value.
 */
function defaultResponseMap(actuator) {
  const range = getActuatorOutputRange(actuator);
  const analogue = range.kind === "pwm" || range.kind === "servo";
  return {
    mode: analogue ? "scale" : "direct",
    inputMin: 0,
    inputMax: analogue ? 100 : 1,
    outputMin: range.min,
    outputMax: range.max,
    clamp: true,
    threshold: analogue ? 50 : 1,
    fixedValue: analogue ? Math.round(range.max / 2) : 1,
    invert: false
  };
}

/** Merge a stored mapping with the defaults for the actuator type. */
function normalizeResponseMap(actuator) {
  const base = defaultResponseMap(actuator);
  const stored = (actuator && actuator.response) || {};
  const num = (value, fallback) => {
    const parsed = typeof value === "number" ? value : parseFloat(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };
  return {
    mode: RESPONSE_MODES[stored.mode] ? stored.mode : base.mode,
    inputMin: num(stored.inputMin, base.inputMin),
    inputMax: num(stored.inputMax, base.inputMax),
    outputMin: num(stored.outputMin, base.outputMin),
    outputMax: num(stored.outputMax, base.outputMax),
    clamp: stored.clamp !== false,
    threshold: num(stored.threshold, base.threshold),
    fixedValue: num(stored.fixedValue, base.fixedValue),
    invert: stored.invert === true
  };
}

function patchResponseMap(actuator, patch) {
  actuator.response = Object.assign(normalizeResponseMap(actuator), patch || {});
}

/** Human-readable summary shown on the actuator card. */
function describeResponseMap(actuator) {
  const map = normalizeResponseMap(actuator);
  const range = getActuatorOutputRange(actuator);
  const outUnit = range.unit && range.kind !== "display" ? " " + range.unit : "";
  switch (map.mode) {
    case "scale":
      return `${map.inputMin}\u2013${map.inputMax} \u2192 ${map.outputMin}\u2013${map.outputMax}${outUnit}${map.clamp ? " (clamped)" : ""}`;
    case "threshold":
      return `\u2265 ${map.threshold} \u2192 ON, below \u2192 OFF`;
    case "fixed":
      return `always ${map.fixedValue}${outUnit}`;
    case "invert":
      return "ON \u2194 OFF inverted";
    default:
      return `value as received${range.kind === "digital" ? " (ON/OFF)" : ""}`;
  }
}

function getFilteredPinOptions(item, controllerKey, isActuator = false) {
  const cKey = controllerKey || state.controller || "esp32_devkit";
  const busConfig = CONTROLLER_BUSES[cKey] || CONTROLLER_BUSES.esp32_devkit;
  const allPins = CONTROLLER_PINS[cKey] || CONTROLLER_PINS.esp32_devkit;

  // 1. Bus-based fixed/multi hardware routing
  if (item.bus === "i2c" || item.signalType === "i2c") {
    return [{
      pin: busConfig.i2c.sda,
      label: `${busConfig.i2c.label} [Shared I2C Bus]`,
      isFixed: true,
      bus: "i2c"
    }];
  }
  if (item.bus === "spi" || item.signalType === "spi") {
    const csList = busConfig.spi.csPins || [5];
    return csList.map((csPin) => ({
      pin: csPin,
      label: `SPI CS: GPIO ${csPin} (Shared SCK:${busConfig.spi.sck}, MISO:${busConfig.spi.miso}, MOSI:${busConfig.spi.mosi})`,
      isFixed: false,
      isSpiCs: true,
      bus: "spi"
    }));
  }
  if (item.bus === "uart" || item.signalType === "uart") {
    return [{
      pin: busConfig.uart.rx,
      label: `${busConfig.uart.label} [Fixed UART]`,
      isFixed: true,
      bus: "uart"
    }];
  }
  if (item.type === "stepper_motor") {
    return [{
      pin: busConfig.stepper.pins[0],
      label: `${busConfig.stepper.label} [4-Wire Driver]`,
      isFixed: true,
      isStepper: true
    }];
  }
  if (item.type === "ultrasonic") {
    return [{
      pin: busConfig.ultrasonic.trig,
      label: `${busConfig.ultrasonic.label} [Dual-Pin Sonar]`,
      isFixed: true,
      isUltrasonic: true
    }];
  }

  // 2. Actuator / Output peripherals (Strictly eliminate input-only pins)
  if (isActuator) {
    const outputCapable = allPins.filter((p) => !p.inputOnly);
    if (item.signalType === "pwm") {
      const pwmCapable = outputCapable.filter((p) => p.pwm);
      return pwmCapable.length > 0 ? pwmCapable : outputCapable;
    }
    return outputCapable;
  }

  // 3. Sensor / Input peripherals
  if (item.signalType === "adc" || item.isAnalog) {
    // Show ONLY available ADC options
    return allPins.filter((p) => p.adc === true);
  }

  // Digital input sensors: show all input-capable pins
  return allPins;
}

// Comprehensive Sensor Catalog for Add Sensor Page/Modal
const SENSOR_CATALOG = [
  // --- New Additions (Sec 3) ---
  {
    id: "pushbutton",
    category: "buttons",
    type: "pushbutton",
    name: "Switch / Pushbutton",
    defaultPin: 14,
    unit: "bool",
    defaultVar: "buttonPress",
    interval: 100,
    desc: "Momentary tactile pushbutton with internal pull-up (active LOW). Triggers events and relays on press.",
    interface: "Digital Input (Pullup)",
    signalType: "digital_input",
    isAnalog: false,
    icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"></circle><path d="M12 8v8M8 12h8"></path></svg>`
  },
  {
    id: "toggle_switch",
    category: "buttons",
    type: "toggle_switch",
    name: "Toggle Button",
    defaultPin: 27,
    unit: "bool",
    defaultVar: "toggleState",
    interval: 200,
    desc: "Latching rocker or toggle switch for manual state selection or power switching.",
    interface: "Digital Input",
    signalType: "digital_input",
    isAnalog: false,
    icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="5" width="22" height="14" rx="7" ry="7"></rect><circle cx="16" cy="12" r="3"></circle></svg>`
  },
  {
    id: "rtc_ds3231",
    category: "time_storage",
    type: "rtc_ds3231",
    name: "RTC DS3231",
    defaultPin: 21,
    unit: "epoch",
    defaultVar: "rtcTimestamp",
    interval: 1000,
    desc: "High precision battery-backed I2C Real Time Clock with temperature-compensated crystal.",
    interface: "I2C Bus (0x68) [Fixed Pins: SDA 21, SCL 22]",
    signalType: "i2c",
    bus: "i2c",
    isAnalog: false,
    icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`
  },
  {
    id: "sd_card",
    category: "time_storage",
    type: "sd_card",
    name: "SD Card Adapter",
    defaultPin: 5,
    unit: "status",
    defaultVar: "sdLogStatus",
    interval: 5000,
    desc: "SPI MicroSD card reader/writer module for offline local telemetry logging and CSV backups.",
    interface: "SPI Bus [Fixed Pins: SCK:18, MISO:19, MOSI:23, CS:5]",
    signalType: "spi",
    bus: "spi",
    isAnalog: false,
    icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2"></rect><line x1="8" y1="6" x2="8" y2="10"></line><line x1="12" y1="6" x2="12" y2="10"></line><line x1="16" y1="6" x2="16" y2="10"></line></svg>`
  },
  {
    id: "rfid_rc522",
    category: "id_nav",
    type: "rfid_rc522",
    name: "RFID",
    defaultPin: 5,
    unit: "uid",
    defaultVar: "rfidCardUID",
    interval: 300,
    desc: "MFRC522 13.56MHz contactless RFID/NFC card and keyfob reader for access control and authentication.",
    interface: "SPI Bus [Fixed Pins: SCK:18, MISO:19, MOSI:23, CS:5]",
    signalType: "spi",
    bus: "spi",
    isAnalog: false,
    icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>`
  },
  {
    id: "mpu6050",
    category: "motion",
    type: "mpu6050",
    name: "Acceleration sensors",
    defaultPin: 21,
    unit: "m/s²",
    defaultVar: "accelMagnitude",
    interval: 250,
    desc: "MPU6050 6-Axis motion tracking sensor with 3-axis accelerometer and 3-axis gyroscope over I2C.",
    interface: "I2C Bus (0x68) [Fixed Pins: SDA 21, SCL 22]",
    signalType: "i2c",
    bus: "i2c",
    isAnalog: false,
    icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"></path></svg>`
  },
  {
    id: "gsm_gps",
    category: "id_nav",
    type: "gsm_gps",
    name: "GSM/GPS sensors",
    defaultPin: 16,
    unit: "lat,lon",
    defaultVar: "gpsCoords",
    interval: 2000,
    desc: "Satellite GNSS positioning (NEO-6M) or cellular telemetry modem (SIM800L) via Serial UART.",
    interface: "UART2 Serial [Fixed Pins: RX:16, TX:17]",
    signalType: "uart",
    bus: "uart",
    isAnalog: false,
    icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`
  },
  {
    id: "ir_sensor",
    category: "optical",
    type: "ir_sensor",
    name: "Infrared sensors",
    defaultPin: 13,
    unit: "bool",
    defaultVar: "irDetected",
    interval: 100,
    desc: "Infrared transceiver detecting proximity, obstacles, reflective surfaces, or flame.",
    interface: "Digital Input / IR",
    signalType: "digital_input",
    isAnalog: false,
    icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path></svg>`
  },

  // --- Existing Sensors (Updated with signal types & bus mappings) ---
  {
    id: "dht22",
    category: "climate",
    type: "dht22",
    name: "DHT22 Climate Sensor",
    defaultPin: 4,
    unit: "°C / %RH",
    defaultVar: "temperature",
    interval: 2000,
    desc: "Digital temperature (-40~80°C) & relative humidity (0~100%). Single-bus digital protocol.",
    interface: "1-Wire Digital",
    signalType: "digital_input",
    isAnalog: false,
    icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"></path></svg>`
  },
  {
    id: "dht11",
    category: "climate",
    type: "dht11",
    name: "DHT11 Basic Sensor",
    defaultPin: 4,
    unit: "°C / %RH",
    defaultVar: "roomTemp",
    interval: 2000,
    desc: "Entry-level ambient temperature (0~50°C) and humidity (20~80%) monitor.",
    interface: "1-Wire Digital",
    signalType: "digital_input",
    isAnalog: false,
    icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"></path></svg>`
  },
  {
    id: "bmp280",
    category: "climate",
    type: "bmp280",
    name: "BMP280 Barometric Pressure",
    defaultPin: 21,
    unit: "hPa",
    defaultVar: "baroPressure",
    interval: 3000,
    desc: "Precision atmospheric air pressure & altitude sensor. Connects over I2C bus.",
    interface: "I2C Bus (0x76) [Fixed Pins: SDA 21, SCL 22]",
    signalType: "i2c",
    bus: "i2c",
    isAnalog: false,
    icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>`
  },
  {
    id: "bme280",
    category: "climate",
    type: "bmp280",
    name: "BME280 Temp/Hum/Pressure",
    defaultPin: 21,
    unit: "hPa",
    defaultVar: "ambientEnv",
    interval: 3000,
    desc: "All-in-one environmental sensor measuring temperature, humidity, and barometric pressure.",
    interface: "I2C Bus (0x76) [Fixed Pins: SDA 21, SCL 22]",
    signalType: "i2c",
    bus: "i2c",
    isAnalog: false,
    icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>`
  },
  {
    id: "soil",
    category: "soil",
    type: "soil",
    name: "Capacitive Soil Moisture",
    defaultPin: 34,
    unit: "%",
    defaultVar: "soilMoisture",
    interval: 3000,
    desc: "Corrosion-resistant capacitive moisture sensing via ADC. Calibrated 0-100%.",
    interface: "Analog ADC (0-3.3V)",
    signalType: "adc",
    isAnalog: true,
    icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path></svg>`
  },
  {
    id: "water_level",
    category: "soil",
    type: "soil",
    name: "Water Level Float Sensor",
    defaultPin: 32,
    unit: "%",
    defaultVar: "tankWaterLevel",
    interval: 2000,
    desc: "Submersible depth or reservoir water level probe for tanks and hydroponics.",
    interface: "Analog ADC (0-3.3V)",
    signalType: "adc",
    isAnalog: true,
    icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path></svg>`
  },
  {
    id: "ultrasonic",
    category: "distance",
    type: "ultrasonic",
    name: "HC-SR04 Ultrasonic Distance",
    defaultPin: 5,
    unit: "cm",
    defaultVar: "distanceCm",
    interval: 1000,
    desc: "Non-contact sonar distance measurement from 2cm to 400cm with trigger/echo pulses.",
    interface: "Dual Digital Pins",
    signalType: "digital_input",
    isAnalog: false,
    icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="6" cy="12" r="4"></circle><circle cx="18" cy="12" r="4"></circle><line x1="10" y1="12" x2="14" y2="12"></line></svg>`
  },
  {
    id: "pir",
    category: "distance",
    type: "pir",
    name: "PIR Motion Detector (HC-SR501)",
    defaultPin: 13,
    unit: "bool",
    defaultVar: "motionDetected",
    interval: 500,
    desc: "Infrared human & animal presence sensor with adjustable sensitivity and delay.",
    interface: "Digital Input",
    signalType: "digital_input",
    isAnalog: false,
    icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`
  },
  {
    id: "ldr",
    category: "optical",
    type: "ldr",
    name: "LDR Photoresistor",
    defaultPin: 35,
    unit: "lux",
    defaultVar: "lightLevel",
    interval: 2000,
    desc: "Ambient light intensity sensing for day/night detection and sun tracking.",
    interface: "Analog ADC (0-3.3V)",
    signalType: "adc",
    isAnalog: true,
    icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line></svg>`
  },
  {
    id: "bh1750",
    category: "optical",
    type: "ldr",
    name: "BH1750 Ambient Light (I2C)",
    defaultPin: 21,
    unit: "lux",
    defaultVar: "calibratedLux",
    interval: 2000,
    desc: "Digital 16-bit illuminance sensor with direct Lux output over I2C.",
    interface: "I2C Bus (0x23) [Fixed Pins: SDA 21, SCL 22]",
    signalType: "i2c",
    bus: "i2c",
    isAnalog: false,
    icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line></svg>`
  },
  {
    id: "mq135",
    category: "climate",
    type: "mq135",
    name: "MQ-135 Air Quality Sensor",
    defaultPin: 32,
    unit: "ppm",
    defaultVar: "airQualityPpm",
    interval: 2500,
    desc: "Air quality index detecting NH3, NOx, alcohol, benzene, smoke, and CO2.",
    interface: "Analog ADC (0-3.3V)",
    signalType: "adc",
    isAnalog: true,
    icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path></svg>`
  },
  {
    id: "custom_adc",
    category: "custom",
    type: "soil",
    name: "Custom Analog ADC Sensor",
    defaultPin: 33,
    unit: "val",
    defaultVar: "customSensorVal",
    interval: 2000,
    desc: "Generic 0-3.3V analog input mapped to 0-100% or custom calibration range.",
    interface: "Analog ADC (0-3.3V)",
    signalType: "adc",
    isAnalog: true,
    icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`
  }
];

// Comprehensive Actuator Catalog for Add Actuator Page/Modal
const ACTUATOR_CATALOG = [
  // --- New Additions (Sec 4) ---
  {
    id: "lcd_16x2",
    category: "displays",
    type: "lcd_16x2",
    name: "I2C LCD (16x2)",
    defaultPin: 21,
    defaultState: "ON",
    defaultVar: "lcd16x2Msg",
    desc: "Alphanumeric 16 characters by 2 lines LiquidCrystal display with PCF8574 I2C backpack adapter.",
    interface: "I2C Bus (0x27) [Fixed Pins: SDA 21, SCL 22]",
    signalType: "i2c",
    bus: "i2c",
    icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"></rect><line x1="6" y1="9" x2="18" y2="9"></line><line x1="6" y1="14" x2="14" y2="14"></line></svg>`
  },
  {
    id: "lcd_20x4",
    category: "displays",
    type: "lcd_20x4",
    name: "I2 C LCD (20x4)",
    defaultPin: 21,
    defaultState: "ON",
    defaultVar: "lcd20x4Status",
    desc: "Large 20 characters by 4 lines LiquidCrystal display for local diagnostics and live data readouts.",
    interface: "I2C Bus (0x27) [Fixed Pins: SDA 21, SCL 22]",
    signalType: "i2c",
    bus: "i2c",
    icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="18" rx="2"></rect><line x1="5" y1="7" x2="19" y2="7"></line><line x1="5" y1="11" x2="19" y2="11"></line><line x1="5" y1="15" x2="19" y2="15"></line></svg>`
  },
  {
    id: "motor_pwm",
    category: "motors",
    type: "motor_pwm",
    name: "Motor Speed control using PWM",
    defaultPin: 25,
    defaultState: "0",
    defaultVar: "motorSpeedPwm",
    desc: "DC motor / fan variable speed modulation (0-255) via hardware LEDC PWM duty cycle.",
    interface: "Hardware PWM (LEDC)",
    signalType: "pwm",
    icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 3"></path><path d="M7 12a5 5 0 0 1 5-5"></path></svg>`
  },
  {
    id: "stepper_motor",
    category: "motors",
    type: "stepper_motor",
    name: "Stepper Motor",
    defaultPin: 26,
    defaultState: "0",
    defaultVar: "stepperTarget",
    desc: "Precision stepper motor drive via Step & Direction pulses (A4988 / DRV8825) for linear rails and valves.",
    interface: "Digital Step/Dir",
    signalType: "digital_output",
    icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><circle cx="12" cy="12" r="8"></circle><line x1="12" y1="1" x2="12" y2="4"></line><line x1="12" y1="20" x2="12" y2="23"></line><line x1="1" y1="12" x2="4" y2="12"></line><line x1="20" y1="12" x2="23" y2="12"></line></svg>`
  },

  // --- Existing Actuators (Updated with signal types & bus mappings) ---
  {
    id: "relay_pump",
    category: "relays",
    type: "relay",
    name: "Single Channel Relay (Pump/Fan)",
    defaultPin: 19,
    activeLow: true,
    defaultState: "LOW",
    defaultVar: "relaySwitchState",
    desc: "Electromechanical relay module handling up to 10A 250VAC. Active LOW optoisolated trigger.",
    interface: "Digital Output",
    signalType: "digital_output",
    icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>`
  },
  {
    id: "relay_solenoid",
    category: "relays",
    type: "relay",
    name: "12V Solenoid Valve Relay",
    defaultPin: 18,
    activeLow: true,
    defaultState: "LOW",
    defaultVar: "solenoidValveState",
    desc: "Water flow control solenoid valve operated via transistor or relay switch.",
    interface: "Digital Output",
    signalType: "digital_output",
    icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>`
  },
  {
    id: "servo",
    category: "motors",
    type: "servo",
    name: "SG90 Micro Servo (0-180°)",
    defaultPin: 14,
    defaultState: "0",
    defaultVar: "servoAngle",
    desc: "Positional motor controlling ventilation dampers, flaps, and valve taps via PWM duty cycle.",
    interface: "Hardware PWM",
    signalType: "pwm",
    icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`
  },
  {
    id: "pwm_led",
    category: "light",
    type: "pwm_led",
    name: "PWM LED / Dimmer",
    defaultPin: 23,
    channel: 0,
    frequency: 5000,
    defaultState: "0",
    defaultVar: "growLightBrightness",
    desc: "8-bit LED brightness control (0-255) using ESP32 LEDC hardware timer generator.",
    interface: "LEDC PWM Channel",
    signalType: "pwm",
    icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2"></path><path d="M12 20v2"></path></svg>`
  },
  {
    id: "buzzer",
    category: "audio",
    type: "buzzer",
    name: "Alarm Siren / Buzzer",
    defaultPin: 27,
    activeLow: false,
    defaultState: "LOW",
    defaultVar: "alarmBuzzerState",
    desc: "Audible buzzer for high-threshold alerts and emergency system sirens.",
    interface: "Digital Output",
    signalType: "digital_output",
    icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>`
  },
  {
    id: "oled",
    category: "displays",
    type: "oled",
    name: "SSD1306 0.96 inch I2C OLED",
    defaultPin: 21,
    defaultVar: "oledDisplayStatus",
    desc: "Monochrome 128x64 graphical display for real-time local telemetry dashboard.",
    interface: "I2C Bus (0x3C) [Fixed Pins: SDA 21, SCL 22]",
    signalType: "i2c",
    bus: "i2c",
    icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>`
  }
];

/**
 * Initialize Application Lifecycle
 */
document.addEventListener("DOMContentLoaded", async () => {
  // Capture the pristine project defaults before any init code can mutate them;
  // "New Setup" rebuilds from this snapshot.
  captureStudioDefaults();

  initStudioTheme();
  initProjectInputs();
  initControllerSelector();
  initDeviceIdentity();
  initStatusUuidControls();
  initSensorHandlers();
  initCommandHandlers();
  initCloudRuleHandlers();
  initActuatorHandlers();
  initRuleHandlers();
  initTabs();
  initTopActions();
  initBackButton();
  initJsonHint();
  initViewModeSwitcher();
  initModalCatalogs();

  // Bind to the device/project passed in the URL, prompting first when this
  // browser already holds a saved setup. Runs before the first render so the
  // generated sketch always targets a real node.
  await bootstrapStudio();
  if (window.StudioUI) window.StudioUI.bootDone();

  // Initial UI Render
  renderSensorsList();
  renderActuatorsList();
  renderRulesList();
  updateStudio();
});

/**
 * Persist the studio session so a page reload does not lose the node blueprint.
 * Best-effort only: private-mode storage failures must not break editing.
 */
function persistStudioState() {
  try {
    localStorage.setItem("omniteq_studio_state", JSON.stringify({
      savedAt: new Date().toISOString(),
      project: state.project,
      controller: state.controller,
      failsafePolicy: state.failsafePolicy,
      sensors: state.sensors,
      actuators: state.actuators,
      commands: state.commands,
      cloudRules: state.cloudRules,
      rules: state.rules
    }));
  } catch (e) { /* ignore quota / private mode */ }
}

/**
 * 1. View Mode Switcher: Studio (Split) vs Step Wizard (Page-by-Page)
 */
function initViewModeSwitcher() {
  const btnStudio = document.getElementById("btn-mode-studio");
  const btnWizard = document.getElementById("btn-mode-wizard");
  const body = document.getElementById("app-body");
  const wizardStepItem = document.querySelector(".wizard-only-step");
  const wizardPageItem = document.querySelector(".wizard-only-page");

  btnStudio.addEventListener("click", () => {
    state.viewMode = "studio";
    btnStudio.classList.add("active");
    btnWizard.classList.remove("active");
    body.className = "theme-dark mode-studio";
    if (wizardStepItem) wizardStepItem.style.display = "none";
    if (wizardPageItem) wizardPageItem.style.display = "none";

    // Show all sections in scroll view
    document.querySelectorAll(".section-page").forEach((sec) => {
      sec.style.display = "block";
    });
    showToast("Switched to Studio Split View");
  });

  btnWizard.addEventListener("click", () => {
    state.viewMode = "wizard";
    btnWizard.classList.add("active");
    btnStudio.classList.remove("active");
    body.className = "theme-dark mode-wizard";
    if (wizardStepItem) wizardStepItem.style.display = "flex";
    if (wizardPageItem) wizardPageItem.style.display = "block";

    setWizardStep(state.wizardStep || 1);
    showToast("Switched to Page-by-Page Wizard Mode");
  });

  // Step Navigation Buttons (Next / Back)
  document.querySelectorAll(".btn-next-step").forEach((btn) => {
    btn.addEventListener("click", () => {
      const nextStep = parseInt(btn.dataset.next, 10);
      setWizardStep(nextStep);
    });
  });

  document.querySelectorAll(".btn-prev-step").forEach((btn) => {
    btn.addEventListener("click", () => {
      const prevStep = parseInt(btn.dataset.prev, 10);
      setWizardStep(prevStep);
    });
  });

  // Stepper Header Buttons
  document.querySelectorAll(".stepper-nav .step-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      const step = parseInt(btn.dataset.step, 10);
      if (state.viewMode === "wizard") {
        setWizardStep(step);
      } else {
        // Smooth scroll to section in studio mode
        const targetSec = document.querySelector(`.section-page[data-page="${step}"]`);
        if (targetSec) targetSec.scrollIntoView({ behavior: "smooth" });
        document.querySelectorAll(".stepper-nav .step-item").forEach((i) => i.classList.remove("active"));
        btn.classList.add("active");
      }
    });
  });

  // Wizard download firmware button on final page
  const wizardDownloadBtn = document.getElementById("btn-wizard-download-ino");
  if (wizardDownloadBtn) {
    wizardDownloadBtn.addEventListener("click", () => {
      document.getElementById("btn-download-ino").click();
    });
  }
}

function setWizardStep(stepNum) {
  state.wizardStep = stepNum;
  document.querySelectorAll(".section-page").forEach((sec) => {
    const pageId = parseInt(sec.dataset.page, 10);
    if (pageId === stepNum) {
      sec.classList.add("page-active");
      sec.style.display = "block";
    } else {
      sec.classList.remove("page-active");
      sec.style.display = "none";
    }
  });

  document.querySelectorAll(".stepper-nav .step-item").forEach((item) => {
    const itemStep = parseInt(item.dataset.step, 10);
    if (itemStep === stepNum) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  });

  window.scrollTo({ top: 0, behavior: "smooth" });
}

/**
 * Device Condition & Action Models for Section 5 (Logic Engine)
 * Defines dynamic, device-specific input conditions and output actions per selected peripheral.
 */
function getSensorConditionModel(sensor) {
  if (!sensor) {
    return { isDigital: false, variables: [{ id: "val", name: "Value", varName: "val", unit: "", defaultThresh: 0, step: 0.5 }] };
  }

  const t = sensor.type;
  if (t === "pushbutton") {
    return {
      isDigital: true,
      options: [
        { value: "PRESSED", label: "IS PRESSED / ACTIVE (Pullup LOW)", numericVal: 1 },
        { value: "RELEASED", label: "IS RELEASED / IDLE (Pullup HIGH)", numericVal: 0 }
      ]
    };
  }
  if (t === "toggle_switch") {
    return {
      isDigital: true,
      options: [
        { value: "ON", label: "IS SWITCHED ON (HIGH / Closed)", numericVal: 1 },
        { value: "OFF", label: "IS SWITCHED OFF (LOW / Open)", numericVal: 0 }
      ]
    };
  }
  if (t === "ir_sensor") {
    return {
      isDigital: true,
      options: [
        { value: "DETECTED", label: "OBSTACLE / TARGET DETECTED (Active)", numericVal: 1 },
        { value: "CLEAR", label: "PATH CLEAR / NO OBSTACLE (Idle)", numericVal: 0 }
      ]
    };
  }
  if (t === "pir") {
    return {
      isDigital: true,
      options: [
        { value: "MOTION", label: "MOTION DETECTED (Active HIGH)", numericVal: 1 },
        { value: "CLEAR", label: "NO MOTION / AREA IDLE (LOW)", numericVal: 0 }
      ]
    };
  }
  if (t === "rfid_rc522") {
    return {
      isDigital: true,
      options: [
        { value: "DETECTED", label: "RFID CARD DETECTED / SCANNED", numericVal: 1 },
        { value: "NONE", label: "NO CARD PRESENT / SCANNER IDLE", numericVal: 0 }
      ]
    };
  }
  if (t === "sd_card") {
    return {
      isDigital: true,
      options: [
        { value: "READY", label: "SD CARD MOUNTED / READY (OK)", numericVal: 1 },
        { value: "ERROR", label: "SD CARD ERROR / MISSING", numericVal: 0 }
      ]
    };
  }
  if (t === "rtc_ds3231") {
    return {
      isDigital: true,
      options: [
        { value: "ALARM_MATCH", label: "SCHEDULED TIME MATCH / ALARM (Active)", numericVal: 1 },
        { value: "IDLE", label: "TIME INTERVAL IDLE", numericVal: 0 }
      ]
    };
  }
  if (t === "gsm_gps") {
    return {
      isDigital: true,
      options: [
        { value: "FIX_ACQUIRED", label: "GPS FIX ACQUIRED / VALID LOCATION", numericVal: 1 },
        { value: "NO_FIX", label: "SEARCHING FOR SATELLITE FIX (NO FIX)", numericVal: 0 }
      ]
    };
  }

  // Multi-variable / continuous sensors
  if (t === "dht22" || t === "dht11") {
    return {
      isDigital: false,
      variables: [
        { id: "temperature", name: "Temperature", varName: sensor.varTemp || "temperature", unit: sensor.unitTemp || "°C", defaultThresh: 30.0, step: 0.5 },
        { id: "humidity", name: "Humidity", varName: sensor.varHum || "humidity", unit: sensor.unitHum || "%", defaultThresh: 60.0, step: 1 }
      ]
    };
  }
  if (t === "bmp280" || t === "bme280") {
    return {
      isDigital: false,
      variables: [
        { id: "baroPressure", name: "Barometric Pressure", varName: sensor.varPress || "baroPress", unit: "hPa", defaultThresh: 1013.2, step: 1 },
        { id: "baroTemp", name: "Temperature", varName: sensor.varTemp || "baroTemp", unit: "°C", defaultThresh: 28.0, step: 0.5 }
      ]
    };
  }
  if (t === "soil") {
    return {
      isDigital: false,
      defaultOp: "<",
      variables: [
        { id: "soilMoisture", name: "Soil Moisture", varName: sensor.varVal || "soilMoisture", unit: sensor.unit || "%", defaultThresh: 35.0, step: 1 }
      ]
    };
  }
  if (t === "water_level") {
    return {
      isDigital: false,
      defaultOp: "<",
      variables: [
        { id: "tankWaterLevel", name: "Tank Water Level", varName: sensor.varVal || "tankWaterLevel", unit: sensor.unit || "%", defaultThresh: 25.0, step: 1 }
      ]
    };
  }
  if (t === "ldr") {
    return {
      isDigital: false,
      defaultOp: "<",
      variables: [
        { id: "lightLevel", name: "Light Intensity", varName: sensor.varVal || "lightLevel", unit: sensor.unit || "lux", defaultThresh: 200, step: 10 }
      ]
    };
  }
  if (t === "mq135") {
    return {
      isDigital: false,
      defaultOp: ">",
      variables: [
        { id: "airQualityPpm", name: "Air Quality PPM", varName: sensor.varVal || "airQualityPpm", unit: sensor.unit || "ppm", defaultThresh: 400, step: 10 }
      ]
    };
  }
  if (t === "ultrasonic") {
    return {
      isDigital: false,
      defaultOp: "<",
      variables: [
        { id: "distanceCm", name: "Distance", varName: sensor.varVal || "distanceCm", unit: sensor.unit || "cm", defaultThresh: 15, step: 1 }
      ]
    };
  }
  if (t === "mpu6050") {
    return {
      isDigital: false,
      defaultOp: ">",
      variables: [
        { id: "accelMagnitude", name: "Acceleration Magnitude", varName: sensor.varVal || "accelMagnitude", unit: "m/s²", defaultThresh: 12.0, step: 0.5 }
      ]
    };
  }

  // Fallback for custom ADC or generic analog sensors
  return {
    isDigital: false,
    defaultOp: ">",
    variables: [
      { id: "val", name: sensor.name || "Sensor Value", varName: sensor.varVal || "val", unit: sensor.unit || "val", defaultThresh: 50.0, step: 1 }
    ]
  };
}

function getActuatorActionModel(actuator) {
  if (!actuator) {
    return {
      category: "digital",
      options: [
        { value: "HIGH", label: "TURN ON (HIGH)" },
        { value: "LOW", label: "TURN OFF (LOW)" }
      ]
    };
  }

  const t = actuator.type;
  if (t === "relay") {
    return {
      category: "digital",
      options: [
        { value: "HIGH", label: "TURN ON / HIGH (Energize)" },
        { value: "LOW", label: "TURN OFF / LOW (De-energize)" },
        { value: "TOGGLE", label: "TOGGLE STATE" }
      ]
    };
  }
  if (t === "buzzer") {
    return {
      category: "digital",
      options: [
        { value: "HIGH", label: "SOUND ALARM / HIGH" },
        { value: "LOW", label: "SILENCE ALARM / LOW" },
        { value: "TOGGLE", label: "BEEP / TOGGLE" }
      ]
    };
  }
  if (t === "motor_pwm") {
    return {
      category: "pwm",
      unit: "PWM",
      options: [
        { value: "255", label: "Full Speed (255 / 100%)" },
        { value: "192", label: "High Speed (192 / 75%)" },
        { value: "128", label: "Medium Speed (128 / 50%)" },
        { value: "64", label: "Low Speed (64 / 25%)" },
        { value: "0", label: "Stop Motor (0 PWM)" },
        { value: "custom", label: "Custom PWM Speed (0-255)..." }
      ],
      defaultCustomVal: 200
    };
  }
  if (t === "pwm_led") {
    return {
      category: "pwm",
      unit: "Duty",
      options: [
        { value: "255", label: "100% Full Brightness (255)" },
        { value: "192", label: "75% High Brightness (192)" },
        { value: "128", label: "50% Medium Brightness (128)" },
        { value: "64", label: "25% Dim / Low (64)" },
        { value: "0", label: "Turn OFF (0 Duty)" },
        { value: "custom", label: "Custom Brightness (0-255)..." }
      ],
      defaultCustomVal: 180
    };
  }
  if (t === "servo") {
    return {
      category: "servo",
      unit: "°",
      options: [
        { value: "0", label: "Position 0° (Closed / Minimum)" },
        { value: "45", label: "Position 45°" },
        { value: "90", label: "Position 90° (Half-Open / Neutral)" },
        { value: "135", label: "Position 135°" },
        { value: "180", label: "Position 180° (Fully Open)" },
        { value: "custom", label: "Custom Position (0-180°)..." }
      ],
      defaultCustomVal: 90
    };
  }
  if (t === "stepper_motor") {
    return {
      category: "stepper",
      unit: "steps",
      options: [
        { value: "1000", label: "Rotate Forward (+1000 steps)" },
        { value: "-1000", label: "Rotate Reverse (-1000 steps)" },
        { value: "2048", label: "Full 360° Revolution (+2048 steps)" },
        { value: "1024", label: "Half 180° Turn (+1024 steps)" },
        { value: "0", label: "Stop / Hold Position (0 steps)" },
        { value: "custom", label: "Custom Step Count..." }
      ],
      defaultCustomVal: 1000
    };
  }
  if (t === "lcd_16x2" || t === "lcd_20x4" || t === "oled") {
    const isLCD = t.startsWith("lcd");
    const options = [
      { value: "MSG_ALERT", label: "Display Alert Message" },
      { value: "SHOW_READING", label: "Display Live Sensor Telemetry" },
      { value: "CLEAR", label: "Clear Screen" }
    ];
    if (isLCD) {
      options.push({ value: "BACKLIGHT_OFF", label: "Turn Backlight OFF" });
    }
    return {
      category: "display",
      options,
      defaultCustomMessage: "ALERT: LIMIT BREACHED!"
    };
  }

  // Fallback
  return {
    category: "digital",
    options: [
      { value: "HIGH", label: "TURN ON / HIGH" },
      { value: "LOW", label: "TURN OFF / LOW" }
    ]
  };
}

/**
 * 2. Dedicated Modal Catalogs & Pages
 */
function initModalCatalogs() {
  // Modal Open Buttons
  const openSensorCatalog = () => {
    populateSensorCatalogGrid("all");
    populateSensorPinSelect();
    openModal("modal-add-sensor");
  };
  // The header button and the Bug 9 guidance button both open the catalog.
  ["btn-open-add-sensor-page", "btn-open-add-sensor-page-guide"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("click", openSensorCatalog);
  });

  document.getElementById("btn-open-add-actuator-page").addEventListener("click", () => {
    populateActuatorCatalogGrid("all");
    populateActuatorPinSelect();
    openModal("modal-add-actuator");
  });

  document.getElementById("btn-open-add-rule-page").addEventListener("click", () => {
    if (state.sensors.length === 0 || state.actuators.length === 0) {
      showToast("Please add at least 1 sensor and 1 actuator first!");
      return;
    }
    populateRuleModalDropdowns();
    openModal("modal-add-rule");
  });

  // Modal Close Buttons
  document.querySelectorAll("[data-close-modal]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const modalId = btn.dataset.closeModal;
      closeModal(modalId);
    });
  });

  // Close when clicking modal backdrop
  document.querySelectorAll(".modal-overlay").forEach((modal) => {
    modal.addEventListener("click", (e) => {
      if (e.target !== modal) return;
      // The resume prompt requires a choice, so an accidental backdrop click
      // resolves it as "Previous Session" instead of closing it silently.
      if (modal.dataset.awaitingChoice === "1") {
        const resumeBtn = document.getElementById("btn-session-previous");
        if (resumeBtn) resumeBtn.click();
        return;
      }
      closeModal(modal.id);
    });
  });

  // Sensor Catalog Filters
  const sensorTabs = document.querySelectorAll("#sensor-category-tabs .cat-btn");
  sensorTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      sensorTabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      const searchVal = document.getElementById("sensor-search-input").value.toLowerCase();
      populateSensorCatalogGrid(tab.dataset.cat, searchVal);
    });
  });

  document.getElementById("sensor-search-input").addEventListener("input", (e) => {
    const activeTab = document.querySelector("#sensor-category-tabs .cat-btn.active");
    const cat = activeTab ? activeTab.dataset.cat : "all";
    populateSensorCatalogGrid(cat, e.target.value.toLowerCase());
  });

  // Actuator Catalog Filters
  const actuatorTabs = document.querySelectorAll("#actuator-category-tabs .cat-btn");
  actuatorTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      actuatorTabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      const searchVal = document.getElementById("actuator-search-input").value.toLowerCase();
      populateActuatorCatalogGrid(tab.dataset.cat, searchVal);
    });
  });

  document.getElementById("actuator-search-input").addEventListener("input", (e) => {
    const activeTab = document.querySelector("#actuator-category-tabs .cat-btn.active");
    const cat = activeTab ? activeTab.dataset.cat : "all";
    populateActuatorCatalogGrid(cat, e.target.value.toLowerCase());
  });

  // Submit Add Sensor Form
  document.getElementById("btn-submit-add-sensor").addEventListener("click", () => {
    const name = document.getElementById("add-sensor-name").value.trim() || "New Sensor";
    const type = document.getElementById("add-sensor-type").value;
    const pin = parseInt(document.getElementById("add-sensor-pin").value, 10);
    const varName = slugifyTelemetryKey(document.getElementById("add-sensor-var").value) || "value";
    const dataType = document.getElementById("add-sensor-datatype").value;
    const varName2 = document.getElementById("add-sensor-var2").value;
    const dataType2 = document.getElementById("add-sensor-datatype2").value;
    const interval = parseInt(document.getElementById("add-sensor-interval").value, 10);
    const unit = document.getElementById("add-sensor-unit").value.trim() || "val";
    const randomPresetEl = document.getElementById("add-sensor-random-preset");
    const randomPreset = randomPresetEl ? randomPresetEl.value : "off";
    const busConfig = CONTROLLER_BUSES[state.controller] || CONTROLLER_BUSES.esp32_devkit;

    const modalEl = document.getElementById("modal-add-sensor");
    const catId = modalEl?.dataset?.selectedCatalogId;
    const catalogItem = SENSOR_CATALOG.find(c => c.id === catId || c.type === type) || SENSOR_CATALOG[0];

    const id = "sens_" + Date.now().toString(36);
    const secondaryKey = uniqueTelemetryKey(slugifyTelemetryKey(varName2 || `${varName}_2`), id);

    // The variable_id is server-issued on push, so only the editable side of the
    // binding is captured here.
    const newSensor = {
      id,
      catalogId: catalogItem.id,
      type: catalogItem.type,
      name,
      telemetryKey: varName,
      keyTouched: true,
      pin,
      bus: catalogItem.bus || null,
      signalType: catalogItem.signalType || (catalogItem.isAnalog ? "adc" : "digital_input"),
      varVal: varName,
      dataType,
      unit,
      readInterval: interval,
      sensorId: "",
      variableIds: {},
      random: defaultRandomConfig(dataType)
    };

    // Optional "simulate immediately" so the generated sketch runs without hardware.
    if (randomPreset !== "off") {
      patchRandomConfig(newSensor, {
        enabled: true,
        mode: randomPreset,
        intervalMs: interval || 2000,
        max: dataType === "boolean" ? 1 : 100
      });
    }

    if (catalogItem.type === "ultrasonic") {
      newSensor.trigPin = busConfig.ultrasonic.trig;
      newSensor.echoPin = busConfig.ultrasonic.echo;
    }
    if (catalogItem.bus === "spi") {
      newSensor.csPin = pin;
    }
    if (catalogItem.type === "dht22" || catalogItem.type === "dht11") {
      newSensor.varTemp = varName;
      newSensor.varHum = secondaryKey;
      newSensor.dataTypeTemp = dataType;
      newSensor.dataTypeHum = dataType2;
      newSensor.unitTemp = "C";
      newSensor.unitHum = "%";
    } else if (catalogItem.type === "bmp280") {
      newSensor.varTemp = varName;
      newSensor.varPress = secondaryKey;
      newSensor.dataTypeTemp = dataType;
      newSensor.dataTypePress = dataType2;
      newSensor.unitTemp = "C";
      newSensor.unitPress = "hPa";
    }

    state.sensors.push(newSensor);
    renderSensorsList();
    renderRulesList();
    updateStudio();
    closeModal("modal-add-sensor");
    showToast(`Added ${newSensor.name}${newSensor.random.enabled ? " with the Random Value Generator on" : ""}`);
  });

  // Submit Add Actuator Form
  document.getElementById("btn-submit-add-actuator").addEventListener("click", () => {
    const name = document.getElementById("add-actuator-name").value.trim() || "New Actuator";
    const type = document.getElementById("add-actuator-type").value;
    const pin = parseInt(document.getElementById("add-actuator-pin").value, 10);
    const varName = document.getElementById("add-actuator-var").value.trim() || "actState";
    const paramType = document.getElementById("add-actuator-datatype").value;
    const templateId = document.getElementById("add-actuator-template").value.trim();
    const logic = document.getElementById("add-actuator-logic").value;
    const defaultState = document.getElementById("add-actuator-default").value;
    const builtInLedEl = document.getElementById("add-actuator-builtin-led");
    const useBuiltInLed = !!(builtInLedEl && builtInLedEl.checked);
    const busConfig = CONTROLLER_BUSES[state.controller] || CONTROLLER_BUSES.esp32_devkit;

    const modalEl = document.getElementById("modal-add-actuator");
    const catId = modalEl?.dataset?.selectedCatalogId;
    const catalogItem = ACTUATOR_CATALOG.find(c => c.id === catId || c.type === type) || ACTUATOR_CATALOG[0];

    const id = "act_" + Date.now().toString(36);
    const newActuator = {
      id,
      catalogId: catalogItem.id,
      type: catalogItem.type,
      name,
      pin,
      bus: catalogItem.bus || null,
      signalType: catalogItem.signalType || "digital_output",
      activeLow: logic === "active_low",
      defaultState,
      varState: varName,
      paramType,
      templateId: templateId || "",
      commandId: "",
      useBuiltInLed,
      response: defaultResponseMap({ type: catalogItem.type })
    };

    if (catalogItem.type === "stepper_motor") {
      newActuator.pins = [...busConfig.stepper.pins];
    }
    if (type === "pwm_led" || type === "motor_pwm") {
      newActuator.channel = state.actuators.filter(a => a.type === "pwm_led" || a.type === "motor_pwm").length;
      newActuator.frequency = 5000;
    }

    state.actuators.push(newActuator);
    renderActuatorsList();
    renderRulesList();
    updateStudio();
    closeModal("modal-add-actuator");
    showToast(`Added ${newActuator.name} to outputs`);
  });

  // Submit Add Logic Rule Form
  document.getElementById("btn-submit-add-rule").addEventListener("click", () => {
    const sensorId = document.getElementById("modal-rule-sensor").value;
    const actuatorId = document.getElementById("modal-rule-actuator").value;
    const sensor = state.sensors.find((s) => s.id === sensorId);
    const actuator = state.actuators.find((a) => a.id === actuatorId);
    if (!sensor || !actuator) {
      showToast("Sensor or Actuator selection invalid");
      return;
    }

    const condModel = getSensorConditionModel(sensor);
    const actModel = getActuatorActionModel(actuator);

    let subVar = "val";
    let operator = ">";
    let threshold = 0;
    let targetDigitalState = "";
    let hysteresis = 1.0;

    if (condModel.isDigital) {
      const digitalSelect = document.getElementById("modal-rule-digital-state");
      targetDigitalState = digitalSelect ? digitalSelect.value : (condModel.options[0]?.value || "ACTIVE");
      operator = "==";
      threshold = (targetDigitalState === "PRESSED" || targetDigitalState === "ON" || targetDigitalState === "DETECTED" || targetDigitalState === "READY" || targetDigitalState === "MOTION" || targetDigitalState === "ALARM_MATCH" || targetDigitalState === "FIX_ACQUIRED") ? 1 : 0;
      subVar = sensor.varVal || "state";
      hysteresis = 0;
    } else {
      const subVarEl = document.getElementById("modal-rule-subvar");
      subVar = subVarEl ? subVarEl.value : (condModel.variables[0]?.varName || sensor.varTemp || sensor.varVal || "val");
      const opEl = document.getElementById("modal-rule-op");
      operator = opEl ? opEl.value : (condModel.defaultOp || ">");
      const threshEl = document.getElementById("modal-rule-threshold");
      threshold = threshEl ? (parseFloat(threshEl.value) || 0) : 0;
      const hystEl = document.getElementById("modal-rule-hysteresis");
      hysteresis = hystEl ? (parseFloat(hystEl.value) || 0) : 1.0;
    }

    const stateSelect = document.getElementById("modal-rule-state");
    const targetState = stateSelect ? stateSelect.value : (actModel.options[0]?.value || "HIGH");

    let customVal = 0;
    const customValEl = document.getElementById("modal-rule-custom-act-val");
    if (customValEl) customVal = parseFloat(customValEl.value) || 0;

    let customMessage = "";
    const customMsgEl = document.getElementById("modal-rule-custom-msg");
    if (customMsgEl) customMessage = customMsgEl.value.trim() || "ALERT: LIMIT REACHED!";

    const cloudAlert = document.getElementById("modal-rule-cloud-alert").checked;

    state.rules.push({
      id: "rule_" + Date.now().toString(36),
      sensorId,
      subVar,
      operator,
      threshold,
      targetDigitalState,
      hysteresis,
      actuatorId,
      targetState,
      customVal,
      customMessage,
      cloudAlert
    });

    renderRulesList();
    updateStudio();
    closeModal("modal-add-rule");
    showToast("New automation rule compiled!");
  });
}

function openModal(modalId) {
  // studio-ui.js adds aria attributes, focus trap, Esc handling and focus restore.
  if (window.StudioUI) return window.StudioUI.openModal(modalId);
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add("open");
}

function closeModal(modalId) {
  if (window.StudioUI) return window.StudioUI.closeModal(modalId);
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove("open");
}

function populateSensorCatalogGrid(category = "all", searchQuery = "") {
  const grid = document.getElementById("sensor-catalog-grid");
  const filtered = SENSOR_CATALOG.filter((item) => {
    const matchesCat = category === "all" || item.category === category;
    const matchesSearch = !searchQuery || item.name.toLowerCase().includes(searchQuery) || item.desc.toLowerCase().includes(searchQuery);
    return matchesCat && matchesSearch;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-dim); padding: 2rem;">No sensors found matching criteria.</div>`;
    return;
  }

  grid.innerHTML = filtered.map((item, idx) => {
    return `
      <div class="catalog-item-card ${idx === 0 ? 'selected' : ''}" data-sensor-id="${item.id}">
        <div class="cat-item-icon">
          ${item.icon}
        </div>
        <div class="cat-item-name">${item.name}</div>
        <div class="cat-item-desc">${item.desc}</div>
        <span class="cat-item-tag">${item.interface}</span>
      </div>
    `;
  }).join("");

  // Select first item by default
  if (filtered.length > 0) {
    selectSensorCatalogItem(filtered[0]);
  }

  // Click card to select
  grid.querySelectorAll(".catalog-item-card").forEach((card) => {
    card.addEventListener("click", () => {
      grid.querySelectorAll(".catalog-item-card").forEach((c) => c.classList.remove("selected"));
      card.classList.add("selected");
      const found = SENSOR_CATALOG.find((s) => s.id === card.dataset.sensorId);
      if (found) selectSensorCatalogItem(found);
    });
  });
}

function selectSensorCatalogItem(item) {
  const modalEl = document.getElementById("modal-add-sensor");
  if (modalEl) modalEl.dataset.selectedCatalogId = item.id;

  const seq = state.sensors.length + 1;
  document.getElementById("add-sensor-name").value = `${item.name} ${seq}`;
  document.getElementById("add-sensor-type").value = item.type;
  document.getElementById("add-sensor-var").value = `${item.defaultVar}_${seq}`;
  document.getElementById("add-sensor-interval").value = item.interval || 2000;
  document.getElementById("add-sensor-unit").value = item.unit || "val";
  document.getElementById("add-sensor-datatype").value = inferCloudDataType(item);

  // Each new sensor starts reading real hardware; simulation is opt-in.
  const randomPresetEl = document.getElementById("add-sensor-random-preset");
  if (randomPresetEl) randomPresetEl.value = "off";

  // Secondary cloud variable is only meaningful for dual-reading sensors.
  const dual = getSensorCloudVariables(item).length > 1;
  const secondGroup = document.getElementById("group-sensor-second");
  const primaryRole = document.getElementById("add-sensor-primary-role");
  const secondaryRole = document.getElementById("add-sensor-secondary-role");

  if (item.type === "dht22" || item.type === "dht11" || item.type === "bmp280") {
    const vars = getSensorCloudVariables(item);
    if (primaryRole) primaryRole.textContent = vars[0].role;
    if (secondaryRole) secondaryRole.textContent = vars[1].role;
    document.getElementById("add-sensor-var").value = `${vars[0].label}_${seq}`;
    document.getElementById("add-sensor-datatype").value = vars[0].dataType;
    document.getElementById("add-sensor-var2").value = `${vars[1].label}_${seq}`;
    document.getElementById("add-sensor-datatype2").value = vars[1].dataType;
  } else if (primaryRole) {
    primaryRole.textContent = "Primary Reading";
  }
  if (secondGroup) secondGroup.style.display = dual ? "block" : "none";

  const pinSelect = document.getElementById("add-sensor-pin");
  const filteredPins = getFilteredPinOptions(item, state.controller, false);
  const usedPins = getAllAssignedPins();

  pinSelect.innerHTML = filteredPins.map((p) => `<option value="${p.pin}">${p.label}</option>`).join("");

  if (item.bus === "i2c" || (filteredPins.length === 1 && filteredPins[0].isFixed)) {
    pinSelect.value = filteredPins[0].pin;
    pinSelect.disabled = true;
    document.getElementById("add-sensor-pin-hint").textContent = `${item.interface} (Dedicated Hardware Bus)`;
  } else if (item.bus === "spi") {
    pinSelect.disabled = false;
    const usedCs = state.sensors.filter(s => s.bus === "spi").map(s => s.pin);
    const freeCs = filteredPins.find(p => !usedCs.includes(p.pin) && !usedPins.includes(p.pin)) || filteredPins.find(p => !usedCs.includes(p.pin)) || filteredPins[0];
    pinSelect.value = freeCs.pin;
    document.getElementById("add-sensor-pin-hint").textContent = `SPI Shared Bus: Select unique Chip Select (CS) pin`;
  } else {
    pinSelect.disabled = false;
    let targetPin = item.signalType === "i2c" ? 21 : item.signalType === "spi" ? 5 : item.signalType === "uart" ? 16 : 4;
    if (usedPins.includes(targetPin) || !filteredPins.some(p => p.pin === targetPin)) {
      const nextFree = filteredPins.find((p) => !usedPins.includes(p.pin)) || filteredPins[0];
      if (nextFree) targetPin = nextFree.pin;
    }
    pinSelect.value = targetPin;
    document.getElementById("add-sensor-pin-hint").textContent = (item.signalType === "adc" || item.isAnalog)
      ? "Analog ADC Input Only (0-3.3V)"
      : item.interface;
  }
}

/**
 * Cloud data type for a sensor catalog item's primary reading.
 * Mirrors the gateway's immutable `data_type`: float | integer | boolean | string.
 */
function inferCloudDataType(item) {
  if (!item) return "float";
  const t = item.type;
  if (["pushbutton", "toggle_switch", "ir_sensor", "pir", "sd_card"].includes(t)) return "boolean";
  if (["rtc_ds3231", "rfid_rc522", "gsm_gps"].includes(t)) return "string";
  return "float";
}

/**
 * Cloud variable slots exposed by a sensor. Dual-reading sensors (DHT11/DHT22,
 * BMP280/BME280) map to two independent cloud variables on the gateway.
 */
function getSensorCloudVariables(item) {
  const t = item ? item.type : "";
  if (t === "dht22" || t === "dht11") {
    return [
      { role: "Temperature", label: "temperature", dataType: "float", unit: "°C" },
      { role: "Humidity", label: "humidity", dataType: "float", unit: "%" }
    ];
  }
  if (t === "bmp280") {
    return [
      { role: "Temperature", label: "baroTemp", dataType: "float", unit: "°C" },
      { role: "Pressure", label: "baroPress", dataType: "float", unit: "hPa" }
    ];
  }
  return [{
    role: "Primary Reading",
    label: (item && item.defaultVar) || "val",
    dataType: inferCloudDataType(item),
    unit: (item && item.unit) || "val"
  }];
}

function populateSensorPinSelect() {
  const pinSelect = document.getElementById("add-sensor-pin");
  const activeType = document.getElementById("add-sensor-type")?.value || "dht22";
  const item = SENSOR_CATALOG.find((c) => c.type === activeType) || SENSOR_CATALOG[0];
  const filteredPins = getFilteredPinOptions(item, state.controller, false);
  pinSelect.innerHTML = filteredPins.map((p) => {
    return `<option value="${p.pin}">${p.label}</option>`;
  }).join("");
  pinSelect.disabled = filteredPins.length === 1 && filteredPins[0].isFixed;
}

function populateActuatorCatalogGrid(category = "all", searchQuery = "") {
  const grid = document.getElementById("actuator-catalog-grid");
  const filtered = ACTUATOR_CATALOG.filter((item) => {
    const matchesCat = category === "all" || item.category === category;
    const matchesSearch = !searchQuery || item.name.toLowerCase().includes(searchQuery) || item.desc.toLowerCase().includes(searchQuery);
    return matchesCat && matchesSearch;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-dim); padding: 2rem;">No actuators found.</div>`;
    return;
  }

  grid.innerHTML = filtered.map((item, idx) => {
    return `
      <div class="catalog-item-card ${idx === 0 ? 'selected' : ''}" data-actuator-id="${item.id}">
        <div class="cat-item-icon actuator-cat-icon">
          ${item.icon}
        </div>
        <div class="cat-item-name">${item.name}</div>
        <div class="cat-item-desc">${item.desc}</div>
        <span class="cat-item-tag" style="color: var(--electric-violet);">${item.interface}</span>
      </div>
    `;
  }).join("");

  if (filtered.length > 0) {
    selectActuatorCatalogItem(filtered[0]);
  }

  grid.querySelectorAll(".catalog-item-card").forEach((card) => {
    card.addEventListener("click", () => {
      grid.querySelectorAll(".catalog-item-card").forEach((c) => c.classList.remove("selected"));
      card.classList.add("selected");
      const found = ACTUATOR_CATALOG.find((a) => a.id === card.dataset.actuatorId);
      if (found) selectActuatorCatalogItem(found);
    });
  });
}

function selectActuatorCatalogItem(item) {
  const modalEl = document.getElementById("modal-add-actuator");
  if (modalEl) modalEl.dataset.selectedCatalogId = item.id;

  document.getElementById("add-actuator-name").value = `${item.name} ${state.actuators.length + 1}`;
  document.getElementById("add-actuator-type").value = item.type;
  document.getElementById("add-actuator-var").value = `${item.defaultVar || "actState"}_${state.actuators.length + 1}`;
  document.getElementById("add-actuator-default").value = item.defaultState || "LOW";
  document.getElementById("add-actuator-logic").value = item.activeLow ? "active_low" : "active_high";
  document.getElementById("add-actuator-datatype").value = inferActuatorParamType(item);

  const pinSelect = document.getElementById("add-actuator-pin");
  const filteredPins = getFilteredPinOptions(item, state.controller, true);
  const usedPins = getAllAssignedPins();

  pinSelect.innerHTML = filteredPins.map((p) => `<option value="${p.pin}">${p.label}</option>`).join("");

  if (item.bus === "i2c" || (filteredPins.length === 1 && filteredPins[0].isFixed)) {
    pinSelect.value = filteredPins[0].pin;
    pinSelect.disabled = true;
  } else {
    pinSelect.disabled = false;
    let targetPin = item.defaultPin;
    if (usedPins.includes(targetPin) || !filteredPins.some(p => p.pin === targetPin)) {
      const nextFree = filteredPins.find((p) => !usedPins.includes(p.pin)) || filteredPins[0];
      if (nextFree) targetPin = nextFree.pin;
    }
    pinSelect.value = targetPin;
  }
}

function populateActuatorPinSelect() {
  const pinSelect = document.getElementById("add-actuator-pin");
  const activeType = document.getElementById("add-actuator-type")?.value || "relay";
  const item = ACTUATOR_CATALOG.find((c) => c.type === activeType) || ACTUATOR_CATALOG[0];
  const filteredPins = getFilteredPinOptions(item, state.controller, true);
  pinSelect.innerHTML = filteredPins.map((p) => {
    return `<option value="${p.pin}">${p.label}</option>`;
  }).join("");
  pinSelect.disabled = filteredPins.length === 1 && filteredPins[0].isFixed;
}

/**
 * Cloud command parameter type for an actuator catalog item. Mirrors the
 * gateway's `param_type`: integer | float | string | boolean.
 */
function inferActuatorParamType(item) {
  if (!item) return "boolean";
  const t = item.type;
  if (t === "pwm_led" || t === "motor_pwm" || t === "servo" || t === "stepper_motor") return "integer";
  if (t === "lcd_16x2" || t === "lcd_20x4" || t === "oled") return "string";
  return "boolean";
}

function populateRuleModalDropdowns() {
  const sensorSelect = document.getElementById("modal-rule-sensor");
  const actuatorSelect = document.getElementById("modal-rule-actuator");

  sensorSelect.innerHTML = state.sensors.map((s) => {
    return `<option value="${s.id}">${s.name} (${s.varTemp || s.varVal || 'val'})</option>`;
  }).join("");

  actuatorSelect.innerHTML = state.actuators.map((a) => {
    return `<option value="${a.id}">${a.name} (${a.varState})</option>`;
  }).join("");

  // Update dynamic fields for initially selected items
  updateModalRuleConditionFields();
  updateModalRuleActionFields();

  // Attach change listeners to update dynamic fields
  sensorSelect.onchange = () => updateModalRuleConditionFields();
  actuatorSelect.onchange = () => updateModalRuleActionFields();
}

function updateModalRuleConditionFields() {
  const sensorId = document.getElementById("modal-rule-sensor").value;
  const sensor = state.sensors.find((s) => s.id === sensorId);
  const container = document.getElementById("modal-rule-condition-dynamic");
  if (!container) return;

  const condModel = getSensorConditionModel(sensor);

  if (condModel.isDigital) {
    const opts = condModel.options.map((opt) => {
      return `<option value="${opt.value}">${opt.label}</option>`;
    }).join("");

    container.innerHTML = `
      <div class="form-group full-width">
        <label for="modal-rule-digital-state">Trigger State Condition <span class="required">*</span></label>
        <select id="modal-rule-digital-state" class="form-control">
          ${opts}
        </select>
        <small class="form-hint">Autonomous edge trigger fires when device reaches this logic state.</small>
      </div>
    `;
  } else if (condModel.variables && condModel.variables.length > 1) {
    // Multi-metric like DHT22 / BMP280
    const varOpts = condModel.variables.map((v) => {
      return `<option value="${v.varName}" data-unit="${v.unit}" data-thresh="${v.defaultThresh}" data-step="${v.step || 0.5}">${v.name} (${v.unit})</option>`;
    }).join("");

    const initialVar = condModel.variables[0];
    container.innerHTML = `
      <div class="form-group">
        <label for="modal-rule-subvar">Measurement Metric <span class="required">*</span></label>
        <select id="modal-rule-subvar" class="form-control">
          ${varOpts}
        </select>
      </div>

      <div class="form-group">
        <label for="modal-rule-op">Comparison Operator <span class="required">*</span></label>
        <select id="modal-rule-op" class="form-control">
          <option value=">" selected>is greater than (&gt;)</option>
          <option value="<">is less than (&lt;)</option>
          <option value=">=">is at least (&gt;=)</option>
          <option value="<=">is at most (&lt;=)</option>
          <option value="==">equals (==)</option>
          <option value="!=">not equals (!=)</option>
        </select>
      </div>

      <div class="form-group">
        <label for="modal-rule-threshold">Threshold Limit (<span id="modal-rule-unit-badge">${initialVar.unit}</span>) <span class="required">*</span></label>
        <input type="number" step="${initialVar.step || 0.5}" id="modal-rule-threshold" class="form-control" value="${initialVar.defaultThresh}">
      </div>

      <div class="form-group">
        <label for="modal-rule-hysteresis">Hysteresis Band (Deadband)</label>
        <input type="number" step="0.1" id="modal-rule-hysteresis" class="form-control" value="1.0">
        <small class="form-hint">Prevents rapid relay oscillation around limit.</small>
      </div>
    `;

    const subVarSelect = document.getElementById("modal-rule-subvar");
    subVarSelect.addEventListener("change", (e) => {
      const selectedOpt = e.target.options[e.target.selectedIndex];
      const unit = selectedOpt.dataset.unit || "";
      const defaultThresh = selectedOpt.dataset.thresh || "30";
      const step = selectedOpt.dataset.step || "0.5";
      const badge = document.getElementById("modal-rule-unit-badge");
      if (badge) badge.textContent = unit;
      const threshInput = document.getElementById("modal-rule-threshold");
      if (threshInput) {
        threshInput.value = defaultThresh;
        threshInput.step = step;
      }
    });
  } else {
    // Single analog / continuous
    const v = condModel.variables ? condModel.variables[0] : { unit: "%", step: 0.5, defaultThresh: 35 };
    const defOp = condModel.defaultOp || ">";
    container.innerHTML = `
      <div class="form-group">
        <label for="modal-rule-op">Comparison Operator <span class="required">*</span></label>
        <select id="modal-rule-op" class="form-control">
          <option value="<" ${defOp === '<' ? 'selected' : ''}>is less than (&lt;)</option>
          <option value=">" ${defOp === '>' ? 'selected' : ''}>is greater than (&gt;)</option>
          <option value=">=">is at least (&gt;=)</option>
          <option value="<=">is at most (&lt;=)</option>
          <option value="==">equals (==)</option>
          <option value="!=">not equals (!=)</option>
        </select>
      </div>

      <div class="form-group">
        <label for="modal-rule-threshold">Threshold Limit (<span id="modal-rule-unit-badge">${v.unit}</span>) <span class="required">*</span></label>
        <input type="number" step="${v.step || 0.5}" id="modal-rule-threshold" class="form-control" value="${v.defaultThresh}">
      </div>

      <div class="form-group">
        <label for="modal-rule-hysteresis">Hysteresis Band (Deadband)</label>
        <input type="number" step="0.1" id="modal-rule-hysteresis" class="form-control" value="1.0">
        <small class="form-hint">Prevents rapid relay oscillation around limit.</small>
      </div>
    `;
  }
}

function updateModalRuleActionFields() {
  const actuatorId = document.getElementById("modal-rule-actuator").value;
  const actuator = state.actuators.find((a) => a.id === actuatorId);
  const container = document.getElementById("modal-rule-action-dynamic");
  if (!container) return;

  const actModel = getActuatorActionModel(actuator);

  const opts = actModel.options.map((opt, idx) => {
    return `<option value="${opt.value}" ${idx === 0 ? 'selected' : ''}>${opt.label}</option>`;
  }).join("");

  if (actModel.category === "digital") {
    container.innerHTML = `
      <div class="form-group full-width">
        <label for="modal-rule-state">Action Output State <span class="required">*</span></label>
        <select id="modal-rule-state" class="form-control">
          ${opts}
        </select>
      </div>
    `;
  } else if (actModel.category === "pwm") {
    container.innerHTML = `
      <div class="form-group">
        <label for="modal-rule-state">Output Duty / Speed Level <span class="required">*</span></label>
        <select id="modal-rule-state" class="form-control">
          ${opts}
        </select>
      </div>
      <div class="form-group" id="modal-rule-custom-pwm-group" style="display: none;">
        <label for="modal-rule-custom-act-val">Custom ${actModel.unit} (0-255)</label>
        <input type="number" min="0" max="255" id="modal-rule-custom-act-val" class="form-control" value="${actModel.defaultCustomVal || 200}">
      </div>
    `;
    const stateSelect = document.getElementById("modal-rule-state");
    stateSelect.addEventListener("change", (e) => {
      const customGroup = document.getElementById("modal-rule-custom-pwm-group");
      if (customGroup) customGroup.style.display = e.target.value === "custom" ? "block" : "none";
    });
  } else if (actModel.category === "servo") {
    container.innerHTML = `
      <div class="form-group">
        <label for="modal-rule-state">Target Angle Position <span class="required">*</span></label>
        <select id="modal-rule-state" class="form-control">
          ${opts}
        </select>
      </div>
      <div class="form-group" id="modal-rule-custom-servo-group" style="display: none;">
        <label for="modal-rule-custom-act-val">Custom Position Angle (0-180°)</label>
        <input type="number" min="0" max="180" id="modal-rule-custom-act-val" class="form-control" value="${actModel.defaultCustomVal || 90}">
      </div>
    `;
    const stateSelect = document.getElementById("modal-rule-state");
    stateSelect.addEventListener("change", (e) => {
      const customGroup = document.getElementById("modal-rule-custom-servo-group");
      if (customGroup) customGroup.style.display = e.target.value === "custom" ? "block" : "none";
    });
  } else if (actModel.category === "stepper") {
    container.innerHTML = `
      <div class="form-group">
        <label for="modal-rule-state">Stepper Motion Step Action <span class="required">*</span></label>
        <select id="modal-rule-state" class="form-control">
          ${opts}
        </select>
      </div>
      <div class="form-group" id="modal-rule-custom-stepper-group" style="display: none;">
        <label for="modal-rule-custom-act-val">Custom Steps (-10000 to +10000)</label>
        <input type="number" step="100" id="modal-rule-custom-act-val" class="form-control" value="${actModel.defaultCustomVal || 1000}">
      </div>
    `;
    const stateSelect = document.getElementById("modal-rule-state");
    stateSelect.addEventListener("change", (e) => {
      const customGroup = document.getElementById("modal-rule-custom-stepper-group");
      if (customGroup) customGroup.style.display = e.target.value === "custom" ? "block" : "none";
    });
  } else if (actModel.category === "display") {
    container.innerHTML = `
      <div class="form-group">
        <label for="modal-rule-state">Display Action <span class="required">*</span></label>
        <select id="modal-rule-state" class="form-control">
          ${opts}
        </select>
      </div>
      <div class="form-group full-width" id="modal-rule-custom-msg-group">
        <label for="modal-rule-custom-msg">Screen Text Message (Max 32 chars)</label>
        <input type="text" id="modal-rule-custom-msg" class="form-control" value="${actModel.defaultCustomMessage || 'ALERT: LIMIT BREACHED!'}" maxlength="32">
      </div>
    `;
    const stateSelect = document.getElementById("modal-rule-state");
    stateSelect.addEventListener("change", (e) => {
      const msgGroup = document.getElementById("modal-rule-custom-msg-group");
      if (msgGroup) msgGroup.style.display = e.target.value === "MSG_ALERT" ? "block" : "none";
    });
  }
}

/**
 * 3. Initialize Project & Own Cloud Server Settings
 */
function initProjectInputs() {
  const nameInput = document.getElementById("project-name");
  const locInput = document.getElementById("project-location");
  const ssidInput = document.getElementById("wifi-ssid");
  const passInput = document.getElementById("wifi-pass");
  const cloudUrlInput = document.getElementById("cloud-url");
  const statusVarInput = document.getElementById("status-variable-id");
  const firmwareInput = document.getElementById("firmware-version");
  const debugInput = document.getElementById("debug-log");
  const intervalSelect = document.getElementById("telemetry-interval");
  const heartbeatSelect = document.getElementById("heartbeat-interval");
  const pollSelect = document.getElementById("command-poll-interval");
  const maxCommandsSelect = document.getElementById("max-commands");
  const timeoutSelect = document.getElementById("http-timeout");
  const retrySelect = document.getElementById("retry-count");
  const baudSelect = document.getElementById("serial-baud");
  const failsafeSelect = document.getElementById("failsafe-policy");
  const togglePassBtn = document.getElementById("toggle-wifi-pass");

  if (nameInput) nameInput.addEventListener("input", (e) => { state.project.name = e.target.value.trim() || "Untitled IoT Node"; updateStudio(); });
  if (locInput) locInput.addEventListener("input", (e) => { state.project.location = e.target.value.trim() || "Unassigned Location"; updateStudio(); });
  if (ssidInput) ssidInput.addEventListener("input", (e) => { state.project.wifiSSID = e.target.value; updateStudio(); });
  if (passInput) passInput.addEventListener("input", (e) => { state.project.wifiPass = e.target.value; updateStudio(); });
  if (cloudUrlInput) cloudUrlInput.addEventListener("input", (e) => { state.project.cloudUrl = e.target.value.trim(); updateStudio(); });
  if (statusVarInput) statusVarInput.addEventListener("input", (e) => { state.project.statusVariableId = e.target.value.trim(); updateStudio(); });
  if (firmwareInput) firmwareInput.addEventListener("input", (e) => { state.project.firmwareVersion = e.target.value.trim(); updateStudio(); });
  if (debugInput) debugInput.addEventListener("change", (e) => { state.project.debug = e.target.checked; updateStudio(); });

  if (intervalSelect) intervalSelect.addEventListener("change", (e) => { state.project.telemetryInterval = parseInt(e.target.value, 10); updateStudio(); });
  if (heartbeatSelect) heartbeatSelect.addEventListener("change", (e) => { state.project.heartbeatInterval = parseInt(e.target.value, 10); updateStudio(); });
  if (pollSelect) pollSelect.addEventListener("change", (e) => { state.project.commandPollInterval = parseInt(e.target.value, 10); updateStudio(); });
  if (maxCommandsSelect) maxCommandsSelect.addEventListener("change", (e) => { state.project.maxCommands = parseInt(e.target.value, 10); updateStudio(); });
  if (timeoutSelect) timeoutSelect.addEventListener("change", (e) => { state.project.httpTimeout = parseInt(e.target.value, 10); updateStudio(); });
  if (retrySelect) retrySelect.addEventListener("change", (e) => { state.project.retryCount = parseInt(e.target.value, 10); updateStudio(); });
  if (baudSelect) baudSelect.addEventListener("change", (e) => { state.project.baudRate = parseInt(e.target.value, 10); updateStudio(); });
  if (failsafeSelect) failsafeSelect.addEventListener("change", (e) => { state.failsafePolicy = e.target.value; updateStudio(); });
  if (togglePassBtn) togglePassBtn.addEventListener("click", () => { passInput.type = passInput.type === "password" ? "text" : "password"; });
}

/**
 * Section 02: Device Identity & Cloud Provisioning.
 *
 * Owns the identity fields that depend on the selected controller (MAC address,
 * Device ID/UUID, secret key) plus the board-derived build settings, and the
 * generators that fill them. Kept separate from initProjectInputs so the
 * controller-driven defaults can be re-applied whenever the board changes.
 */
function initDeviceIdentity() {
  const macInput = document.getElementById("device-mac");
  const deviceIdInput = document.getElementById("device-id");
  const secretInput = document.getElementById("device-secret");
  const boardInput = document.getElementById("detected-board");
  const cpuSelect = document.getElementById("cpu-frequency");
  const flashSelect = document.getElementById("flash-size");
  const uploadSelect = document.getElementById("upload-speed");
  const roleSelect = document.getElementById("node-role");
  const macHint = document.getElementById("device-mac-hint");

  if (macInput) {
    macInput.addEventListener("input", (e) => {
      state.project.macAddress = e.target.value;
      state.project.macAuto = false; // manual entry wins over the generator
      updateStudio();
    });
    macInput.addEventListener("blur", () => {
      const normalized = normalizeMac(macInput.value);
      if (normalized) state.project.macAddress = normalized;
      updateStudio();
    });
  }

  if (deviceIdInput) {
    deviceIdInput.addEventListener("input", (e) => {
      state.project.deviceId = e.target.value.trim();
      updateStudio();
    });
  }

  if (secretInput) {
    // Server-issued credential: displayed and copyable, never editable.
    secretInput.readOnly = true;
    secretInput.setAttribute("aria-readonly", "true");
    secretInput.addEventListener("input", () => {
      secretInput.value = state.project.secretKey || "";
    });
  }

  const toggleSecretBtn = document.getElementById("toggle-device-secret");
  if (toggleSecretBtn && secretInput) {
    toggleSecretBtn.addEventListener("click", () => {
      secretInput.type = secretInput.type === "password" ? "text" : "password";
    });
  }

  const copySecretBtn = document.getElementById("btn-copy-device-secret");
  if (copySecretBtn) {
    copySecretBtn.addEventListener("click", () => {
      const value = state.project.secretKey || "";
      if (!value || /^YOUR_/i.test(value)) {
        showToast("No server-issued secret key yet — press Add Device first");
        return;
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(value).then(
          () => showToast("Secret key copied to clipboard"),
          () => showToast("Clipboard unavailable — reveal the key and copy manually")
        );
      } else {
        showToast("Clipboard unavailable — reveal the key and copy manually");
      }
    });
  }

  const addDeviceBtn = document.getElementById("btn-add-device-server");
  if (addDeviceBtn) {
    addDeviceBtn.addEventListener("click", () => { provisionDeviceOnServer(); });
  }

  if (boardInput) {
    // Read-only mirror of the selected controller; no binding needed because the
    // value is always written by syncProjectInputsToState().
    boardInput.readOnly = true;
  }

  if (cpuSelect) cpuSelect.addEventListener("change", (e) => { state.project.cpuFrequency = e.target.value; updateStudio(); });
  if (flashSelect) flashSelect.addEventListener("change", (e) => { state.project.flashSize = e.target.value; updateStudio(); });
  if (uploadSelect) uploadSelect.addEventListener("change", (e) => { state.project.uploadSpeed = e.target.value; updateStudio(); });
  if (roleSelect) roleSelect.addEventListener("change", (e) => { state.project.nodeRole = e.target.value; updateStudio(); });

  const genUuidBtn = document.getElementById("btn-generate-uuid");
  if (genUuidBtn) {
    genUuidBtn.addEventListener("click", () => {
      state.project.deviceId = generateUuidV4();
      updateStudio();
      showToast("New Device ID (UUID v4) generated");
    });
  }

  const genMacBtn = document.getElementById("btn-generate-mac");
  if (genMacBtn) {
    genMacBtn.addEventListener("click", () => {
      state.project.macAddress = generateMacAddress(state.controller);
      state.project.macAuto = true;
      updateStudio();
      showToast(`Random ${getControllerMeta().label} MAC generated`);
    });
  }

  const deriveBtn = document.getElementById("btn-derive-uuid-from-mac");
  if (deriveBtn) {
    deriveBtn.addEventListener("click", () => {
      const normalized = normalizeMac(state.project.macAddress);
      if (!normalized) {
        showToast("Enter a valid MAC address (AA:BB:CC:DD:EE:FF) first");
        return;
      }
      state.project.macAddress = normalized;
      state.project.deviceId = uuidFromMac(normalized);
      updateStudio();
      showToast("Device ID derived deterministically from MAC");
    });
  }

  const genAllBtn = document.getElementById("btn-generate-identity");
  if (genAllBtn) {
    genAllBtn.addEventListener("click", () => {
      // Only client-derivable values: the secret key is issued by the gateway.
      state.project.macAddress = state.project.macAddress && isValidMac(state.project.macAddress) && !state.project.macAuto
        ? normalizeMac(state.project.macAddress)
        : generateMacAddress(state.controller);
      state.project.macAuto = true;
      state.project.deviceId = generateUuidV4();
      updateStudio();
      showToast("MAC + Device ID generated — press Add Device for the server-issued secret key");
    });
  }

  const copyBtn = document.getElementById("btn-copy-identity");
  if (copyBtn) {
    copyBtn.addEventListener("click", () => {
      const p = state.project;
      const block = [
        `# OmniTeq Cloud device identity — ${p.name || "IoT Node"}`,
        `BOARD=${p.boardLabel || getControllerMeta().label}`,
        `MAC_ADDRESS=${p.macAddress || ""}`,
        `DEVICE_ID=${p.deviceId || ""}`,
        `SECRET_KEY=${p.secretKey || ""}`,
        `CLOUD_URL=${p.cloudUrl || ""}`,
        `FIRMWARE_VERSION=${p.firmwareVersion || ""}`
      ].join("\n");

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(block).then(
          () => showToast("Device identity block copied"),
          () => showToast("Clipboard unavailable — select the fields manually")
        );
      } else {
        showToast("Clipboard unavailable — select the fields manually");
      }
    });
  }

  if (macHint) macHint.dataset.defaultHtml = macHint.innerHTML;
}

/**
 * Re-apply the board-derived defaults for the currently selected controller.
 *
 * The detected board label always follows the controller. CPU frequency, flash
 * size and upload speed are seeded from the board but keep a user's choice unless
 * `force` is set (i.e. the controller was just switched).
 *
 * The MAC is only (re)generated when it is missing/invalid, or when it is still
 * an auto-generated placeholder that `force` is refreshing for a new
 * architecture — a manually entered hardware MAC is never overwritten.
 */
function applyControllerDefaults(opts) {
  const options = opts || {};
  const meta = getControllerMeta();
  const p = state.project;

  p.boardLabel = meta.label;
  if (options.force || !p.cpuFrequency) p.cpuFrequency = meta.cpuFrequency;
  if (options.force || !p.flashSize) p.flashSize = meta.flashSize;
  if (options.force || !p.uploadSpeed) p.uploadSpeed = meta.uploadSpeed;

  const macUsable = p.macAddress && isValidMac(p.macAddress);
  if (!macUsable || (p.macAuto && options.force)) {
    p.macAddress = generateMacAddress(state.controller);
    p.macAuto = true;
  }
}

/**
 * Readiness badge + field-level validation for the identity panel. Reports how
 * many of the gateway-required identity fields are actually filled in, so a
 * half-registered device is obvious before flashing.
 */
function updateDeviceIdentityUI() {
  const badge = document.getElementById("device-ready-badge");
  const badgeText = document.getElementById("device-ready-text");
  const macInput = document.getElementById("device-mac");
  const deviceIdInput = document.getElementById("device-id");
  const secretInput = document.getElementById("device-secret");
  const macHint = document.getElementById("device-mac-hint");

  const p = state.project;
  const macValid = isValidMac(p.macAddress);
  const uuidValid = isValidUuid(p.deviceId) && !/^YOUR_/i.test(p.deviceId);
  // The secret key only exists after the gateway issues it, so a placeholder
  // value means the device has not been registered from the studio yet.
  const secretSet = !!p.secretKey && !/^YOUR_/i.test(p.secretKey);
  const wifiSet = !!p.wifiSSID;
  const urlSet = !!p.cloudUrl;

  if (macInput) macInput.classList.toggle("is-invalid", !!macInput.value && !macValid);
  if (deviceIdInput) deviceIdInput.classList.toggle("is-invalid", !!deviceIdInput.value && !uuidValid);
  if (secretInput) {
    // Re-assert the read-only contract on every render: the key is issued by the
    // gateway and must never become editable, even if the DOM is rebuilt.
    secretInput.readOnly = true;
    secretInput.setAttribute("aria-readonly", "true");
    secretInput.classList.toggle("is-invalid", !secretSet);
    if (secretInput.value !== (p.secretKey || "")) secretInput.value = p.secretKey || "";
  }

  if (macHint) {
    const macEntered = macInput ? !!macInput.value : false;
    macHint.classList.toggle("is-invalid", macEntered && !macValid);
    macHint.innerHTML = (macEntered && !macValid)
      ? `Invalid MAC — expected 12 hex digits in the format <code>AA:BB:CC:DD:EE:FF</code>.`
      : (macHint.dataset.defaultHtml || macHint.innerHTML);
  }

  const checks = [macValid, uuidValid, secretSet, wifiSet, urlSet];
  const missing = checks.filter((ok) => !ok).length;
  const mandatoryMissing = [macValid, uuidValid, secretSet].filter((ok) => !ok).length;

  const note = document.getElementById("identity-action-note");
  if (note) {
    note.textContent = p.macAuto
      ? "MAC is an auto-generated, locally-administered placeholder — paste the board's real hardware MAC before registering the device on the gateway."
      : "Derived IDs are deterministic for a given MAC, so re-deriving never changes an already registered device.";
  }

  if (!badge || !badgeText) return;
  badge.classList.remove("is-warning", "is-incomplete");

  if (missing === 0) {
    badgeText.textContent = "Device ready for cloud registration";
  } else if (mandatoryMissing === 0) {
    badge.classList.add("is-warning");
    badgeText.textContent = `Identity complete • ${missing} optional field(s) pending`;
  } else if (!secretSet && macValid && uuidValid) {
    badge.classList.add("is-warning");
    badgeText.textContent = "Press Add Device to receive the server-issued secret key";
  } else {
    badge.classList.add("is-incomplete");
    badgeText.textContent = `${mandatoryMissing} required identity field(s) missing`;
  }
}


/**
 * Prefill the project form from the URL (?project= & ?device= & ?device_id= & ?secret_key=)
 * and from the last local edit, then optionally hydrate real sensor/variable UUIDs
 * from the OmniTeq Cloud gateway. A studio session is only useful when it can bind
 * to actual provisioned cloud resources, so this runs before the first render.
 */
/**
 * Device identity handed over via the query string by the calling page
 * (cloud_project_view.html, cloud_device_add.html). Single source of truth for
 * the mapping, shared by the "Previous Session" and "New Setup" paths.
 */
function collectUrlContext(search) {
  const params = new URLSearchParams(search === undefined ? window.location.search : search);
  const overrides = {};
  const map = {
    "name": "project",
    "projectId": "project_id",
    "deviceId": "device_id",
    "secretKey": "secret_key",
    "location": "location",
    "wifiSSID": "wifi_ssid",
    "cloudUrl": "cloud_url",
    "macAddress": "mac",
    "firmwareVersion": "firmware_version"
  };
  Object.keys(map).forEach((key) => {
    const value = params.get(map[key]);
    if (value) overrides[key] = value;
  });
  if (!overrides.projectId) {
    // cloud_device_add.html accepts both spellings; stay compatible with either.
    const alt = params.get("projectId");
    if (alt) overrides.projectId = alt;
  }
  if (overrides.macAddress) {
    overrides.macAddress = normalizeMac(overrides.macAddress) || overrides.macAddress;
    state.project.macAuto = false;
  }
  ["node_name", "device_name"].forEach((p) => {
    const value = params.get(p);
    if (value) overrides.name = value;
  });
  return overrides;
}

/**
 * Fetch a project's authoritative identity from the gateway using the stored
 * JWT. Kept as a plain fetch (not js/api.js) so a 401 here cannot trigger the API
 * client's refresh-and-redirect flow from inside the studio. Resolves to null
 * when config, token, connectivity or the response shape is unavailable.
 */
async function fetchProjectFromGateway(projectId) {
  if (!projectId) return null;
  const cfg = window.OMNITEQ_CONFIG;
  if (!cfg || typeof cfg.resolve !== "function") return null;
  let token = null;
  try { token = localStorage.getItem("access_token"); } catch (e) { /* private mode */ }
  if (!token) return null;
  try {
    const res = await fetch(`${cfg.resolve().apiBaseUrl}/projects/${encodeURIComponent(projectId)}`,
      { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return null;
    const body = await res.json().catch(() => null);
    return body && body.success && body.data ? body.data : null;
  } catch (e) {
    console.warn("[Studio] Project lookup skipped:", e && e.message);
    return null;
  }
}

async function fetchProjectDevicesFromGateway(projectId) {
  if (!projectId) return [];
  const cfg = window.OMNITEQ_CONFIG;
  if (!cfg || typeof cfg.resolve !== "function") return [];
  let token = null;
  try { token = localStorage.getItem("access_token"); } catch (e) { /* private mode */ }
  if (!token) return [];
  try {
    const res = await fetch(`${cfg.resolve().apiBaseUrl}/projects/${encodeURIComponent(projectId)}/devices`,
      { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return [];
    const body = await res.json().catch(() => null);
    return body && body.success && Array.isArray(body.data) ? body.data : [];
  } catch (e) {
    return [];
  }
}

async function prefillProjectFromContext() {
  const params = new URLSearchParams(window.location.search);

  // Values supplied by the calling page must win over a locally restored
  // session, so they are collected first and re-applied after the merge.
  const urlOverrides = collectUrlContext(params);
  const wantedProjectId = urlOverrides.projectId || "";
  const wantedDeviceId = urlOverrides.deviceId || "";

  Object.assign(state.project, urlOverrides);

  // Restore the last studio session for this browser. A session that belongs to
  // a *different* project is never merged: the calling page asked for this
  // project, and reusing another project's node identity (plus its sensors and
  // rules) was the source of the "opens the wrong / blank project" defect.
  // Peripheral assignments are only reused when the same device is being edited.
  try {
    const saved = localStorage.getItem("omniteq_studio_state");
    if (saved && !params.get("fresh")) {
      const parsed = JSON.parse(saved);
      const savedProjectId = parsed && parsed.project ? (parsed.project.projectId || "") : "";
      const projectMismatch = !!(wantedProjectId && savedProjectId && wantedProjectId !== savedProjectId);

      if (projectMismatch) {
        console.info("[Studio] Requested project differs from the cached session; starting from the requested project.");
        clearSavedSession();
      } else {
        if (parsed && parsed.project) state.project = { ...state.project, ...parsed.project };

        const savedDeviceId = parsed && parsed.project ? parsed.project.deviceId : null;
        const sameDevice = !wantedDeviceId || !savedDeviceId || wantedDeviceId === savedDeviceId;

        if (sameDevice) {
          if (Array.isArray(parsed.sensors)) state.sensors = parsed.sensors;
          if (Array.isArray(parsed.actuators)) state.actuators = parsed.actuators;
          if (Array.isArray(parsed.commands)) state.commands = parsed.commands;
          if (Array.isArray(parsed.cloudRules)) state.cloudRules = parsed.cloudRules;
          if (Array.isArray(parsed.rules)) state.rules = parsed.rules;
          if (parsed.controller) state.controller = parsed.controller;
          if (parsed.failsafePolicy) state.failsafePolicy = parsed.failsafePolicy;
        } else {
          console.info("[Studio] Loaded a different device from the URL; peripheral assignments were not reused.");
        }
      }
    }
  } catch (e) {
    console.warn("[Studio] Could not restore saved session:", e && e.message);
  }

  // Device identity from the URL always wins, whatever the saved session held.
  Object.assign(state.project, urlOverrides);

  // Load the authoritative project identity from the gateway when the calling
  // page passed a project id. Without this the studio only had whatever the
  // query string happened to carry, so a project-level deep link could render
  // blank or stale details.
  if (wantedProjectId) {
    const project = await fetchProjectFromGateway(wantedProjectId);
    if (project) {
      if (!state.project.name) state.project.name = project.name || "";
      if (!state.project.location) state.project.location = project.location || "";
      state.project.projectName = project.name || state.project.projectName || "";

      // When the calling page did not name a device, adopt the project's sole
      // device so the generated firmware targets a real node immediately.
      if (!state.project.deviceId) {
        const devices = await fetchProjectDevicesFromGateway(wantedProjectId);
        if (devices.length === 1) {
          state.project.deviceId = devices[0].id || "";
          if (!state.project.name) state.project.name = devices[0].name || "";
        } else if (devices.length > 1) {
          console.info(`[Studio] Project has ${devices.length} devices; open a device to bind node identity.`);
        }
      }
    }
  }

  // Board-derived identity: fills the detected board, build settings and (when
  // still empty or auto-generated) the MAC for the current controller.
  applyControllerDefaults();

  syncProjectInputsToState();
  await hydrateCloudVariableIds();
}

/**
 * Push state.project back into the Section 01 form controls. Used after loading a
 * URL context, a saved session, an imported JSON file, or the demo blueprint.
 */
/**
 * Snapshot of the pristine project state, captured before any init code can
 * mutate it. "New Setup" rebuilds from this, so a clean start still carries the
 * defaults (gateway URL, intervals, auto status variable) rather than blanks.
 */
let studioDefaults = null;

function captureStudioDefaults() {
  if (!studioDefaults) studioDefaults = JSON.parse(JSON.stringify(state.project));
}

function readSavedSession() {
  try {
    const raw = localStorage.getItem("omniteq_studio_state");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch (e) {
    // Corrupt cache: drop it rather than trapping the user in a broken prompt.
    clearSavedSession();
    return null;
  }
}

function clearSavedSession() {
  try { localStorage.removeItem("omniteq_studio_state"); } catch (e) { /* private mode */ }
}

/**
 * Is there anything in the saved session worth asking about?
 *
 * A session holding configured peripherals always counts. A session that only
 * holds identity counts when it points at a different device than the one the
 * calling page asked for, because that is exactly the stale-cache case: the
 * studio would otherwise show another node's project details.
 */
function hasRestorableSession(saved, urlOverrides) {
  if (!saved) return false;

  const savedProjectId = (saved.project && saved.project.projectId) || "";
  const wantedProjectId = (urlOverrides && urlOverrides.projectId) || "";

  // A different project was requested: the cached session is unrelated, so it
  // must not be offered (that prompt led into another project's data). The
  // requested project is loaded directly instead.
  if (savedProjectId && wantedProjectId && savedProjectId !== wantedProjectId) return false;

  const hasPeripherals = ["sensors", "actuators", "commands", "cloudRules", "rules"]
    .some((key) => Array.isArray(saved[key]) && saved[key].length > 0);
  if (hasPeripherals) return true;

  const savedDevice = (saved.project && saved.project.deviceId) || "";
  const wantedDevice = (urlOverrides && urlOverrides.deviceId) || "";

  // Same project, different node: the cached setup belongs to another device.
  if (savedDevice && !/^YOUR_/i.test(savedDevice) && wantedDevice && wantedDevice !== savedDevice) return true;

  return false;
}

/** Readable summary of what the saved session actually contains. */
function savedSessionSummaryHtml(saved) {
  const p = (saved && saved.project) || {};
  const rows = [];
  rows.push(["Device setup", escapeHtmlText(p.name || "Unnamed node")]);
  if (p.deviceId && !/^YOUR_/i.test(p.deviceId)) {
    rows.push(["Device ID", `<code>${escapeHtmlText(p.deviceId)}</code>`]);
  }
  if (p.location) rows.push(["Location", escapeHtmlText(p.location)]);
  rows.push(["Controller", escapeHtmlText(getControllerMeta(saved.controller).label)]);
  rows.push(["Sensors", String((saved.sensors || []).length)]);
  rows.push(["Actuators", String((saved.actuators || []).length)]);
  rows.push(["Command templates", String((saved.commands || []).length)]);
  rows.push(["Cloud rules", String((saved.cloudRules || []).length)]);
  if (saved.savedAt) {
    const when = new Date(saved.savedAt);
    rows.push(["Saved", escapeHtmlText(isNaN(when.getTime()) ? String(saved.savedAt) : when.toLocaleString())]);
  }
  return rows.map(([label, value]) =>
    `<div class="session-summary-row"><span>${label}</span><strong>${value}</strong></div>`
  ).join("");
}

/**
 * Show the resume/clean dialog and resolve with the user's choice.
 *
 * The dialog cannot be dismissed by clicking the backdrop: that path resolves as
 * "previous" (see the guard in initModalCatalogs), so the studio always ends up in
 * a defined state and no saved work is discarded by an accidental click.
 */
function promptSessionChoice(saved) {
  return new Promise((resolve) => {
    const modal = document.getElementById("modal-session-choice");
    if (!modal) {
      // No dialog available: resuming is the non-destructive fallback.
      resolve("previous");
      return;
    }

    const summary = document.getElementById("session-summary");
    if (summary) summary.innerHTML = savedSessionSummaryHtml(saved);

    let settled = false;
    const finish = (choice) => {
      if (settled) return;
      settled = true;
      delete modal.dataset.awaitingChoice;
      // Close via the shared modal API (which releases the body scroll lock);
      // removing the class by hand would leave the page unscrollable.
      closeModal("modal-session-choice");
      if (window.StudioUI && window.StudioUI.syncModalLock) window.StudioUI.syncModalLock();
      const prevBtn = document.getElementById("btn-session-previous");
      const newBtn = document.getElementById("btn-session-new");
      if (prevBtn) prevBtn.onclick = null;
      if (newBtn) newBtn.onclick = null;
      resolve(choice);
    };

    const prevBtn = document.getElementById("btn-session-previous");
    const newBtn = document.getElementById("btn-session-new");
    if (prevBtn) prevBtn.onclick = () => finish("previous");
    if (newBtn) newBtn.onclick = () => finish("new");

    modal.dataset.awaitingChoice = "1";
    openModal("modal-session-choice");
  });
}

/**
 * "New Setup": discard the cached workspace and rebuild from the pristine
 * defaults plus whatever device identity the calling page supplied.
 */
function startNewSetup(urlOverrides) {
  const fresh = studioDefaults ? JSON.parse(JSON.stringify(studioDefaults)) : {};
  state.project = Object.assign(fresh, urlOverrides || {});
  state.sensors = [];
  state.actuators = [];
  state.commands = [];
  state.cloudRules = [];
  state.rules = [];
  state.controller = "esp32_devkit";
  state.failsafePolicy = "keep_local_loop";

  // The defaults snapshot predates UUID generation, so mint a fresh one here or
  // the generated sketch would carry the YOUR_STATUS_VARIABLE_UUID placeholder.
  if (state.project.statusVariableAuto !== false) {
    state.project.statusVariableId = generateUuidV4();
    state.project.statusVariableServerIssued = false;
  }

  // Drop the cached workspace before it can be re-persisted by the next render.
  clearSavedSession();
  applyControllerDefaults({ force: true });
  syncProjectInputsToState();
  showToast("New setup started — the previous session was cleared");
}

/**
 * Entry point for the studio. When this browser already holds a saved setup, ask
 * whether to resume it or start clean; otherwise fall straight through to the
 * normal URL/session prefill.
 */
async function bootstrapStudio() {
  const params = new URLSearchParams(window.location.search);
  const urlOverrides = collectUrlContext(params);
  const saved = readSavedSession();

  // `?fresh=1` remains available as an explicit bypass for deep links.
  if (saved && !params.get("fresh") && hasRestorableSession(saved, urlOverrides)) {
    const choice = await promptSessionChoice(saved);
    if (choice === "new") {
      startNewSetup(urlOverrides);
      await hydrateCloudVariableIds();
      return;
    }
  }

  await prefillProjectFromContext();
}

function syncProjectInputsToState() {
  const p = state.project;
  const set = (id, value) => {
    const el = document.getElementById(id);
    if (el && value !== undefined && value !== null) el.value = value;
  };
  set("project-name", p.name || "");
  set("project-location", p.location || "");
  set("wifi-ssid", p.wifiSSID || "");
  set("wifi-pass", p.wifiPass || "");
  set("cloud-url", p.cloudUrl || "");
  set("device-id", p.deviceId || "");
  set("device-secret", p.secretKey || "");
  set("status-variable-id", p.statusVariableId || "YOUR_STATUS_VARIABLE_UUID");
  set("firmware-version", p.firmwareVersion || "1.0.4");
  set("telemetry-interval", p.telemetryInterval || 10000);
  set("heartbeat-interval", p.heartbeatInterval || 30000);
  set("command-poll-interval", p.commandPollInterval || 10000);
  set("max-commands", p.maxCommands || 5);
  set("http-timeout", p.httpTimeout || 10000);
  set("retry-count", p.retryCount === 0 ? "0" : (p.retryCount || 2));
  set("serial-baud", p.baudRate || 115200);
  set("failsafe-policy", state.failsafePolicy || "keep_local_loop");
  const debugEl = document.getElementById("debug-log");
  if (debugEl) debugEl.checked = p.debug !== false;

  // Section 02: device identity panel
  set("device-mac", p.macAddress || "");
  set("detected-board", p.boardLabel || getControllerMeta().label);
  set("cpu-frequency", p.cpuFrequency || getControllerMeta().cpuFrequency);
  set("flash-size", p.flashSize || getControllerMeta().flashSize);
  set("upload-speed", p.uploadSpeed || getControllerMeta().uploadSpeed);
  set("node-role", p.nodeRole || "field_node");

  const radio = document.querySelector(`.controller-card input[value="${state.controller}"]`);
  if (radio) {
    document.querySelectorAll(".controller-card").forEach((c) => c.classList.remove("active"));
    const card = radio.closest(".controller-card");
    if (card) card.classList.add("active");
    radio.checked = true;
  }

  updateDeviceIdentityUI();
  updateStudioProjectChip();
}

/**
 * PHASE 4 — show the active project/device context in the studio header so the
 * user can tell at a glance which project they are generating firmware for.
 */
function updateStudioProjectChip() {
  const chip = document.getElementById("studio-project-chip");
  if (!chip) return;
  const p = state.project || {};
  const projectLabel = p.projectName || "";
  const deviceLabel = (p.name && p.name !== p.projectName) ? p.name : "";
  const primary = projectLabel || deviceLabel || p.name || "";
  if (!primary) { chip.style.display = "none"; return; }
  const nameEl = chip.querySelector(".spc-name");
  const metaEl = chip.querySelector(".spc-meta");
  if (nameEl) nameEl.textContent = primary;
  if (metaEl) {
    if (projectLabel && deviceLabel) metaEl.textContent = `· ${deviceLabel}`;
    else if (p.deviceId && !/^YOUR_/i.test(p.deviceId)) metaEl.textContent = `· device ${String(p.deviceId).slice(0, 8)}…`;
    else metaEl.textContent = "";
  }
  chip.style.display = "inline-flex";
}

/**
 * Best-effort hydration of real cloud variable UUIDs from the gateway.
 *
 * Uses a plain fetch with the stored JWT rather than js/api.js, so a 401 here
 * cannot trigger the API client's refresh-and-redirect flow from inside the
 * studio. When config, token, or connectivity is unavailable the studio simply
 * keeps the placeholder UUIDs — which is still valid output, because the shipped
 * device demo sketches ship the same YOUR_*_UUID placeholders.
 */
async function hydrateCloudVariableIds() {
  const cfg = window.OMNITEQ_CONFIG;
  if (!cfg || typeof cfg.resolve !== "function") return;

  let token = null;
  try { token = localStorage.getItem("access_token"); } catch (e) { /* private mode */ }
  if (!token) return;

  const deviceId = (state.project.deviceId || "").trim();
  if (!deviceId || /^YOUR_/i.test(deviceId)) return;

  const baseUrl = cfg.resolve().apiBaseUrl;
  const headers = { Authorization: `Bearer ${token}` };

  try {
    const sensorsRes = await fetch(`${baseUrl}/devices/${encodeURIComponent(deviceId)}/sensors`, { headers });
    if (!sensorsRes.ok) return;
    const sensorsBody = await sensorsRes.json().catch(() => null);
    if (!sensorsBody || !sensorsBody.success || !Array.isArray(sensorsBody.data) || sensorsBody.data.length === 0) return;

    const variablesRes = await fetch(`${baseUrl}/sensors/${encodeURIComponent(sensorsBody.data[0].id)}/variables`, { headers });
    if (!variablesRes.ok) return;
    const variablesBody = await variablesRes.json().catch(() => null);
    if (!variablesBody || !variablesBody.success || !Array.isArray(variablesBody.data)) return;

    state.cloudVariables = variablesBody.data.map((v) => ({ id: v.id, label: v.label, dataType: v.data_type }));
    console.log(`[Studio] Hydrated ${state.cloudVariables.length} cloud variable UUID(s) from the gateway.`);
  } catch (e) {
    console.warn("[Studio] Cloud variable hydration skipped:", e && e.message);
  }
}

/**
 * 4. Hardware Controller Selection
 */
function initControllerSelector() {
  const cards = document.querySelectorAll(".controller-card");
  cards.forEach((card) => {
    card.addEventListener("click", () => {
      const previousController = state.controller;
      cards.forEach((c) => c.classList.remove("active"));
      card.classList.add("active");
      const radio = card.querySelector('input[type="radio"]');
      if (radio) {
        radio.checked = true;
        state.controller = radio.value;

        // Board-dependent identity: refresh the detected board, build settings,
        // and (while still auto-generated) the MAC for the new architecture.
        applyControllerDefaults({ force: true });
        syncProjectInputsToState();

        // Pin availability changed, so peripherals may no longer be routable.
        checkPinCollisions();
        if (previousController !== state.controller) {
          showToast(`Controller set to ${getControllerMeta().label}`);
        }

        renderSensorsList();
        renderActuatorsList();
        updateStudio();
      }
    });
  });
}

/**
 * 5. Sensor Management & Quick Badges
 */
function initSensorHandlers() {
  const addRowBtn = document.getElementById("btn-add-sensor-row");
  if (addRowBtn) addRowBtn.addEventListener("click", () => addBlankSensorRow());

  const pushBtn = document.getElementById("btn-push-sensors");
  if (pushBtn) pushBtn.addEventListener("click", () => { pushSensorsToCloud(); });

  const quickBadges = document.querySelectorAll(".badge-add-btn[data-preset]");
  quickBadges.forEach((btn) => {
    btn.addEventListener("click", () => {
      const presetKey = btn.getAttribute("data-preset");
      addSensorFromPreset(presetKey);
    });
  });
}

function addSensorFromPreset(presetKey) {
  const preset = SENSOR_CATALOG.find(s => s.id === presetKey || s.type === presetKey) || SENSOR_CATALOG[0];
  const id = "sens_" + Date.now().toString(36);
  const busConfig = CONTROLLER_BUSES[state.controller] || CONTROLLER_BUSES.esp32_devkit;
  const usedPins = getAllAssignedPins();
  const filteredPins = getFilteredPinOptions(preset, state.controller, false);
  let selectedPin = preset.defaultPin;

  if (preset.bus === "i2c") {
    selectedPin = busConfig.i2c.sda;
  } else if (preset.bus === "spi") {
    const usedCs = state.sensors.filter(s => s.bus === "spi").map(s => s.pin);
    const freeCs = busConfig.spi.csPins.find(p => !usedCs.includes(p) && !usedPins.includes(p)) || busConfig.spi.csPins.find(p => !usedCs.includes(p)) || busConfig.spi.csPins[0];
    selectedPin = freeCs;
  } else if (preset.bus === "uart") {
    selectedPin = busConfig.uart.rx;
  } else if (preset.type === "ultrasonic") {
    selectedPin = busConfig.ultrasonic.trig;
  } else if (filteredPins.length === 1 && filteredPins[0].isFixed) {
    selectedPin = filteredPins[0].pin;
  } else if (usedPins.includes(selectedPin) || !filteredPins.some(p => p.pin === selectedPin)) {
    const nextFree = filteredPins.find((p) => !usedPins.includes(p.pin)) || filteredPins[0];
    if (nextFree) selectedPin = nextFree.pin;
  }

  const newSensor = {
    id,
    catalogId: preset.id,
    type: preset.type,
    name: `${preset.name} ${state.sensors.length + 1}`,
    pin: selectedPin,
    bus: preset.bus || null,
    signalType: preset.signalType || (preset.isAnalog ? "adc" : "digital_input"),
    dataType: inferCloudDataType(preset),
    keyTouched: false,
    sensorId: "",
    variableIds: {},
    random: defaultRandomConfig(inferCloudDataType(preset)),
    unit: preset.unit || "val",
    readInterval: preset.interval || 2000
  };

  if (preset.type === "ultrasonic") {
    newSensor.trigPin = busConfig.ultrasonic.trig;
    newSensor.echoPin = busConfig.ultrasonic.echo;
  }
  if (preset.bus === "spi") {
    newSensor.csPin = selectedPin;
  }

  if (preset.type === "dht22" || preset.type === "dht11") {
    newSensor.varTemp = `temp_${state.sensors.length + 1}`;
    newSensor.varHum = `hum_${state.sensors.length + 1}`;
    newSensor.dataTypeTemp = "float";
    newSensor.dataTypeHum = "float";
    newSensor.uuidTemp = "YOUR_TEMPERATURE_VARIABLE_UUID";
    newSensor.uuidHum = "YOUR_HUMIDITY_VARIABLE_UUID";
    newSensor.unitTemp = "°C";
    newSensor.unitHum = "%";
  } else if (preset.type === "bmp280") {
    newSensor.varTemp = `baroTemp_${state.sensors.length + 1}`;
    newSensor.varPress = `baroPress_${state.sensors.length + 1}`;
    newSensor.dataTypeTemp = "float";
    newSensor.dataTypePress = "float";
    newSensor.uuidTemp = "YOUR_TEMPERATURE_VARIABLE_UUID";
    newSensor.uuidPress = "YOUR_PRESSURE_VARIABLE_UUID";
    newSensor.unitTemp = "°C";
    newSensor.unitPress = "hPa";
  } else {
    newSensor.varVal = `${preset.defaultVar || "val"}_${state.sensors.length + 1}`;
  }

  state.sensors.push(newSensor);
  renderSensorsList();
  renderRulesList();
  updateStudio();
  showToast(`Added ${newSensor.name}`);
}

﻿/**
 * Telemetry-key helpers
 * ---------------------------------------------------------------------------
 * The Telemetry Key is the cloud variable `label`. It is auto-derived from the
 * Display Name so beginners never have to invent one, but it stays editable and
 * must be unique per device because the gateway resolves readings by variable id.
 */
function slugifyTelemetryKey(value) {
  let out = String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/_{2,}/g, "_")
    .replace(/^_+|_+$/g, "");
  if (!out) out = "reading";
  if (/^[0-9]/.test(out)) out = "v_" + out;
  return out.slice(0, 48);
}

/**
 * Collect every telemetry key currently used by a device, so a newly derived key
 * never collides with an existing cloud variable label.
 */
function collectTelemetryKeys(excludeSensorId) {
  const keys = [];
  state.sensors.forEach((s) => {
    if (s.id === excludeSensorId) return;
    getSensorTelemetryKeys(s).forEach((k) => { if (k) keys.push(k); });
  });
  if (state.project.statusVariableKey) keys.push(state.project.statusVariableKey);
  return keys;
}

function uniqueTelemetryKey(base, excludeSensorId) {
  const used = collectTelemetryKeys(excludeSensorId);
  let candidate = base;
  let counter = 2;
  while (used.includes(candidate)) {
    candidate = `${base}_${counter}`;
    counter++;
  }
  return candidate;
}

/** Editable telemetry keys of a sensor, one per cloud variable slot. */
function getSensorTelemetryKeys(sensor) {
  if (!sensor) return [];
  if (sensor.type === "dht22" || sensor.type === "dht11" || sensor.type === "bmp280") {
    return [sensor.varTemp || "temperature", sensor.varHum || sensor.varPress || "secondary"];
  }
  return [sensor.varVal || sensor.varTemp || "value"];
}

/**
 * Server-issued variable ids of a sensor, one per cloud variable slot.
 * Falls back to the legacy `uuid*` fields so blueprints saved by earlier studio
 * builds keep working, and to an empty array when nothing has been pushed yet.
 */
function getSensorVariableIds(sensor) {
  if (!sensor) return [];
  const ids = sensor.variableIds || {};
  const legacyPrimary = sensor.uuidTemp || sensor.varUuid || "";
  const legacySecondary = sensor.uuidHum || sensor.uuidPress || "";

  if (sensor.type === "dht22" || sensor.type === "dht11" || sensor.type === "bmp280") {
    return [
      { role: "primary", label: "variable_id", value: ids.primary || legacyPrimary },
      { role: "secondary", label: "variable_id (2)", value: ids.secondary || legacySecondary }
    ];
  }
  return [{ role: "primary", label: "variable_id", value: ids.primary || legacyPrimary }];
}

/** True when every cloud variable of the sensor has a server-issued id. */
function sensorIsProvisioned(sensor) {
  const ids = getSensorVariableIds(sensor);
  return ids.length > 0 && ids.every((entry) => !!entry.value && !/^YOUR_/i.test(entry.value));
}

/**
 * Random Value Generator defaults.
 * ---------------------------------------------------------------------------
 * Lets a beginner flash the generated sketch with no hardware attached: the node
 * pushes plausible synthetic readings so dashboards, rules and commands can be
 * exercised end to end before sensors are wired.
 */
const RANDOM_MODE_LABELS = {
  uniform: "Uniform random (min → max)",
  walk: "Random walk (drift from last value)",
  sine: "Sine wave (smooth oscillation)",
  ramp: "Ramp / counter (step each cycle)",
  boolean: "Coin flip (true / false)",
  string: "Random entry from a list"
};

function defaultRandomConfig(dataType) {
  const isBool = dataType === "boolean";
  const isString = dataType === "string";
  const isInt = dataType === "integer";
  return {
    enabled: false,
    mode: isBool ? "boolean" : isString ? "string" : "uniform",
    min: isInt ? 0 : 0,
    max: isInt ? 100 : 100,
    precision: isInt ? 0 : 2,
    step: isInt ? 1 : 0.5,
    periodSec: 60,
    seed: "",
    pushOnBoot: true,
    values: "ONLINE,IDLE,ALERT",
    intervalMs: 2000
  };
}

function normalizeRandomConfig(sensor) {
  const base = defaultRandomConfig(sensor.dataType || "float");
  if (!sensor.random) return base;
  return {
    enabled: !!sensor.random.enabled,
    mode: RANDOM_MODE_LABELS[sensor.random.mode] ? sensor.random.mode : base.mode,
    min: Number.isFinite(parseFloat(sensor.random.min)) ? parseFloat(sensor.random.min) : base.min,
    max: Number.isFinite(parseFloat(sensor.random.max)) ? parseFloat(sensor.random.max) : base.max,
    precision: Number.isFinite(parseInt(sensor.random.precision, 10)) ? Math.max(0, Math.min(6, parseInt(sensor.random.precision, 10))) : base.precision,
    step: Number.isFinite(parseFloat(sensor.random.step)) ? parseFloat(sensor.random.step) : base.step,
    periodSec: Number.isFinite(parseFloat(sensor.random.periodSec)) && parseFloat(sensor.random.periodSec) > 0 ? parseFloat(sensor.random.periodSec) : base.periodSec,
    seed: sensor.random.seed === undefined || sensor.random.seed === null ? "" : String(sensor.random.seed),
    pushOnBoot: sensor.random.pushOnBoot !== false,
    values: sensor.random.values || base.values,
    intervalMs: Number.isFinite(parseInt(sensor.random.intervalMs, 10)) ? parseInt(sensor.random.intervalMs, 10) : sensor.readInterval || base.intervalMs
  };
}

function patchRandomConfig(sensor, patch) {
  sensor.random = Object.assign(normalizeRandomConfig(sensor), patch || {});
}

/**
 * Human-readable summary of a sensor's random source, shown on the card so the
 * generated behaviour is obvious without opening the panel.
 */
function describeRandomConfig(sensor) {
  const rc = normalizeRandomConfig(sensor);
  if (!rc.enabled) return "";
  if (rc.mode === "boolean") return `Random boolean every ${Math.round(rc.intervalMs / 1000)}s`;
  if (rc.mode === "string") return `Random entry from ${rc.values.split(",").length} value(s)`;
  if (rc.mode === "walk") return `Random walk ${rc.min}…${rc.max} (±${rc.step}/cycle)`;
  if (rc.mode === "sine") return `Sine ${rc.min}…${rc.max} over ${rc.periodSec}s`;
  if (rc.mode === "ramp") return `Ramp ${rc.min}→${rc.max} step ${rc.step}`;
  return `Uniform ${rc.min}…${rc.max} (${rc.precision} dp)`;
}

/**
 * Build one telemetry-key + variable-id row for a sensor slot.
 * The variable_id is intentionally read-only: the gateway mints it.
 */
function sensorSlotRowHtml(sensor, slot, index) {
  const ids = getSensorVariableIds(sensor);
  const entry = ids[index] || { role: "primary", value: "" };
  const isProvisioned = !!entry.value && !/^YOUR_/i.test(entry.value);
  const key = slot.key;
  const keyAction = slot.keyAction;

  return `
    <div class="slot-row">
      <div class="field-row">
        <span class="field-label" title="Cloud variable label (the telemetry key sent in the payload)">KEY</span>
        <input type="text" class="item-var-input" value="${escapeHtmlText(key)}" data-action="${keyAction}" data-id="${sensor.id}" title="${escapeHtmlText(slot.role)} telemetry key (${escapeHtmlText(slot.dataType)})">
      </div>
      <div class="field-row">
        <span class="field-label" title="Server-issued cloud variable UUID — read only">ID</span>
        <input type="text" class="item-uuid-input" readonly value="${escapeHtmlText(entry.value || "")}" placeholder="server-issued on push" data-action="noop" data-id="${sensor.id}" title="variable_id issued by POST /sensors/:sensorId/variables">
        <button type="button" class="btn-copy-mini ${isProvisioned ? "" : "is-empty"}" data-action="copy-variable-id" data-id="${sensor.id}" data-slot="${index}" title="${isProvisioned ? "Copy variable_id" : "Not issued yet — push this sensor to the cloud"}">📋</button>
      </div>
    </div>
  `;
}

/**
 * The Random Value Generator panel attached to every sensor card.
 * Sub-options adapt to the sensor's cloud data type, because a boolean variable
 * cannot be driven by a min/max pair and a string variable needs a value list.
 */
function sensorRandomPanelHtml(sensor) {
  const rc = normalizeRandomConfig(sensor);
  const dataType = sensor.dataType || "float";
  const isNumeric = dataType === "float" || dataType === "integer";
  const isString = dataType === "string";
  const isBoolean = dataType === "boolean";

  const modeOptions = Object.keys(RANDOM_MODE_LABELS)
    .filter((mode) => {
      if (mode === "boolean") return isBoolean || isNumeric;
      if (mode === "string") return isString;
      return isNumeric;
    })
    .map((mode) => `<option value="${mode}" ${rc.mode === mode ? "selected" : ""}>${RANDOM_MODE_LABELS[mode]}</option>`)
    .join("");

  return `
    <div class="random-panel" data-role="random-panel" data-id="${sensor.id}" ${rc.enabled ? "" : "hidden"}>
      <div class="random-panel-title">
        <span>Random Value Generator</span>
        <span class="random-panel-type">${escapeHtmlText(dataType)} output</span>
      </div>

      <div class="random-grid">
        <label class="random-field">
          <span>Distribution</span>
          <select data-action="random-mode" data-id="${sensor.id}">${modeOptions}</select>
        </label>

        ${isNumeric ? `
        <label class="random-field">
          <span>Min</span>
          <input type="number" step="any" value="${rc.min}" data-action="random-min" data-id="${sensor.id}">
        </label>
        <label class="random-field">
          <span>Max</span>
          <input type="number" step="any" value="${rc.max}" data-action="random-max" data-id="${sensor.id}">
        </label>
        <label class="random-field">
          <span>Decimals</span>
          <input type="number" min="0" max="6" value="${rc.precision}" data-action="random-precision" data-id="${sensor.id}">
        </label>
        ` : ""}

        ${rc.mode === "walk" || rc.mode === "ramp" ? `
        <label class="random-field">
          <span>Step / cycle</span>
          <input type="number" step="any" value="${rc.step}" data-action="random-step" data-id="${sensor.id}">
        </label>
        ` : ""}

        ${rc.mode === "sine" ? `
        <label class="random-field">
          <span>Period (s)</span>
          <input type="number" step="any" min="1" value="${rc.periodSec}" data-action="random-period" data-id="${sensor.id}">
        </label>
        ` : ""}

        ${isString ? `
        <label class="random-field random-field-wide">
          <span>Values (comma separated)</span>
          <input type="text" value="${escapeHtmlText(rc.values)}" data-action="random-values" data-id="${sensor.id}" placeholder="ONLINE,IDLE,ALERT">
        </label>
        ` : ""}

        <label class="random-field">
          <span>Interval (ms)</span>
          <input type="number" min="200" step="100" value="${rc.intervalMs}" data-action="random-interval" data-id="${sensor.id}">
        </label>

        <label class="random-field">
          <span>Seed (optional)</span>
          <input type="text" value="${escapeHtmlText(rc.seed)}" data-action="random-seed" data-id="${sensor.id}" placeholder="auto">
        </label>
      </div>

      <div class="random-flags">
        <label class="inline-toggle">
          <input type="checkbox" data-action="random-push-on-boot" data-id="${sensor.id}" ${rc.pushOnBoot ? "checked" : ""}>
          <span>Push a value immediately after boot</span>
        </label>
        <span class="random-summary">${escapeHtmlText(describeRandomConfig(sensor))}</span>
      </div>
    </div>
  `;
}

function pinControlHtmlForSensor(sensor, catalogItem) {
  const busConfig = CONTROLLER_BUSES[state.controller] || CONTROLLER_BUSES.esp32_devkit;

  if (catalogItem.bus === "i2c" || sensor.signalType === "i2c") {
    return `
      <div class="fixed-bus-badge badge-i2c" title="Hardware I2C Bus: SDA ${busConfig.i2c.sda}, SCL ${busConfig.i2c.scl}">
        <span>⚡</span> I2C (SDA:${busConfig.i2c.sda}, SCL:${busConfig.i2c.scl})
      </div>
    `;
  }
  if (catalogItem.bus === "uart" || sensor.signalType === "uart") {
    return `
      <div class="fixed-bus-badge badge-uart" title="Hardware UART: RX ${busConfig.uart.rx}, TX ${busConfig.uart.tx}">
        <span>⚡</span> UART (RX:${busConfig.uart.rx}, TX:${busConfig.uart.tx})
      </div>
    `;
  }
  if (catalogItem.type === "ultrasonic") {
    return `
      <div class="fixed-bus-badge badge-ultrasonic" title="HC-SR04 Trig/Echo">
        <span>⚡</span> Trig:${busConfig.ultrasonic.trig} Echo:${busConfig.ultrasonic.echo}
      </div>
    `;
  }

  const filteredPins = getFilteredPinOptions(catalogItem, state.controller, false);
  const options = filteredPins.map((p) => {
    const selected = p.pin === sensor.pin ? "selected" : "";
    return `<option value="${p.pin}" ${selected}>${p.label}</option>`;
  }).join("");
  const label = catalogItem.bus === "spi" ? "CS:" : (catalogItem.isAnalog ? "ADC:" : "GPIO:");

  return `
    <div class="pin-select-group">
      <span class="pin-select-label">${label}</span>
      <select class="pin-select" data-action="update-sensor-pin" data-id="${sensor.id}">
        ${options}
      </select>
    </div>
  `;
}

function renderSensorsList() {
  const container = document.getElementById("sensors-container");
  if (!container) return;

  if (state.sensors.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        No sensors configured yet. Press <strong>Add Sensor</strong> below for a blank row, use a Quick Add badge,
        or open the sensor catalog to pick a specific device.
      </div>
    `;
    return;
  }

  container.innerHTML = state.sensors.map((sensor) => {
    const catalogItem = SENSOR_CATALOG.find(c => c.id === sensor.catalogId || c.type === sensor.type) || SENSOR_CATALOG[0];
    const dataType = sensor.dataType || inferCloudDataType(catalogItem);
    const rc = normalizeRandomConfig(sensor);
    const provisioned = sensorIsProvisioned(sensor);

    // One key + variable_id row per cloud variable slot.
    let slotRows = "";
    if (sensor.type === "dht22" || sensor.type === "dht11") {
      slotRows =
        sensorSlotRowHtml(sensor, { key: sensor.varTemp || "temperature", keyAction: "update-sensor-vartemp", role: "Temperature", dataType: sensor.dataTypeTemp || "float" }, 0) +
        sensorSlotRowHtml(sensor, { key: sensor.varHum || "humidity", keyAction: "update-sensor-varhum", role: "Humidity", dataType: sensor.dataTypeHum || "float" }, 1);
    } else if (sensor.type === "bmp280") {
      slotRows =
        sensorSlotRowHtml(sensor, { key: sensor.varTemp || "baroTemp", keyAction: "update-sensor-vartemp", role: "Temperature", dataType: sensor.dataTypeTemp || "float" }, 0) +
        sensorSlotRowHtml(sensor, { key: sensor.varPress || "baroPress", keyAction: "update-sensor-varpress", role: "Pressure", dataType: sensor.dataTypePress || "float" }, 1);
    } else {
      slotRows = sensorSlotRowHtml(sensor, { key: sensor.varVal || sensor.varTemp || "value", keyAction: "update-sensor-var", role: "Reading", dataType }, 0);
    }

    return `
      <div class="item-card sensor-card ${rc.enabled ? "is-simulated" : ""}" data-id="${sensor.id}">
        <div class="item-icon">
          ${catalogItem.icon}
        </div>
        <div class="item-details">
          <input type="text" class="item-name-input" value="${escapeHtmlText(sensor.name)}" data-action="update-sensor-name" data-id="${sensor.id}" placeholder="Display Name" title="Display Name — shown on the dashboard and used to derive the telemetry key">
          <div class="item-meta">
            <span>Type: <strong>${escapeHtmlText(sensor.type.toUpperCase())}</strong></span>
            <span>•</span>
            <span>Cloud: <strong>${escapeHtmlText(dataType)}</strong></span>
            <span>•</span>
            <span>Interval: <strong>${Math.round((sensor.readInterval || 2000) / 1000)}s</strong></span>
            <span>•</span>
            <span class="sync-chip ${provisioned ? "is-synced" : "is-unsynced"}">${provisioned ? "variable_id issued" : "awaiting push"}</span>
            ${rc.enabled ? `<span>•</span><span class="sim-chip">SIMULATED</span>` : ""}
          </div>
          ${rc.enabled ? `<div class="item-subnote">${escapeHtmlText(describeRandomConfig(sensor))}</div>` : ""}
        </div>
        <div class="item-controls">
          <div class="item-fields-stack">
            ${slotRows}
            ${pinControlHtmlForSensor(sensor, catalogItem)}

            <div class="random-toggle-row">
              <label class="inline-toggle" title="Generate synthetic readings instead of reading hardware — useful before the sensor is wired">
                <input type="checkbox" data-action="toggle-sensor-random" data-id="${sensor.id}" ${rc.enabled ? "checked" : ""}>
                <span>Random Value Generator</span>
              </label>
              <button type="button" class="btn-chip" data-action="toggle-random-panel" data-id="${sensor.id}" aria-expanded="${rc.enabled ? "true" : "false"}">
                ${rc.enabled ? "Hide options" : "Configure"}
              </button>
            </div>
          </div>
          <button class="btn-remove-item" data-action="remove-sensor" data-id="${sensor.id}" title="Remove Sensor">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
        ${sensorRandomPanelHtml(sensor)}
      </div>
    `;
  }).join("");

  bindSensorCardEvents(container);
}

/** Wire every interactive element inside the rendered sensor cards. */
function bindSensorCardEvents(container) {
  const find = (el) => state.sensors.find((x) => x.id === el.dataset.id);

  // Display Name — also drives the telemetry key until the user edits the key.
  // The card is deliberately NOT re-rendered here: replacing the input mid-typing
  // would drop focus, so only the derived key field is patched in place.
  container.querySelectorAll('[data-action="update-sensor-name"]').forEach((el) => {
    el.addEventListener("input", (e) => {
      const s = find(e.target);
      if (!s) return;
      s.name = e.target.value;

      if (!s.keyTouched) {
        const derived = uniqueTelemetryKey(slugifyTelemetryKey(s.name), s.id);
        assignPrimaryTelemetryKey(s, derived);
        const card = e.target.closest ? e.target.closest(".item-card") : null;
        const primaryKeyInput = card
          ? card.querySelector('[data-action="update-sensor-var"], [data-action="update-sensor-vartemp"]')
          : null;
        if (primaryKeyInput) primaryKeyInput.value = derived;
      }

      persistStudioState();
      renderCloudSchemaTable();
      renderCloudRulesList();
    });
  });

  // Telemetry Key — manual edit wins over the derived value from then on.
  const keyBindings = [
    ["update-sensor-var", "single"],
    ["update-sensor-vartemp", "temp"],
    ["update-sensor-varhum", "hum"],
    ["update-sensor-varpress", "press"]
  ];
  keyBindings.forEach(([action, which]) => {
    container.querySelectorAll(`[data-action="${action}"]`).forEach((el) => {
      el.addEventListener("input", (e) => {
        const s = find(e.target);
        if (!s) return;
        const value = slugifyTelemetryKey(e.target.value);
        if (which === "single") { s.varVal = value; s.telemetryKey = value; s.keyTouched = true; }
        else if (which === "temp") { s.varTemp = value; s.keyTouched = true; }
        else if (which === "hum") { s.varHum = value; s.keyTouched = true; }
        else { s.varPress = value; s.keyTouched = true; }
        persistStudioState();
        renderCloudSchemaTable();
      });
    });
  });

  container.querySelectorAll('[data-action="update-sensor-pin"]').forEach((el) => {
    el.addEventListener("change", (e) => {
      const s = find(e.target);
      if (s) { s.pin = parseInt(e.target.value, 10); updateStudio(); }
    });
  });

  container.querySelectorAll('[data-action="copy-variable-id"]').forEach((el) => {
    el.addEventListener("click", (e) => {
      const s = find(e.currentTarget);
      const index = parseInt(e.currentTarget.dataset.slot, 10) || 0;
      if (!s) return;
      const ids = getSensorVariableIds(s);
      const entry = ids[index];
      if (!entry || !entry.value || /^YOUR_/i.test(entry.value)) {
        showToast("No variable_id yet — push this sensor to the cloud first");
        return;
      }
      copyTextToClipboard(entry.value, "variable_id copied");
    });
  });

  container.querySelectorAll('[data-action="toggle-sensor-random"]').forEach((el) => {
    el.addEventListener("change", (e) => {
      const s = find(e.target);
      if (!s) return;
      patchRandomConfig(s, { enabled: e.target.checked });
      renderSensorsList();
      updateStudio();
      showToast(s.random.enabled ? "Random Value Generator enabled — firmware will emit synthetic readings" : "Random Value Generator disabled");
    });
  });

  container.querySelectorAll('[data-action="toggle-random-panel"]').forEach((el) => {
    el.addEventListener("click", (e) => {
      const card = e.currentTarget.closest(".item-card");
      const panel = card ? card.querySelector('[data-role="random-panel"]') : null;
      if (!panel) return;
      const hidden = !panel.hasAttribute("hidden");
      if (hidden) panel.setAttribute("hidden", "");
      else { panel.removeAttribute("hidden"); patchRandomConfig(find(e.currentTarget), { enabled: true }); }
      e.currentTarget.textContent = hidden ? "Configure" : "Hide options";
      e.currentTarget.setAttribute("aria-expanded", hidden ? "false" : "true");
      const toggle = card ? card.querySelector('[data-action="toggle-sensor-random"]') : null;
      if (toggle && !hidden && !toggle.checked) { toggle.checked = true; renderSensorsList(); updateStudio(); }
    });
  });

  const randomBindings = [
    ["random-mode", "mode", "text"],
    ["random-min", "min", "float"],
    ["random-max", "max", "float"],
    ["random-precision", "precision", "int"],
    ["random-step", "step", "float"],
    ["random-period", "periodSec", "float"],
    ["random-values", "values", "text"],
    ["random-interval", "intervalMs", "int"],
    ["random-seed", "seed", "text"]
  ];
  randomBindings.forEach(([action, field, kind]) => {
    container.querySelectorAll(`[data-action="${action}"]`).forEach((el) => {
      const handler = (e) => {
        const s = find(e.target);
        if (!s) return;
        const raw = e.target.value;
        let value = raw;
        if (kind === "float") value = Number.isFinite(parseFloat(raw)) ? parseFloat(raw) : 0;
        else if (kind === "int") value = Number.isFinite(parseInt(raw, 10)) ? parseInt(raw, 10) : 0;
        patchRandomConfig(s, { [field]: value });
        if (field === "mode") renderSensorsList();
        persistStudioState();
        renderCloudSchemaTable();
      };
      el.addEventListener("change", handler);
      if (kind === "text" && field !== "mode") el.addEventListener("input", handler);
    });
  });

  container.querySelectorAll('[data-action="random-push-on-boot"]').forEach((el) => {
    el.addEventListener("change", (e) => {
      const s = find(e.target);
      if (s) { patchRandomConfig(s, { pushOnBoot: e.target.checked }); updateStudio(); }
    });
  });

  container.querySelectorAll('[data-action="remove-sensor"]').forEach((el) => {
    el.addEventListener("click", async (e) => {
      const id = e.currentTarget.dataset.id;
      const sensor = state.sensors.find((x) => x.id === id) || {};
      const linked = state.rules.filter((r) => r.sensorId === id).length;
      const sName = sensor.name;
      if (!(await StudioUI.confirm({
        title: `Remove ${sName ? "“" + sName + "”" : "this sensor"}?`,
        message: linked ? `${linked} rule(s) that use it will be removed too.` : "It will be removed from the generated firmware.",
        confirmText: "Remove", danger: true
      }))) return;

      // Bug 11 — deletion must be server-authoritative. A pushed sensor has a
      // real sensorId; delete it on the gateway first and abort the local
      // removal if the server refuses, so it cannot "reappear" on refresh.
      if (sensor.sensorId) {
        el.disabled = true;
        try {
          await deleteSensorOnCloud(sensor.sensorId);
        } catch (err) {
          el.disabled = false;
          showToast(`Cloud delete failed: ${err.message}${err.code ? ` [${err.code}]` : ""}`, "error");
          return;
        }
      }

      state.sensors = state.sensors.filter((x) => x.id !== id);
      state.rules = state.rules.filter((r) => r.sensorId !== id);
      // Drop any cloud-rule blueprints bound to the removed sensor as well.
      if (Array.isArray(state.cloudRules)) {
        state.cloudRules = state.cloudRules.filter((r) => r.sensorId !== id && r.sensor_id !== id);
      }

      renderSensorsList();
      renderRulesList();
      if (typeof renderCloudRulesList === "function") renderCloudRulesList();
      persistStudioState();
      updateStudio();
      // Resync the hydrated variable list so the studio does not keep variables
      // that belonged to the deleted sensor.
      try { await hydrateCloudVariableIds(); } catch (err) { /* best effort */ }
      showToast("Sensor removed");
    });
  });
}

/**
 * Write the primary telemetry key onto whichever field the sensor's shape uses.
 * Dual-reading sensors (DHT/BMP) keep their own second key untouched.
 */
function assignPrimaryTelemetryKey(sensor, value) {
  if (sensor.type === "dht22" || sensor.type === "dht11") {
    sensor.varTemp = value;
    sensor.telemetryKey = value;
    if (!sensor.varHum) sensor.varHum = uniqueTelemetryKey(slugifyTelemetryKey(value + "_2"), sensor.id);
    return;
  }
  if (sensor.type === "bmp280") {
    sensor.varTemp = value;
    sensor.telemetryKey = value;
    if (!sensor.varPress) sensor.varPress = uniqueTelemetryKey(slugifyTelemetryKey(value + "_pressure"), sensor.id);
    return;
  }
  sensor.varVal = value;
  sensor.telemetryKey = value;
}

/**
 * "Add Sensor": append a blank, fully editable sensor row.
 * Defaults to a generic analog reading so the row is valid before the user picks
 * a real device from the catalog.
 */
function addBlankSensorRow() {
  const catalogItem = SENSOR_CATALOG.find((c) => c.type === "soil") || SENSOR_CATALOG[0];
  const filteredPins = getFilteredPinOptions(catalogItem, state.controller, false);
  const usedPins = getAllAssignedPins();
  const freePin = filteredPins.find((p) => !usedPins.includes(p.pin)) || filteredPins[0];

  const seq = state.sensors.length + 1;
  const displayName = `New Sensor ${seq}`;
  const key = uniqueTelemetryKey(slugifyTelemetryKey(displayName), null);

  state.sensors.push({
    id: "sens_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    catalogId: catalogItem.id,
    type: catalogItem.type,
    name: displayName,
    telemetryKey: key,
    keyTouched: false,
    pin: freePin ? freePin.pin : 34,
    bus: catalogItem.bus || null,
    signalType: catalogItem.signalType || (catalogItem.isAnalog ? "adc" : "digital_input"),
    varVal: key,
    dataType: inferCloudDataType(catalogItem),
    unit: catalogItem.unit || "val",
    readInterval: catalogItem.interval || 2000,
    sensorId: "",
    variableIds: {},
    random: defaultRandomConfig(inferCloudDataType(catalogItem))
  });

  renderSensorsList();
  renderCloudSchemaTable();
  persistStudioState();
  updateStudio();
  showToast(`Blank sensor row added on GPIO ${freePin ? freePin.pin : 34} — set the Display Name, then push to the cloud`);
}

function initActuatorHandlers() {
  const quickBadges = document.querySelectorAll(".badge-add-btn[data-preset-out]");
  quickBadges.forEach((btn) => {
    btn.addEventListener("click", () => {
      const presetKey = btn.getAttribute("data-preset-out");
      addActuatorFromPreset(presetKey);
    });
  });
}

function addActuatorFromPreset(presetKey) {
  const preset = ACTUATOR_CATALOG.find(a => a.id === presetKey || a.type === presetKey) || ACTUATOR_CATALOG[0];
  const id = "act_" + Date.now().toString(36);
  const busConfig = CONTROLLER_BUSES[state.controller] || CONTROLLER_BUSES.esp32_devkit;
  const usedPins = getAllAssignedPins();
  const filteredPins = getFilteredPinOptions(preset, state.controller, true);
  let selectedPin = preset.defaultPin;

  if (preset.bus === "i2c") {
    selectedPin = busConfig.i2c.sda;
  } else if (preset.type === "stepper_motor") {
    selectedPin = busConfig.stepper.pins[0];
  } else if (filteredPins.length === 1 && filteredPins[0].isFixed) {
    selectedPin = filteredPins[0].pin;
  } else if (usedPins.includes(selectedPin) || !filteredPins.some(p => p.pin === selectedPin)) {
    const nextFree = filteredPins.find((p) => !usedPins.includes(p.pin)) || filteredPins[0];
    if (nextFree) selectedPin = nextFree.pin;
  }

  const newActuator = {
    id,
    catalogId: preset.id,
    type: preset.type,
    name: `${preset.name} ${state.actuators.length + 1}`,
    pin: selectedPin,
    bus: preset.bus || null,
    signalType: preset.signalType || "digital_output",
    activeLow: preset.activeLow !== undefined ? preset.activeLow : false,
    defaultState: preset.defaultState || "LOW",
    varState: `${preset.defaultVar || "actState"}_${state.actuators.length + 1}`,
    paramType: inferActuatorParamType(preset),
    templateId: "",
    commandId: "",
    useBuiltInLed: false,
    response: defaultResponseMap(preset)
  };

  if (preset.type === "stepper_motor") {
    newActuator.pins = [...busConfig.stepper.pins];
  }

  if (preset.type === "pwm_led" || preset.type === "motor_pwm") {
    newActuator.channel = state.actuators.filter(a => a.type === "pwm_led" || a.type === "motor_pwm").length;
    newActuator.frequency = 5000;
  }

  state.actuators.push(newActuator);
  renderActuatorsList();
  renderRulesList();
  updateStudio();
  showToast(`Added ${newActuator.name}`);
}

function renderActuatorsList() {
  const container = document.getElementById("actuators-container");
  if (state.actuators.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 2rem; color: var(--text-dim); background: rgba(15,23,42,0.4); border-radius: 8px;">
        No output actuators configured. Click "+ Relay" or "Open Add Actuator Catalog" above.
      </div>
    `;
    return;
  }

  container.innerHTML = state.actuators.map((act) => {
    const catalogItem = ACTUATOR_CATALOG.find(c => c.id === act.catalogId || c.type === act.type) || ACTUATOR_CATALOG[0];
    const busConfig = CONTROLLER_BUSES[state.controller] || CONTROLLER_BUSES.esp32_devkit;

    // Prefer the explicit link, then fall back to a template-id match so a
    // blueprint restored from JSON still shows its binding.
    const boundCommand = state.commands.find((c) => c.id === act.commandId) ||
      state.commands.find((c) => c.serverId && c.serverId === act.templateId);
    const response = normalizeResponseMap(act);
    const responseRange = getActuatorOutputRange(act);

    let pinControlHtml = "";
    if (act.bus === "i2c" || catalogItem.bus === "i2c") {
      pinControlHtml = `
        <div class="fixed-bus-badge badge-i2c" title="Hardware I2C Bus: SDA ${busConfig.i2c.sda}, SCL ${busConfig.i2c.scl}">
          <span>⚡</span> I2C (SDA:${busConfig.i2c.sda}, SCL:${busConfig.i2c.scl})
        </div>
      `;
    } else if (act.type === "stepper_motor") {
      const sPins = act.pins || busConfig.stepper.pins;
      pinControlHtml = `
        <div class="fixed-bus-badge badge-stepper" title="4-Wire Stepper Driver Pins: IN1:${sPins[0]}, IN2:${sPins[1]}, IN3:${sPins[2]}, IN4:${sPins[3]}">
          <span>⚡</span> 4-Wire (${sPins.join(", ")})
        </div>
      `;
    } else {
      const filteredPins = getFilteredPinOptions(catalogItem, state.controller, true);
      const pinSelectOptions = filteredPins.map((p) => {
        const isSelected = p.pin === act.pin ? "selected" : "";
        return `<option value="${p.pin}" ${isSelected}>${p.label}</option>`;
      }).join("");

      pinControlHtml = `
        <div class="pin-select-group">
          <span class="pin-select-label">${catalogItem.signalType === 'pwm' ? 'PWM:' : 'GPIO:'}</span>
          <select class="pin-select" data-action="update-actuator-pin" data-id="${act.id}">
            ${pinSelectOptions}
          </select>
        </div>
      `;
    }

    return `
      <div class="item-card" data-id="${act.id}">
        <div class="item-icon actuator-icon">
          ${catalogItem.icon}
        </div>
        <div class="item-details">
          <input type="text" class="item-name-input" value="${act.name}" data-action="update-actuator-name" data-id="${act.id}">
          <div class="item-meta">
            <span>Type: <strong>${act.type.toUpperCase()}</strong></span>
            <span>•</span>
            <span>Default: <strong>${act.defaultState}</strong></span>
            <span>•</span>
            <span>Param: <strong>${act.paramType || inferActuatorParamType(catalogItem)}</strong></span>
            ${act.type === "relay" ? `<span>• Logic: <strong>${act.activeLow ? 'Active LOW' : 'Active HIGH'}</strong></span>` : ''}
          </div>
        </div>
        <div class="item-controls">
          <div class="item-fields-stack">
            <!-- Cloud Command Parameter Key -->
            <div class="var-input-group" title="Command parameter key read from the incoming parametersJson">
              <span class="var-input-label">PARAM:</span>
              <input type="text" class="item-var-input" value="${act.varState}" data-action="update-actuator-var" data-id="${act.id}" title="Command Parameter Key">
            </div>
            <!-- Cloud Command Template ID -->
            <div class="uuid-input-group" title="Cloud command template UUID (CloudCommand.templateId)">
              <span class="uuid-input-label">TPL:</span>
              <input type="text" class="item-uuid-input" value="${act.templateId || ''}" placeholder="YOUR_COMMAND_TEMPLATE_UUID" data-action="update-actuator-template" data-id="${act.id}">
            </div>
            <!-- Built-in LED visual feedback -->
            <label class="inline-toggle" title="Mirror this output to the onboard LED so a cloud command is visibly confirmed">
              <input type="checkbox" data-action="toggle-actuator-builtin-led" data-id="${act.id}" ${act.useBuiltInLed ? "checked" : ""}>
              <span>Built-in LED feedback${act.useBuiltInLed ? ` (GPIO ${getBuiltInLed().pin})` : ""}</span>
            </label>
            <!-- Command binding: which cloud template drives this output -->
            <div class="bind-row" title="The cloud command template that drives this actuator">
              <span class="bind-label">CMD:</span>
              <span class="bind-state ${boundCommand ? "is-bound" : "is-unbound"}">
                ${boundCommand
                  ? escapeHtmlText(boundCommand.name) + (boundCommand.serverIssued ? "" : " (not pushed)")
                  : "no command template bound"}
              </span>
              <button type="button" class="btn-chip" data-action="actuator-create-command" data-id="${act.id}" title="Create a command template bound to this actuator">
                ${boundCommand ? "+ Another" : "Create template"}
              </button>
            </div>
            <!-- Response mapping: how the received command value drives the output -->
            ${boundCommand ? `
            <div class="response-block" title="How the value received from ${escapeHtmlText(boundCommand.name)} drives this output">
              <div class="response-head">
                <span>Response mapping</span>
                <span class="response-range">${escapeHtmlText(responseRange.kind === "display" ? "text output" : `${responseRange.min}…${responseRange.max}${responseRange.unit ? " " + responseRange.unit : ""}`)}</span>
              </div>

              <div class="response-grid">
                <label class="response-field response-field-wide">
                  <span>Mode</span>
                  <select data-action="response-mode" data-id="${act.id}">
                    ${Object.keys(RESPONSE_MODES).map((mode) => `<option value="${mode}" ${response.mode === mode ? "selected" : ""}>${RESPONSE_MODES[mode]}</option>`).join("")}
                  </select>
                </label>

                ${response.mode === "scale" ? `
                <label class="response-field"><span>Input from</span><input type="number" step="any" value="${response.inputMin}" data-action="response-input-min" data-id="${act.id}"></label>
                <label class="response-field"><span>Input to</span><input type="number" step="any" value="${response.inputMax}" data-action="response-input-max" data-id="${act.id}"></label>
                <label class="response-field"><span>Output from</span><input type="number" step="any" value="${response.outputMin}" data-action="response-output-min" data-id="${act.id}"></label>
                <label class="response-field"><span>Output to</span><input type="number" step="any" value="${response.outputMax}" data-action="response-output-max" data-id="${act.id}"></label>
                ` : ""}

                ${response.mode === "threshold" ? `
                <label class="response-field"><span>Threshold</span><input type="number" step="any" value="${response.threshold}" data-action="response-threshold" data-id="${act.id}"></label>
                ` : ""}

                ${response.mode === "fixed" ? `
                <label class="response-field"><span>Fixed value</span><input type="number" step="any" value="${response.fixedValue}" data-action="response-fixed" data-id="${act.id}"></label>
                ` : ""}
              </div>

              <div class="random-flags">
                <label class="inline-toggle">
                  <input type="checkbox" data-action="response-clamp" data-id="${act.id}" ${response.clamp ? "checked" : ""}>
                  <span>Clamp to output range</span>
                </label>
                ${responseRange.kind === "digital" ? `
                <label class="inline-toggle">
                  <input type="checkbox" data-action="response-invert" data-id="${act.id}" ${response.invert ? "checked" : ""}>
                  <span>Invert ON/OFF</span>
                </label>
                ` : ""}
                <span class="random-summary">${escapeHtmlText(describeResponseMap(act))}</span>
              </div>
            </div>` : ""}

            ${pinControlHtml}
          </div>
          <button class="btn-remove-item" data-action="remove-actuator" data-id="${act.id}" title="Remove Actuator">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </div>
    `;
  }).join("");

  container.querySelectorAll('[data-action="update-actuator-name"]').forEach((el) => {
    el.addEventListener("input", (e) => {
      const a = state.actuators.find((x) => x.id === e.target.dataset.id);
      if (a) { a.name = e.target.value; updateStudio(); }
    });
  });

  // Direct Inline Cloud Command Parameter Editing
  container.querySelectorAll('[data-action="update-actuator-var"]').forEach((el) => {
    el.addEventListener("input", (e) => {
      const a = state.actuators.find((x) => x.id === e.target.dataset.id);
      if (a) {
        a.varState = e.target.value.replace(/[^a-zA-Z0-9_]/g, "");
        updateStudio();
      }
    });
  });

  // Cloud command template UUID binding
  container.querySelectorAll('[data-action="update-actuator-template"]').forEach((el) => {
    el.addEventListener("input", (e) => {
      const a = state.actuators.find((x) => x.id === e.target.dataset.id);
      if (a) {
        a.templateId = e.target.value.trim();
        updateStudio();
      }
    });
  });

  container.querySelectorAll('[data-action="update-actuator-pin"]').forEach((el) => {
    el.addEventListener("change", (e) => {
      const a = state.actuators.find((x) => x.id === e.target.dataset.id);
      if (a) { a.pin = parseInt(e.target.value, 10); updateStudio(); }
    });
  });

  // Response mapping: how the received command value drives this output.
  container.querySelectorAll('[data-action="response-mode"]').forEach((el) => {
    el.addEventListener("change", (e) => {
      const a = state.actuators.find((x) => x.id === e.target.dataset.id);
      if (!a) return;
      patchResponseMap(a, { mode: e.target.value });
      renderActuatorsList();
      persistStudioState();
      updateStudio();
      showToast(`Response mapping: ${RESPONSE_MODES[a.response.mode]}`);
    });
  });

  const responseNumberBindings = [
    ["response-input-min", "inputMin"],
    ["response-input-max", "inputMax"],
    ["response-output-min", "outputMin"],
    ["response-output-max", "outputMax"],
    ["response-threshold", "threshold"],
    ["response-fixed", "fixedValue"]
  ];
  responseNumberBindings.forEach(([action, field]) => {
    container.querySelectorAll(`[data-action="${action}"]`).forEach((el) => {
      el.addEventListener("change", (e) => {
        const a = state.actuators.find((x) => x.id === e.target.dataset.id);
        if (!a) return;
        const parsed = parseFloat(e.target.value);
        patchResponseMap(a, { [field]: Number.isFinite(parsed) ? parsed : 0 });
        renderActuatorsList();
        persistStudioState();
        updateStudio();
      });
    });
  });

  container.querySelectorAll('[data-action="response-clamp"]').forEach((el) => {
    el.addEventListener("change", (e) => {
      const a = state.actuators.find((x) => x.id === e.target.dataset.id);
      if (!a) return;
      patchResponseMap(a, { clamp: e.target.checked });
      renderActuatorsList();
      persistStudioState();
      updateStudio();
    });
  });

  container.querySelectorAll('[data-action="response-invert"]').forEach((el) => {
    el.addEventListener("change", (e) => {
      const a = state.actuators.find((x) => x.id === e.target.dataset.id);
      if (!a) return;
      patchResponseMap(a, { invert: e.target.checked });
      renderActuatorsList();
      persistStudioState();
      updateStudio();
    });
  });

  container.querySelectorAll('[data-action="actuator-create-command"]').forEach((el) => {
    el.addEventListener("click", (e) => {
      const actuator = state.actuators.find((x) => x.id === e.currentTarget.dataset.id);
      if (actuator) createCommandForActuator(actuator);
    });
  });

  container.querySelectorAll('[data-action="toggle-actuator-builtin-led"]').forEach((el) => {
    el.addEventListener("change", (e) => {
      const a = state.actuators.find((x) => x.id === e.target.dataset.id);
      if (a) {
        a.useBuiltInLed = e.target.checked;
        renderActuatorsList();
        updateStudio();
        showToast(a.useBuiltInLed ? "Built-in LED feedback enabled" : "Built-in LED feedback disabled");
      }
    });
  });

  container.querySelectorAll('[data-action="remove-actuator"]').forEach((el) => {
    el.addEventListener("click", async (e) => {
      const id = e.currentTarget.dataset.id;
      const linked = state.rules.filter((r) => r.actuatorId === id).length;
      const aName = (state.actuators.find((x) => x.id === id) || {}).name;
      if (!(await StudioUI.confirm({
        title: `Remove ${aName ? "“" + aName + "”" : "this actuator"}?`,
        message: linked ? `${linked} rule(s) that use it will be removed too.` : "It will be removed from the generated firmware.",
        confirmText: "Remove", danger: true
      }))) return;
      state.actuators = state.actuators.filter((x) => x.id !== id);
      state.rules = state.rules.filter((r) => r.actuatorId !== id);
      renderActuatorsList();
      renderRulesList();
      updateStudio();
      showToast("Actuator removed");
    });
  });
}

/**
 * 7. Automation Rules Engine
 */
function initRuleHandlers() {
  // Logic rules handled through dedicated modal
}

function renderRulesList() {
  const container = document.getElementById("rules-container");
  if (!container) return;

  if (state.rules.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 1.5rem; color: var(--text-dim); background: rgba(15,23,42,0.4); border-radius: 8px;">
        No automation rules defined yet. Click "Open Add Automation Rule Page" above to create autonomous edge logic.
      </div>
    `;
    return;
  }

  container.innerHTML = state.rules.map((rule, idx) => {
    const sensor = state.sensors.find((s) => s.id === rule.sensorId) || state.sensors[0];
    const actuator = state.actuators.find((a) => a.id === rule.actuatorId) || state.actuators[0];

    const sensorOptions = state.sensors.map((s) => {
      const isSelected = s.id === (sensor ? sensor.id : rule.sensorId) ? "selected" : "";
      return `<option value="${s.id}" ${isSelected}>${s.name}</option>`;
    }).join("");

    const actuatorOptions = state.actuators.map((a) => {
      const isSelected = a.id === (actuator ? actuator.id : rule.actuatorId) ? "selected" : "";
      return `<option value="${a.id}" ${isSelected}>${a.name}</option>`;
    }).join("");

    const condModel = getSensorConditionModel(sensor);
    const actModel = getActuatorActionModel(actuator);

    // 1. Render Device Condition Inputs (IF)
    let conditionHTML = "";
    if (condModel.isDigital) {
      const currentDigState = rule.targetDigitalState || condModel.options[0].value;
      const digOptions = condModel.options.map((opt) => {
        return `<option value="${opt.value}" ${currentDigState === opt.value ? 'selected' : ''}>${opt.label}</option>`;
      }).join("");

      conditionHTML = `
        <select class="rule-select" data-action="rule-digital-state" data-id="${rule.id}">
          ${digOptions}
        </select>
      `;
    } else {
      // Multi-metric or analog
      let subVarHTML = "";
      let currentUnit = sensor ? (sensor.unit || "%") : "%";
      let currentStep = 0.5;

      if (condModel.variables && condModel.variables.length > 1) {
        const curSubVar = rule.subVar || condModel.variables[0].varName;
        const matchedVar = condModel.variables.find((v) => v.varName === curSubVar) || condModel.variables[0];
        currentUnit = matchedVar.unit;
        currentStep = matchedVar.step || 0.5;

        const subVarOpts = condModel.variables.map((v) => {
          return `<option value="${v.varName}" ${curSubVar === v.varName ? 'selected' : ''}>${v.name} (${v.unit})</option>`;
        }).join("");

        subVarHTML = `
          <select class="rule-select" data-action="rule-subvar" data-id="${rule.id}">
            ${subVarOpts}
          </select>
        `;
      } else if (condModel.variables && condModel.variables[0]) {
        currentUnit = condModel.variables[0].unit || "";
        currentStep = condModel.variables[0].step || 0.5;
      }

      const opOptions = [
        { op: ">", label: "is greater than (>)" },
        { op: "<", label: "is less than (<)" },
        { op: ">=", label: "is at least (>=)" },
        { op: "<=", label: "is at most (<=)" },
        { op: "==", label: "equals (==)" },
        { op: "!=", label: "not equals (!=)" }
      ].map((o) => `<option value="${o.op}" ${rule.operator === o.op ? 'selected' : ''}>${o.label}</option>`).join("");

      conditionHTML = `
        ${subVarHTML}
        <select class="rule-select" data-action="rule-op" data-id="${rule.id}">
          ${opOptions}
        </select>
        <input type="number" step="${currentStep}" class="rule-input" value="${rule.threshold !== undefined ? rule.threshold : 30}" data-action="rule-thresh" data-id="${rule.id}">
        <span class="rule-unit">${currentUnit}</span>
      `;
    }

    // 2. Render Device Action Inputs (THEN)
    let actionHTML = "";
    const currentTargetState = rule.targetState || actModel.options[0].value;
    const actOptions = actModel.options.map((opt) => {
      return `<option value="${opt.value}" ${currentTargetState === opt.value ? 'selected' : ''}>${opt.label}</option>`;
    }).join("");

    actionHTML = `
      <select class="rule-select" data-action="rule-target-state" data-id="${rule.id}">
        ${actOptions}
      </select>
    `;

    if ((actModel.category === "pwm" || actModel.category === "servo" || actModel.category === "stepper") && currentTargetState === "custom") {
      const customVal = rule.customVal !== undefined ? rule.customVal : (actModel.defaultCustomVal || 0);
      actionHTML += `
        <input type="number" class="rule-input" value="${customVal}" data-action="rule-custom-actuator-val" data-id="${rule.id}">
        <span class="rule-unit">${actModel.unit}</span>
      `;
    } else if (actModel.category === "display" && currentTargetState === "MSG_ALERT") {
      const customMsg = rule.customMessage || actModel.defaultCustomMessage || "ALERT: LIMIT REACHED!";
      actionHTML += `
        <input type="text" class="rule-input rule-input-text" maxlength="32" value="${customMsg}" data-action="rule-custom-message" data-id="${rule.id}" placeholder="Display Message">
      `;
    }

    const sensorName = sensor ? sensor.name : "Sensor";
    const actuatorName = actuator ? actuator.name : "Actuator";

    return `
      <div class="rule-card" data-id="${rule.id}">
        <div class="rule-header">
          <div class="rule-title-group">
            <span class="rule-tag">RULE #0${idx + 1}</span>
            <span class="rule-name-preview">${sensorName} ➔ ${actuatorName}</span>
          </div>
          <button class="btn-remove-item" data-action="remove-rule" data-id="${rule.id}" title="Remove Rule">
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div class="rule-row">
          <span class="rule-keyword keyword-if">IF</span>
          <select class="rule-select rule-device-select" data-action="rule-sensor" data-id="${rule.id}">
            ${sensorOptions}
          </select>
          ${conditionHTML}
        </div>

        <div class="rule-row">
          <span class="rule-keyword keyword-then">THEN</span>
          <select class="rule-select rule-device-select" data-action="rule-actuator" data-id="${rule.id}">
            ${actuatorOptions}
          </select>
          <span class="rule-keyword keyword-action">ACTION:</span>
          ${actionHTML}
        </div>

        <div class="rule-footer-row">
          <label class="rule-cloud-toggle">
            <input type="checkbox" data-action="rule-cloud-alert" data-id="${rule.id}" ${rule.cloudAlert ? 'checked' : ''}>
            <span>Push Cloud Alert Notification & Log Event to Own Cloud Server</span>
          </label>
        </div>
      </div>
    `;
  }).join("");

  // Attach Event Handlers
  container.querySelectorAll('[data-action="rule-sensor"]').forEach((el) => {
    el.addEventListener("change", (e) => {
      const r = state.rules.find((x) => x.id === e.target.dataset.id);
      if (r) {
        r.sensorId = e.target.value;
        const s = state.sensors.find((x) => x.id === r.sensorId);
        if (s) {
          const m = getSensorConditionModel(s);
          if (m.isDigital) {
            r.targetDigitalState = m.options[0].value;
            r.operator = "==";
            r.threshold = m.options[0].numericVal;
            r.subVar = s.varVal || "state";
          } else {
            delete r.targetDigitalState;
            r.subVar = m.variables[0].varName;
            r.operator = m.defaultOp || ">";
            r.threshold = m.variables[0].defaultThresh;
          }
        }
        renderRulesList();
        updateStudio();
      }
    });
  });

  container.querySelectorAll('[data-action="rule-digital-state"]').forEach((el) => {
    el.addEventListener("change", (e) => {
      const r = state.rules.find((x) => x.id === e.target.dataset.id);
      if (r) {
        r.targetDigitalState = e.target.value;
        r.operator = "==";
        r.threshold = (r.targetDigitalState === "PRESSED" || r.targetDigitalState === "ON" || r.targetDigitalState === "DETECTED" || r.targetDigitalState === "READY" || r.targetDigitalState === "MOTION" || r.targetDigitalState === "ALARM_MATCH" || r.targetDigitalState === "FIX_ACQUIRED") ? 1 : 0;
        updateStudio();
      }
    });
  });

  container.querySelectorAll('[data-action="rule-subvar"]').forEach((el) => {
    el.addEventListener("change", (e) => {
      const r = state.rules.find((x) => x.id === e.target.dataset.id);
      if (r) {
        r.subVar = e.target.value;
        const s = state.sensors.find((x) => x.id === r.sensorId);
        if (s) {
          const m = getSensorConditionModel(s);
          const matched = m.variables.find((v) => v.varName === r.subVar);
          if (matched) r.threshold = matched.defaultThresh;
        }
        renderRulesList();
        updateStudio();
      }
    });
  });

  container.querySelectorAll('[data-action="rule-op"]').forEach((el) => {
    el.addEventListener("change", (e) => {
      const r = state.rules.find((x) => x.id === e.target.dataset.id);
      if (r) {
        r.operator = e.target.value;
        updateStudio();
      }
    });
  });

  container.querySelectorAll('[data-action="rule-thresh"]').forEach((el) => {
    el.addEventListener("input", (e) => {
      const r = state.rules.find((x) => x.id === e.target.dataset.id);
      if (r) {
        r.threshold = parseFloat(e.target.value) || 0;
        updateStudio();
      }
    });
  });

  container.querySelectorAll('[data-action="rule-actuator"]').forEach((el) => {
    el.addEventListener("change", (e) => {
      const r = state.rules.find((x) => x.id === e.target.dataset.id);
      if (r) {
        r.actuatorId = e.target.value;
        const a = state.actuators.find((x) => x.id === r.actuatorId);
        if (a) {
          const m = getActuatorActionModel(a);
          r.targetState = m.options[0].value;
          r.customVal = m.defaultCustomVal || 0;
          r.customMessage = m.defaultCustomMessage || "ALERT: LIMIT REACHED!";
        }
        renderRulesList();
        updateStudio();
      }
    });
  });

  container.querySelectorAll('[data-action="rule-target-state"]').forEach((el) => {
    el.addEventListener("change", (e) => {
      const r = state.rules.find((x) => x.id === e.target.dataset.id);
      if (r) {
        r.targetState = e.target.value;
        renderRulesList();
        updateStudio();
      }
    });
  });

  container.querySelectorAll('[data-action="rule-custom-actuator-val"]').forEach((el) => {
    el.addEventListener("input", (e) => {
      const r = state.rules.find((x) => x.id === e.target.dataset.id);
      if (r) {
        r.customVal = parseFloat(e.target.value) || 0;
        updateStudio();
      }
    });
  });

  container.querySelectorAll('[data-action="rule-custom-message"]').forEach((el) => {
    el.addEventListener("input", (e) => {
      const r = state.rules.find((x) => x.id === e.target.dataset.id);
      if (r) {
        r.customMessage = e.target.value;
        updateStudio();
      }
    });
  });

  container.querySelectorAll('[data-action="rule-cloud-alert"]').forEach((el) => {
    el.addEventListener("change", (e) => {
      const r = state.rules.find((x) => x.id === e.target.dataset.id);
      if (r) {
        r.cloudAlert = e.target.checked;
        updateStudio();
      }
    });
  });

  container.querySelectorAll('[data-action="remove-rule"]').forEach((el) => {
    el.addEventListener("click", (e) => {
      state.rules = state.rules.filter((x) => x.id !== e.currentTarget.dataset.id);
      renderRulesList();
      updateStudio();
      showToast("Rule removed");
    });
  });
}

/**
 * Top Navbar & Action Buttons
 */
/* ===========================================================================
   OMNITEQ CLOUD PLATFORM INTEGRATION
   ===========================================================================
   Everything below talks to the same gateway the main console uses:

     POST   /projects/:projectId/devices
     POST   /devices/:deviceId/sensors          -> { name, unit, description }
     POST   /sensors/:sensorId/variables        -> { label, data_type }
     POST   /devices/:deviceId/command-templates-> { name, description, parameters[] }
     POST   /devices/:deviceId/rules            -> { name, variable_id, operator, ... }
     POST   /ingest/telemetry                   -> { device_id, secret_key, readings[] }

   Every request goes through cloudRequest() so auth, the gateway base URL and
   error unwrapping look exactly like js/api.js on the console pages.
   =========================================================================== */

/**
 * Thin fetch wrapper around the device/telemetry API.
 *
 * Deliberately not js/api.js: the studio is often opened standalone from disk,
 * and a 401 inside the console's client triggers a refresh-and-redirect flow that
 * would blow away an in-progress studio session.
 */
async function cloudRequest(method, path, body, opts) {
  const settings = opts || {};
  // Device-credential ingest routes carry their own auth, so they must work even
  // when the studio is opened without a console session (mirrors js/api.js noAuth).
  const noAuth = !!settings.noAuth;

  const cfg = window.OMNITEQ_CONFIG;
  if (!cfg || typeof cfg.resolve !== "function") {
    throw new Error("Gateway configuration (js/config.js) is unavailable.");
  }

  let token = null;
  try { token = localStorage.getItem("access_token"); } catch (e) { /* private mode */ }
  if (!noAuth && !token) {
    const err = new Error("Sign in to OmniTeq Cloud to provision resources.");
    err.code = "NO_SESSION";
    throw err;
  }

  const baseUrl = cfg.resolve().apiBaseUrl.replace(/\/+$/, "");
  const headers = {};
  // Session credentials are attached to console routes only. Device-credential
  // routes must never carry a possibly-expired JWT (mirrors js/api.js noAuth).
  if (token && !noAuth) headers.Authorization = `Bearer ${token}`;
  const options = { method, headers };
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(`${baseUrl}${path}`, options);
  } catch (networkError) {
    const err = new Error("Cannot reach the OmniTeq gateway. Check the Cloud API Base URL and that the server is running.");
    err.code = "NETWORK";
    throw err;
  }

  const payload = await res.json().catch(() => null);

  if (!res.ok || !payload || payload.success !== true) {
    const code = payload && payload.error ? payload.error.code : `HTTP_${res.status}`;
    const message = payload && payload.error && payload.error.message
      ? payload.error.message
      : `Request failed (${code}).`;
    const err = new Error(message);
    err.code = code;
    err.status = res.status;
    throw err;
  }

  return payload.data;
}

/**
 * Bug 11 — delete a sensor on the gateway. Server state is authoritative, so a
 * sensor removed in the studio must first be removed there; otherwise the next
 * hydrate/refresh re-links it and it "reappears". A 204 or empty body counts as
 * success; anything else throws a descriptive error. Kept as a plain fetch (like
 * hydrateCloudVariableIds) so a 401 cannot trigger js/api.js's redirect flow.
 */
async function deleteSensorOnCloud(sensorId) {
  if (!sensorId) return true;
  const cfg = window.OMNITEQ_CONFIG;
  if (!cfg || typeof cfg.resolve !== "function") {
    throw new Error("Gateway configuration (js/config.js) is unavailable.");
  }
  let token = null;
  try { token = localStorage.getItem("access_token"); } catch (e) { /* private mode */ }
  if (!token) {
    const err = new Error("Sign in to OmniTeq Cloud to delete cloud resources.");
    err.code = "NO_SESSION";
    throw err;
  }

  let res;
  try {
    res = await fetch(`${cfg.resolve().apiBaseUrl.replace(/\/+$/, "")}/sensors/${encodeURIComponent(sensorId)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
  } catch (e) {
    const err = new Error("Cannot reach the OmniTeq gateway. Check the Cloud API Base URL and that the server is running.");
    err.code = "NETWORK";
    throw err;
  }

  if (res.status === 204) return true;
  const payload = await res.json().catch(() => null);
  if (!res.ok || (payload && payload.success === false)) {
    const message = payload && payload.error && payload.error.message
      ? payload.error.message
      : `Request failed (HTTP_${res.status}).`;
    const err = new Error(message);
    err.code = (payload && payload.error && payload.error.code) || `HTTP_${res.status}`;
    err.status = res.status;
    throw err;
  }
  return true;
}

/** Write a section-level status line, e.g. "#sensors-push-status". */
function setSectionStatus(elementId, message, stateClass) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.classList.remove("is-pending", "is-success", "is-error");
  if (stateClass) el.classList.add(stateClass);
  el.innerHTML = message;
}

async function copyTextToClipboard(text, successMessage) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      showToast(successMessage || "Copied to clipboard");
      return true;
    } catch (e) { /* fall through */ }
  }
  showToast("Clipboard unavailable — copy the value manually");
  return false;
}

/**
 * A device is only usable for provisioning once Add Device has stored a real
 * server id. Placeholders and obviously truncated values are rejected locally, so
 * the user gets a clear instruction instead of a 404 from the gateway.
 */
function requireDeviceIdForProvisioning() {
  const id = (state.project.deviceId || "").trim();
  if (!id || /^YOUR_/i.test(id) || id.length < 8) return null;
  return id;
}

/* ---------------------------------------------------------------------------
   Status variable (Section 01)
   --------------------------------------------------------------------------- */

/**
 * The status variable is a plain `string` variable that the firmware writes
 * "RUNNING" / "OFFLINE" into. In auto mode the UUID is minted by the gateway when
 * the node is pushed; in manual mode the user owns the value.
 */
async function provisionStatusVariable(deviceId, sensorId) {
  const key = slugifyTelemetryKey(state.project.statusVariableKey || "nodeStatus");
  const existing = (state.project.statusVariableId || "").trim();
  if (existing && !/^YOUR_/i.test(existing) && state.project.statusVariableServerIssued) {
    return existing;
  }
  const variable = await cloudRequest("POST", `/sensors/${encodeURIComponent(sensorId)}/variables`, {
    label: key,
    data_type: "string"
  });
  state.project.statusVariableId = variable.id;
  state.project.statusVariableKey = variable.label || key;
  state.project.statusVariableServerIssued = true;
  return variable.id;
}

function syncStatusUuidControls() {
  const input = document.getElementById("status-variable-id");
  const toggle = document.getElementById("status-uuid-auto");
  const note = document.getElementById("status-uuid-hint");
  const genBtn = document.getElementById("btn-generate-status-uuid");
  if (!input) return;

  const auto = state.project.statusVariableAuto !== false;
  if (toggle) toggle.checked = auto;

  input.readOnly = auto;
  input.setAttribute("aria-readonly", auto ? "true" : "false");
  input.classList.toggle("is-auto", auto);
  if (input.value !== (state.project.statusVariableId || "")) {
    input.value = state.project.statusVariableId || "";
  }
  if (genBtn) {
    genBtn.disabled = auto;
    genBtn.style.opacity = auto ? "0.4" : "1";
    genBtn.title = auto
      ? "Auto mode is on — the UUID is issued by the server when you provision the device"
      : "Generate a status variable UUID";
  }

  if (note) {
    note.innerHTML = auto
      ? `Auto-generate is on: the node status variable (<code>${escapeHtmlText(state.project.statusVariableKey || "nodeStatus")}</code>, type <code>string</code>) is created on the gateway when you provision the device, and its UUID is written into the sketch automatically.`
      : `Manual mode: paste any existing <code>string</code> variable UUID from <strong>Cloud → Sensors → Variables</strong>, or press 🎲 to mint one locally.`;
  }
}

/* ---------------------------------------------------------------------------
   Command templates (Section 04) — schema identical to cloud_command_add.html
   --------------------------------------------------------------------------- */

function defaultCommandParameter(index, type) {
  return {
    param_name: index === 0 ? (type === "string" ? "message" : "value") : `param_${index + 1}`,
    param_type: type || "integer",
    is_required: true,
    param_order: index + 1,
    default_value: null
  };
}

/**
 * Add a command template row. When an actuator is supplied the template is seeded
 * from that actuator's parameter key so the two line up out of the box.
 */
function addBlankCommandRow(seed) {
  const source = seed || {};
  const actuator = source.actuator;
  const paramType = source.paramType || (actuator ? (actuator.paramType || inferActuatorParamType(
    ACTUATOR_CATALOG.find((c) => c.type === actuator.type)
  )) : "integer");
  const paramName = source.paramName || (actuator && actuator.varState) || "value";
  const name = source.name || (actuator ? `${actuator.name} Command` : `Command Template ${state.commands.length + 1}`);

  state.commands.push({
    id: "cmd_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name,
    description: source.description || (actuator ? `Controls ${actuator.name}` : "Cloud command template generated by the studio"),
    parameters: [{
      param_name: paramName,
      param_type: paramType,
      is_required: true,
      param_order: 1,
      default_value: null
    }],
    targetActuatorId: actuator ? actuator.id : "",
    serverId: "",
    serverIssued: false
  });

  renderCommandsList();
  persistStudioState();
  updateStudio();
  showToast(source.name ? `Command template created for ${source.name}` : "Command template added — define its parameters, then push to the cloud");
}

/** Command template names are per-device; keep them distinguishable. */
function uniqueCommandName(base) {
  const used = state.commands.map((c) => c.name);
  if (!used.includes(base)) return base;
  let counter = 2;
  while (used.includes(`${base} ${counter}`)) counter++;
  return `${base} ${counter}`;
}

/**
 * Bind a command template to the actuator it should drive.
 *
 * The link is stored on both sides so each view can render it without a reverse
 * lookup: `cmd.targetActuatorId` (which output this template drives) and
 * `actuator.commandId` / `actuator.templateId` (which template is wired into the
 * generated processCommand() branch for that output).
 *
 * Passing an empty actuatorId unbinds the template without deleting it, which is
 * how a template can exist purely for rule dispatch.
 */
function bindCommandToActuator(cmd, actuatorId) {
  if (!cmd) return;

  const previousActuatorId = cmd.targetActuatorId || "";

  // Release a previous binding when the target moves or is cleared.
  if (previousActuatorId && previousActuatorId !== actuatorId) {
    const previous = state.actuators.find((a) => a.id === previousActuatorId);
    if (previous && previous.commandId === cmd.id) {
      previous.commandId = "";
      if (cmd.serverId && previous.templateId === cmd.serverId) previous.templateId = "";
    }
  }

  if (!actuatorId) {
    cmd.targetActuatorId = "";
    showToast("Template unbound — it can still be dispatched by a cloud rule");
    return;
  }

  const actuator = state.actuators.find((a) => a.id === actuatorId);
  if (!actuator) return;

  // An actuator drives one template at a time, so drop any previous link.
  if (actuator.commandId && actuator.commandId !== cmd.id) {
    const stale = state.commands.find((c) => c.id === actuator.commandId);
    if (stale && stale.targetActuatorId === actuator.id) stale.targetActuatorId = "";
  }

  cmd.targetActuatorId = actuator.id;
  actuator.commandId = cmd.id;

  // The first template parameter is the value the firmware reads from the
  // incoming parametersJson, so mirror it onto the actuator that will read it.
  const firstParam = cmd.parameters && cmd.parameters[0];
  if (firstParam) {
    actuator.varState = firstParam.param_name;
    actuator.paramType = firstParam.param_type;

    // Seed the response mapping from what the template actually sends: a boolean
    // parameter behaves as ON/OFF, a numeric one correlates on an analogue output
    // and becomes a threshold on a digital one.
    if (!actuator.response) {
      const range = getActuatorOutputRange(actuator);
      const isAnalogue = range.kind === "pwm" || range.kind === "servo";
      patchResponseMap(actuator, {
        mode: firstParam.param_type === "boolean" ? "direct" : (isAnalogue ? "scale" : "threshold")
      });
    }
  }

  // Normalise, so a blueprint written before this feature - or one restored from
  // an exported JSON - still has every field the card and firmware expect.
  patchResponseMap(actuator, {});


  // Only a pushed template has an id the device can match on.
  if (cmd.serverId) actuator.templateId = cmd.serverId;

  showToast(`${cmd.name} now drives ${actuator.name}`);
}

/**
 * "Create template" on an actuator card: mint a command template that is already
 * bound to that output, seeded from its parameter key and type so the generated
 * firmware dispatch matches without further editing.
 */
function createCommandForActuator(actuator) {
  if (!actuator) return;
  const catalogItem = ACTUATOR_CATALOG.find((c) => c.id === actuator.catalogId || c.type === actuator.type);
  const paramType = actuator.paramType || inferActuatorParamType(catalogItem);
  const paramName = actuator.varState || "value";

  const before = state.commands.length;
  addBlankCommandRow({
    actuator,
    name: uniqueCommandName(`${actuator.name} Command`),
    paramName,
    paramType,
    description: `Drives ${actuator.name} on ${state.project.name || "this node"}`
  });

  const created = state.commands[state.commands.length - 1];
  if (state.commands.length > before && created) {
    bindCommandToActuator(created, actuator.id);
    renderCommandsList();
    renderActuatorsList();
    updateStudio();
  }
}

function renderCommandsList() {
  const container = document.getElementById("commands-container");
  if (!container) return;

  if (state.commands.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        No command templates yet. Press <strong>Add Command</strong> below, or press <em>Create template</em> on an
        actuator card to generate one already bound to that output.
      </div>
    `;
    return;
  }

  container.innerHTML = state.commands.map((cmd) => {
    const actuator = state.actuators.find((a) => a.id === cmd.targetActuatorId);
    const actuatorChoices = state.actuators.map((a) => {
      const takenByOther = a.commandId && a.commandId !== cmd.id;
      return `<option value="${escapeHtmlText(a.id)}" ${a.id === cmd.targetActuatorId ? "selected" : ""}>` +
        `${escapeHtmlText(a.name)} (${escapeHtmlText(a.type)})${takenByOther ? " — bound elsewhere" : ""}</option>`;
    }).join("");
    const paramRows = cmd.parameters.map((param, index) => `
      <div class="param-row" data-cmd="${cmd.id}" data-index="${index}">
        <input type="text" class="param-input" value="${escapeHtmlText(param.param_name)}" data-action="cmd-param-name" data-id="${cmd.id}" data-index="${index}" placeholder="e.g. speed">
        <select class="param-input" data-action="cmd-param-type" data-id="${cmd.id}" data-index="${index}">
          ${["integer", "float", "string", "boolean"].map((t) => `<option value="${t}" ${param.param_type === t ? "selected" : ""}>${t}</option>`).join("")}
        </select>
        <label class="inline-toggle param-required">
          <input type="checkbox" data-action="cmd-param-required" data-id="${cmd.id}" data-index="${index}" ${param.is_required ? "checked" : ""}>
          <span>required</span>
        </label>
        <span class="param-order">#${param.param_order}</span>
        <button type="button" class="btn-remove-item btn-remove-param" data-action="cmd-param-remove" data-id="${cmd.id}" data-index="${index}" title="Remove parameter">✕</button>
      </div>
    `).join("");

    return `
      <div class="item-card command-card" data-id="${cmd.id}">
        <div class="item-icon command-icon">
          <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" stroke-width="1.8" fill="none">
            <rect x="2" y="4" width="20" height="6" rx="2"></rect>
            <line x1="6" y1="7" x2="6.01" y2="7"></line>
            <path d="M5 14l3 3-3 3"></path>
            <line x1="12" y1="20" x2="19" y2="20"></line>
          </svg>
        </div>
        <div class="item-details">
          <input type="text" class="item-name-input" value="${escapeHtmlText(cmd.name)}" data-action="cmd-name" data-id="${cmd.id}" placeholder="Template name">
          <input type="text" class="item-sub-input" value="${escapeHtmlText(cmd.description)}" data-action="cmd-description" data-id="${cmd.id}" placeholder="Description (optional)">
          <div class="item-meta">
            <span>Params: <strong>${cmd.parameters.length}</strong></span>
            <span>•</span>
            <span>Bound actuator: <strong>${actuator ? escapeHtmlText(actuator.name) : "—"}</strong></span>
            <span>•</span>
            <span class="sync-chip ${cmd.serverIssued ? "is-synced" : "is-unsynced"}">${cmd.serverIssued ? "template issued" : "awaiting push"}</span>
          </div>

          <!-- Bind this template to the actuator it should drive. -->
          <div class="rule-field">
            <span>Drives actuator</span>
            <select data-action="cmd-target-actuator" data-id="${cmd.id}">
              <option value="" ${cmd.targetActuatorId ? "" : "selected"}>— unbound (template only) —</option>
              ${actuatorChoices}
            </select>
          </div>

          <div class="uuid-input-group" title="Cloud command template UUID (CloudCommand.templateId)">
            <span class="uuid-input-label">ID:</span>
            <input type="text" class="item-uuid-input" readonly value="${escapeHtmlText(cmd.serverId || "")}" placeholder="server-issued on push">
            <button type="button" class="btn-copy-mini ${cmd.serverIssued ? "" : "is-empty"}" data-action="copy-command-id" data-id="${cmd.id}" title="Copy the template id">📋</button>
          </div>
          <div class="param-list">${paramRows}</div>
          <button type="button" class="btn-chip" data-action="cmd-param-add" data-id="${cmd.id}">+ Add parameter</button>
        </div>
        <button class="btn-remove-item" data-action="remove-command" data-id="${cmd.id}" title="Remove Command Template">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>
    `;
  }).join("");

  bindCommandCardEvents(container);
}

function bindCommandCardEvents(container) {
  const find = (el) => state.commands.find((c) => c.id === el.dataset.id);
  const findParam = (el) => {
    const cmd = find(el);
    const index = parseInt(el.dataset.index, 10);
    if (!cmd || !cmd.parameters[index]) return null;
    return { cmd, param: cmd.parameters[index], index };
  };
  const refresh = () => { renderCommandsList(); persistStudioState(); updateStudio(); };

  container.querySelectorAll('[data-action="cmd-name"]').forEach((el) => {
    el.addEventListener("input", (e) => { const c = find(e.target); if (c) { c.name = e.target.value; persistStudioState(); } });
  });

  container.querySelectorAll('[data-action="cmd-description"]').forEach((el) => {
    el.addEventListener("input", (e) => { const c = find(e.target); if (c) { c.description = e.target.value; persistStudioState(); } });
  });

  container.querySelectorAll('[data-action="cmd-param-name"]').forEach((el) => {
    el.addEventListener("input", (e) => {
      const found = findParam(e.target);
      if (!found) return;
      found.param.param_name = e.target.value.replace(/[^a-zA-Z0-9_]/g, "");
      persistStudioState();
    });
  });

  container.querySelectorAll('[data-action="cmd-param-type"]').forEach((el) => {
    el.addEventListener("change", (e) => {
      const found = findParam(e.target);
      if (found) { found.param.param_type = e.target.value; refresh(); }
    });
  });

  container.querySelectorAll('[data-action="cmd-param-required"]').forEach((el) => {
    el.addEventListener("change", (e) => {
      const found = findParam(e.target);
      if (found) { found.param.is_required = e.target.checked; persistStudioState(); }
    });
  });

  container.querySelectorAll('[data-action="cmd-target-actuator"]').forEach((el) => {
    el.addEventListener("change", (e) => {
      const cmd = find(e.target);
      if (!cmd) return;
      bindCommandToActuator(cmd, e.target.value);
      renderCommandsList();
      renderActuatorsList();
      persistStudioState();
      updateStudio();
    });
  });

  container.querySelectorAll('[data-action="cmd-param-add"]').forEach((el) => {
    el.addEventListener("click", (e) => {
      const cmd = find(e.currentTarget);
      if (!cmd) return;
      cmd.parameters.push(defaultCommandParameter(cmd.parameters.length, cmd.parameters[0] ? cmd.parameters[0].param_type : "integer"));
      cmd.parameters.forEach((p, i) => { p.param_order = i + 1; });
      refresh();
    });
  });

  container.querySelectorAll('[data-action="cmd-param-remove"]').forEach((el) => {
    el.addEventListener("click", (e) => {
      const found = findParam(e.currentTarget);
      if (!found) return;
      if (found.cmd.parameters.length <= 1) { showToast("A command template needs at least one parameter"); return; }
      found.cmd.parameters.splice(found.index, 1);
      found.cmd.parameters.forEach((p, i) => { p.param_order = i + 1; });
      refresh();
    });
  });

  container.querySelectorAll('[data-action="copy-command-id"]').forEach((el) => {
    el.addEventListener("click", (e) => {
      const cmd = find(e.currentTarget);
      if (!cmd || !cmd.serverId) { showToast("No template id yet — push the commands to the cloud first"); return; }
      copyTextToClipboard(cmd.serverId, "Command template id copied");
    });
  });

  container.querySelectorAll('[data-action="remove-command"]').forEach((el) => {
    el.addEventListener("click", (e) => {
      const cmd = find(e.currentTarget);
      state.commands = state.commands.filter((c) => c.id !== e.currentTarget.dataset.id);
      if (cmd) {
        state.actuators.forEach((a) => {
          const linkedByRef = a.commandId === cmd.id || a.id === cmd.targetActuatorId;
          const linkedByTemplate = !!cmd.serverId && a.templateId === cmd.serverId;
          if (linkedByRef || linkedByTemplate) {
            a.commandId = "";
            // Only clear an id this template issued; keep a manually pasted one.
            if (linkedByTemplate) a.templateId = "";
          }
        });
      }
      renderActuatorsList();
      refresh();
      showToast("Command template removed");
    });
  });
}

/* ---------------------------------------------------------------------------
   Cloud rules (Section 05) — schema identical to cloud_rules.html
   --------------------------------------------------------------------------- */

const RULE_OPERATORS = [
  { value: ">", label: "Greater than (>)" },
  { value: "<", label: "Less than (<)" },
  { value: ">=", label: "Greater or Equal (>=)" },
  { value: "<=", label: "Less or Equal (<=)" },
  { value: "==", label: "Equal (==)" },
  { value: "!=", label: "Not Equal (!=)" }
];

const RULE_ACTION_TYPES = [
  { value: "send_alert", label: "Send Alert Notification" },
  { value: "dispatch_command", label: "Dispatch Command Template" },
  { value: "reject_fake_data", label: "Reject Outlier & Fake Data" },
  { value: "log_anomaly", label: "Log Data Anomaly Warning" }
];

function addBlankCloudRuleRow() {
  const firstSensor = state.sensors[0];
  const firstKey = firstSensor ? getSensorTelemetryKeys(firstSensor)[0] : "";
  state.cloudRules.push({
    id: "crule_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name: `Rule ${state.cloudRules.length + 1}`,
    sensorId: firstSensor ? firstSensor.id : "",
    telemetryKey: firstKey || "",
    variable_id: firstSensor ? (getSensorVariableIds(firstSensor)[0] || {}).value || "" : "",
    operator: ">",
    threshold: 30,
    action_type: "send_alert",
    alert_message: "Threshold breached — check the node.",
    template_id: "",
    alert_channels: ["email"],
    enabled: true,
    serverId: "",
    serverIssued: false
  });
  renderCloudRulesList();
  persistStudioState();
  updateStudio();
  showToast("Cloud rule added — bind a variable, an operator and an action, then push to the cloud");
}

function renderCloudRulesList() {
  const container = document.getElementById("cloud-rules-container");
  if (!container) return;

  if (state.cloudRules.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        No cloud rules yet. Press <strong>Add Rule</strong> at the end of this section to create one.
        Rules run on the platform against incoming telemetry and need the <code>rule_engine_enabled</code> entitlement.
      </div>
    `;
    return;
  }

  // Every sensor variable is a valid rule target.
  const variableOptions = [];
  state.sensors.forEach((s) => {
    const keys = getSensorTelemetryKeys(s);
    getSensorVariableIds(s).forEach((entry, index) => {
      variableOptions.push({
        value: entry.value || "",
        label: `${s.name} → ${keys[index] || entry.role}`,
        sensorId: s.id,
        telemetryKey: keys[index] || ""
      });
    });
  });

  container.innerHTML = state.cloudRules.map((rule) => {
    const targetOptions = variableOptions.map((v) => {
      const selected = v.value && v.value === rule.variable_id;
      return `<option value="${escapeHtmlText(v.value)}" ${selected ? "selected" : ""} data-sensor="${escapeHtmlText(v.sensorId)}" data-key="${escapeHtmlText(v.telemetryKey)}">${escapeHtmlText(v.label)}${v.value ? "" : " (not pushed yet)"}</option>`;
    }).join("");

    const templateOptions = state.commands.map((c) => {
      const value = c.serverId || "";
      return `<option value="${escapeHtmlText(value)}" ${value && value === rule.template_id ? "selected" : ""}>${escapeHtmlText(c.name)}${value ? "" : " (not pushed yet)"}</option>`;
    }).join("");

    const needsAlert = ["send_alert", "reject_fake_data", "log_anomaly"].includes(rule.action_type);
    const needsTemplate = rule.action_type === "dispatch_command";
    const targetLabel = variableOptions.find((v) => v.value && v.value === rule.variable_id);
    const actionLabel = (RULE_ACTION_TYPES.find((a) => a.value === rule.action_type) || RULE_ACTION_TYPES[0]).label;

    // One-line human summary so the compact row is still readable at a glance.
    const summary = `IF ${targetLabel ? targetLabel.label : "a variable"} ${escapeHtmlText(rule.operator)} ${escapeHtmlText(String(rule.threshold))} → ${escapeHtmlText(actionLabel)}`;

    return `
      <div class="item-card rule-card" data-id="${rule.id}">
        <div class="item-icon rule-icon">
          <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" stroke-width="1.8" fill="none">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
          </svg>
        </div>
        <div class="item-details">
          <input type="text" class="item-name-input" value="${escapeHtmlText(rule.name)}" data-action="crule-name" data-id="${rule.id}" placeholder="Rule name">

          <div class="item-meta">
            <span>${summary}</span>
            <span>•</span>
            <span class="sync-chip ${rule.serverIssued ? "is-synced" : "is-unsynced"}">${rule.serverIssued ? "rule active" : "awaiting push"}</span>
          </div>

          <!-- Condition + action on one compact row, like a command parameter row -->
          <div class="rule-expr">
            <span class="rule-expr-key">IF</span>
            <select class="param-input rule-expr-target" data-action="crule-variable" data-id="${rule.id}" title="Target telemetry variable" aria-label="Target variable">
              <option value="">— select a pushed variable —</option>
              ${targetOptions}
            </select>
            <select class="param-input rule-expr-op" data-action="crule-operator" data-id="${rule.id}" title="Comparison operator" aria-label="Operator">
              ${RULE_OPERATORS.map((op) => `<option value="${op.value}" ${rule.operator === op.value ? "selected" : ""}>${op.value}</option>`).join("")}
            </select>
            <input type="number" step="any" class="param-input rule-expr-threshold" value="${rule.threshold}" data-action="crule-threshold" data-id="${rule.id}" title="Threshold value" aria-label="Threshold" placeholder="value">
            <span class="rule-expr-key">THEN</span>
            <select class="param-input rule-expr-action" data-action="crule-action-type" data-id="${rule.id}" title="Action performed when the condition is met" aria-label="Action type">
              ${RULE_ACTION_TYPES.map((a) => `<option value="${a.value}" ${rule.action_type === a.value ? "selected" : ""}>${a.label}</option>`).join("")}
            </select>
          </div>

          ${(needsAlert || needsTemplate) ? `
          <!-- Action payload: an alert message or the template to dispatch -->
          <div class="rule-action-row">
            ${needsAlert ? `
            <span class="rule-expr-key">MSG</span>
            <input type="text" class="param-input rule-action-input" value="${escapeHtmlText(rule.alert_message)}" data-action="crule-message" data-id="${rule.id}" placeholder="Alert message / action note" title="Message recorded by the platform when this rule fires" aria-label="Alert message">
            ` : ""}
            ${needsTemplate ? `
            <span class="rule-expr-key">CMD</span>
            <select class="param-input rule-action-input" data-action="crule-template" data-id="${rule.id}" title="Command template dispatched when the condition is met" aria-label="Command template">
              <option value="">— select a pushed template —</option>
              ${templateOptions}
            </select>
            ` : ""}
          </div>
          ` : ""}

          <div class="rule-flags">
            <label class="inline-toggle" title="Enable or pause this rule">
              <input type="checkbox" data-action="crule-enabled" data-id="${rule.id}" ${rule.enabled !== false ? "checked" : ""}>
              <span>Enabled</span>
            </label>
            <label class="inline-toggle" title="Send alerts by email">
              <input type="checkbox" data-action="crule-email" data-id="${rule.id}" ${(rule.alert_channels || []).includes("email") ? "checked" : ""}>
              <span>Email</span>
            </label>
            <label class="inline-toggle" title="Send alerts to your webhooks">
              <input type="checkbox" data-action="crule-webhook" data-id="${rule.id}" ${(rule.alert_channels || []).includes("webhook") ? "checked" : ""}>
              <span>Webhook</span>
            </label>
            <span class="rule-channels">Channels: <strong>${escapeHtmlText((rule.alert_channels || ["email"]).join(", "))}</strong></span>
          </div>
        </div>
        <button class="btn-remove-item" data-action="remove-cloud-rule" data-id="${rule.id}" title="Remove Rule">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>
    `;
  }).join("");

  bindCloudRuleCardEvents(container);
}

function bindCloudRuleCardEvents(container) {
  const find = (el) => state.cloudRules.find((r) => r.id === el.dataset.id);
  const refresh = () => { renderCloudRulesList(); persistStudioState(); updateStudio(); };

  container.querySelectorAll('[data-action="crule-name"]').forEach((el) => {
    el.addEventListener("input", (e) => { const r = find(e.target); if (r) { r.name = e.target.value; persistStudioState(); } });
  });

  container.querySelectorAll('[data-action="crule-variable"]').forEach((el) => {
    el.addEventListener("change", (e) => {
      const r = find(e.target);
      if (!r) return;
      const opt = e.target.selectedOptions[0];
      r.variable_id = e.target.value;
      r.sensorId = opt ? opt.dataset.sensor || "" : "";
      r.telemetryKey = opt ? opt.dataset.key || "" : "";
      persistStudioState();
      updateStudio();
    });
  });

  container.querySelectorAll('[data-action="crule-operator"]').forEach((el) => {
    el.addEventListener("change", (e) => { const r = find(e.target); if (r) { r.operator = e.target.value; persistStudioState(); } });
  });

  container.querySelectorAll('[data-action="crule-threshold"]').forEach((el) => {
    el.addEventListener("change", (e) => {
      const r = find(e.target);
      if (!r) return;
      const value = parseFloat(e.target.value);
      r.threshold = Number.isFinite(value) ? value : 0;
      persistStudioState();
    });
  });

  container.querySelectorAll('[data-action="crule-action-type"]').forEach((el) => {
    el.addEventListener("change", (e) => {
      const r = find(e.target);
      if (r) { r.action_type = e.target.value; refresh(); }
    });
  });

  container.querySelectorAll('[data-action="crule-message"]').forEach((el) => {
    el.addEventListener("input", (e) => { const r = find(e.target); if (r) { r.alert_message = e.target.value; persistStudioState(); } });
  });

  container.querySelectorAll('[data-action="crule-template"]').forEach((el) => {
    el.addEventListener("change", (e) => { const r = find(e.target); if (r) { r.template_id = e.target.value; persistStudioState(); } });
  });

  container.querySelectorAll('[data-action="crule-enabled"]').forEach((el) => {
    el.addEventListener("change", (e) => { const r = find(e.target); if (r) { r.enabled = e.target.checked; persistStudioState(); } });
  });

  ["email", "webhook"].forEach((channel) => {
    container.querySelectorAll(`[data-action="crule-${channel}"]`).forEach((el) => {
      el.addEventListener("change", (e) => {
        const r = find(e.target);
        if (!r) return;
        const channels = new Set(r.alert_channels || ["email"]);
        if (e.target.checked) channels.add(channel); else channels.delete(channel);
        r.alert_channels = Array.from(channels);
        renderCloudRulesList();
        persistStudioState();
      });
    });
  });

  container.querySelectorAll('[data-action="remove-cloud-rule"]').forEach((el) => {
    el.addEventListener("click", (e) => {
      state.cloudRules = state.cloudRules.filter((r) => r.id !== e.currentTarget.dataset.id);
      refresh();
      showToast("Cloud rule removed");
    });
  });
}

/* ---------------------------------------------------------------------------
   Push pipelines — one per section, plus a full end-to-end run
   --------------------------------------------------------------------------- */

/**
 * Push every sensor and its telemetry keys, then capture the server-issued
 * sensor ids and variable_ids onto the cards.
 *
 * Ordering matters: variables are children of a sensor, and a rule needs the
 * variable id, so sensors must be pushed before rules.
 */
async function pushSensorsToCloud(opts) {
  const options = opts || {};
  const silent = !!options.silent;
  const deviceId = requireDeviceIdForProvisioning();

  if (!deviceId) {
    setSectionStatus("sensors-push-status", "Register the device first (Section 02 → <strong>Add Device</strong>) so sensors have a parent device.", "is-error");
    if (!silent) showToast("Register the device before pushing sensors");
    return { ok: false, created: 0, failed: 0 };
  }
  if (state.sensors.length === 0) {
    setSectionStatus("sensors-push-status", "No sensors to push.", "is-success");
    return { ok: true, created: 0, failed: 0 };
  }

  const btn = document.getElementById("btn-push-sensors");
  if (btn) { btn.disabled = true; btn.classList.add("is-busy"); }
  setSectionStatus("sensors-push-status", "Pushing sensors and variables…", "is-pending");

  let created = 0;
  let failed = 0;
  const errors = [];

  for (const sensor of state.sensors) {
    try {
      // 1. Sensor container (name / unit / description).
      if (!sensor.sensorId) {
        const payload = {
          name: (sensor.name || "Sensor").slice(0, 120),
          unit: sensor.unit && sensor.unit !== "val" ? sensor.unit : "",
          description: `${sensor.type.toUpperCase()} sensor routed to GPIO ${sensor.pin}${normalizeRandomConfig(sensor).enabled ? " | randomized data generator" : ""}`
        };
        const createdSensor = await cloudRequest("POST", `/devices/${encodeURIComponent(deviceId)}/sensors`, payload);
        sensor.sensorId = createdSensor.id;
      }

      // 2. One variable per cloud slot, keeping the editable telemetry keys.
      const slots = [];
      if (sensor.type === "dht22" || sensor.type === "dht11") {
        slots.push(
          { role: "primary", label: sensor.varTemp || "temperature", dataType: sensor.dataTypeTemp || "float" },
          { role: "secondary", label: sensor.varHum || "humidity", dataType: sensor.dataTypeHum || "float" }
        );
      } else if (sensor.type === "bmp280") {
        slots.push(
          { role: "primary", label: sensor.varTemp || "baroTemp", dataType: sensor.dataTypeTemp || "float" },
          { role: "secondary", label: sensor.varPress || "baroPress", dataType: sensor.dataTypePress || "float" }
        );
      } else {
        slots.push({ role: "primary", label: sensor.varVal || "value", dataType: sensor.dataType || "float" });
      }

      sensor.variableIds = sensor.variableIds || {};
      for (const slot of slots) {
        if (sensor.variableIds[slot.role] && !/^YOUR_/i.test(sensor.variableIds[slot.role])) continue;
        const variable = await cloudRequest("POST", `/sensors/${encodeURIComponent(sensor.sensorId)}/variables`, {
          label: slugifyTelemetryKey(slot.label),
          data_type: slot.dataType
        });
        sensor.variableIds[slot.role] = variable.id;
        // Reflect the canonical server label back onto the editable key field.
        if (slot.role === "primary") assignPrimaryTelemetryKey(sensor, variable.label || slot.label);
        else if (sensor.type === "bmp280") sensor.varPress = variable.label || slot.label;
        else sensor.varHum = variable.label || slot.label;
      }

      created++;
    } catch (err) {
      failed++;
      errors.push(`${sensor.name}: ${err.message}${err.code ? ` [${err.code}]` : ""}`);
    }
  }

  if (btn) { btn.disabled = false; btn.classList.remove("is-busy"); }
  renderSensorsList();
  renderCloudRulesList();
  persistStudioState();
  updateStudio();

  if (failed === 0) {
    setSectionStatus("sensors-push-status", `<strong>${created} sensor(s)</strong> synced — every <code>variable_id</code> is now bound.`, "is-success");
    if (!silent) showToast(`${created} sensor(s) pushed to the cloud`);
  } else {
    setSectionStatus("sensors-push-status", `${created} synced, <strong>${failed} failed</strong>: ${escapeHtmlText(errors.join(" • "))}`, "is-error");
    if (!silent) showToast(`${failed} sensor(s) failed to push`);
  }

  return { ok: failed === 0, created, failed, errors };
}

/**
 * Auto-mode status variable. Because the API nests variables under a sensor, a
 * dedicated "Node Status" sensor is created to host it — which is exactly how
 * the demo sketches expect the string status variable to be published.
 */
async function pushStatusVariable(deviceId) {
  if (state.project.statusVariableAuto === false) return state.project.statusVariableId || "";

  const current = (state.project.statusVariableId || "").trim();
  if (current && !/^YOUR_/i.test(current) && state.project.statusVariableServerIssued) return current;

  const key = slugifyTelemetryKey(state.project.statusVariableKey || "nodeStatus");

  if (!state.project.statusSensorId) {
    const sensor = await cloudRequest("POST", `/devices/${encodeURIComponent(deviceId)}/sensors`, {
      name: "Node Status",
      unit: "",
      description: "Hosts the device health/status string variable published by every heartbeat"
    });
    state.project.statusSensorId = sensor.id;
  }

  const variable = await cloudRequest("POST", `/sensors/${encodeURIComponent(state.project.statusSensorId)}/variables`, {
    label: key,
    data_type: "string"
  });

  state.project.statusVariableId = variable.id;
  state.project.statusVariableKey = variable.label || key;
  state.project.statusVariableServerIssued = true;
  syncStatusUuidControls();
  return variable.id;
}

/**
 * Push command templates. Parameters are sent verbatim in the main project's
 * schema, and each template is bound back to its actuator so the generated
 * processCommand() can match on templateId.
 */
async function pushCommandsToCloud(opts) {
  const options = opts || {};
  const silent = !!options.silent;
  const deviceId = requireDeviceIdForProvisioning();

  if (!deviceId) {
    setSectionStatus("commands-push-status", "Register the device first (Section 02 → <strong>Add Device</strong>).", "is-error");
    if (!silent) showToast("Register the device before pushing commands");
    return { ok: false, created: 0, failed: 0 };
  }
  if (state.commands.length === 0) {
    setSectionStatus("commands-push-status", "No command templates to push.", "is-success");
    return { ok: true, created: 0, failed: 0 };
  }

  const btn = document.getElementById("btn-push-commands");
  if (btn) { btn.disabled = true; btn.classList.add("is-busy"); }
  setSectionStatus("commands-push-status", "Pushing command templates…", "is-pending");

  let created = 0;
  let failed = 0;
  const errors = [];

  for (const cmd of state.commands) {
    try {
      const name = (cmd.name || "").trim();
      if (name.length < 3) throw new Error("Template name must be at least 3 characters");

      const parameters = cmd.parameters.map((param, index) => {
        const paramName = (param.param_name || "").trim();
        if (!paramName) throw new Error(`Parameter ${index + 1} needs a name`);
        return {
          param_name: paramName,
          param_type: param.param_type || "integer",
          is_required: param.is_required !== false,
          param_order: index + 1,
          default_value: param.default_value === undefined ? null : param.default_value
        };
      });

      if (cmd.serverIssued && cmd.serverId) {
        // Already registered — keep the id, just refresh the local binding.
      } else {
        const template = await cloudRequest("POST", `/devices/${encodeURIComponent(deviceId)}/command-templates`, {
          name,
          description: (cmd.description || "").trim(),
          parameters
        });
        cmd.serverId = template.id;
        cmd.serverIssued = true;
      }

      // Bind the template to its actuator so firmware dispatch lines up.
      if (cmd.targetActuatorId) {
        const actuator = state.actuators.find((a) => a.id === cmd.targetActuatorId);
        if (actuator) {
          actuator.templateId = cmd.serverId;
          actuator.commandId = cmd.id;
          actuator.varState = parameters[0].param_name;
          actuator.paramType = parameters[0].param_type;
        }
      }

      created++;
    } catch (err) {
      failed++;
      errors.push(`${cmd.name || "template"}: ${err.message}${err.code ? ` [${err.code}]` : ""}`);
    }
  }

  if (btn) { btn.disabled = false; btn.classList.remove("is-busy"); }
  renderCommandsList();
  renderActuatorsList();
  renderCloudRulesList();
  persistStudioState();
  updateStudio();

  if (failed === 0) {
    setSectionStatus("commands-push-status", `<strong>${created} template(s)</strong> registered and bound to their actuators.`, "is-success");
    if (!silent) showToast(`${created} command template(s) pushed`);
  } else {
    setSectionStatus("commands-push-status", `${created} registered, <strong>${failed} failed</strong>: ${escapeHtmlText(errors.join(" • "))}`, "is-error");
    if (!silent) showToast(`${failed} command template(s) failed`);
  }

  return { ok: failed === 0, created, failed, errors };
}

/**
 * Push server-side rules. Every rule needs a real variable_id and, for
 * dispatch_command, a pushed template id — both are validated before the call so
 * the user gets a precise message instead of a bare 400.
 */
async function pushRulesToCloud(opts) {
  const options = opts || {};
  const silent = !!options.silent;
  const deviceId = requireDeviceIdForProvisioning();

  if (!deviceId) {
    setSectionStatus("rules-push-status", "Register the device first (Section 02 → <strong>Add Device</strong>).", "is-error");
    if (!silent) showToast("Register the device before pushing rules");
    return { ok: false, created: 0, failed: 0 };
  }
  if (state.cloudRules.length === 0) {
    setSectionStatus("rules-push-status", "No cloud rules to push.", "is-success");
    return { ok: true, created: 0, failed: 0 };
  }

  const btn = document.getElementById("btn-push-rules");
  if (btn) { btn.disabled = true; btn.classList.add("is-busy"); }
  setSectionStatus("rules-push-status", "Pushing cloud rules…", "is-pending");

  let created = 0;
  let failed = 0;
  const errors = [];

  for (const rule of state.cloudRules) {
    try {
      const name = (rule.name || "").trim();
      if (name.length < 3) throw new Error("Rule name must be at least 3 characters");
      if (!rule.variable_id || /^YOUR_/i.test(rule.variable_id)) {
        throw new Error("Target variable has no server-issued variable_id — push the sensors first");
      }
      const threshold = parseFloat(rule.threshold);
      if (!Number.isFinite(threshold)) throw new Error("Threshold must be a valid number");
      if (rule.action_type === "dispatch_command" && (!rule.template_id || /^YOUR_/i.test(rule.template_id))) {
        throw new Error("Dispatch Command needs a pushed command template");
      }

      const payload = {
        name,
        variable_id: rule.variable_id,
        operator: rule.operator || ">",
        threshold,
        action_type: rule.action_type || "send_alert",
        alert_message: rule.alert_message || "",
        alert_channels: (rule.alert_channels && rule.alert_channels.length) ? rule.alert_channels : ["email"],
        enabled: rule.enabled !== false
      };
      if (rule.action_type === "dispatch_command") payload.template_id = rule.template_id;

      const createdRule = await cloudRequest("POST", `/devices/${encodeURIComponent(deviceId)}/rules`, payload);
      rule.serverId = createdRule.id;
      rule.serverIssued = true;
      created++;
    } catch (err) {
      failed++;
      errors.push(`${rule.name || "rule"}: ${err.message}${err.code ? ` [${err.code}]` : ""}`);
    }
  }

  if (btn) { btn.disabled = false; btn.classList.remove("is-busy"); }
  renderCloudRulesList();
  persistStudioState();

  if (failed === 0) {
    setSectionStatus("rules-push-status", `<strong>${created} rule(s)</strong> active on the platform.`, "is-success");
    if (!silent) showToast(`${created} cloud rule(s) pushed`);
  } else {
    setSectionStatus("rules-push-status", `${created} active, <strong>${failed} failed</strong>: ${escapeHtmlText(errors.join(" • "))}`, "is-error");
    if (!silent) showToast(`${failed} rule(s) failed`);
  }

  return { ok: failed === 0, created, failed, errors };
}

/**
 * Full end-to-end provisioning in dependency order:
 *   device → sensors + variables → status variable → command templates → rules
 *
 * This is the single button a beginner needs: it leaves the device fully wired up
 * on the platform and the sketch holding nothing but real server-issued ids.
 */
async function provisionAllToCloud() {
  const btn = document.getElementById("btn-push-all");
  if (btn) { btn.disabled = true; btn.classList.add("is-busy"); }
  setSectionStatus("add-device-status", "Starting full provisioning…", "is-pending");

  const summary = [];
  try {
    // 1. Device — register one when none exists yet.
    if (!requireDeviceIdForProvisioning()) {
      await provisionDeviceOnServer();
      if (!requireDeviceIdForProvisioning()) {
        summary.push("Device registration did not complete — fix the error in Section 02 and retry.");
        throw new Error("Device not registered");
      }
    }
    summary.push(`Device ${state.project.deviceId} ready`);

    const deviceId = state.project.deviceId;

    // 2. Sensors + their variables.
    const sensorResult = await pushSensorsToCloud({ silent: true });
    summary.push(`Sensors: ${sensorResult.created} synced${sensorResult.failed ? `, ${sensorResult.failed} failed` : ""}`);

    // 3. Status variable (auto mode only).
    if (state.project.statusVariableAuto !== false) {
      try {
        await pushStatusVariable(deviceId);
        summary.push("Status variable issued");
      } catch (e) {
        summary.push(`Status variable failed: ${e.message}`);
      }
    }

    // 4. Command templates.
    const commandResult = await pushCommandsToCloud({ silent: true });
    summary.push(`Commands: ${commandResult.created} registered${commandResult.failed ? `, ${commandResult.failed} failed` : ""}`);

    // 5. Cloud rules.
    const ruleResult = await pushRulesToCloud({ silent: true });
    summary.push(`Rules: ${ruleResult.created} active${ruleResult.failed ? `, ${ruleResult.failed} failed` : ""}`);

    persistStudioState();
    updateStudio();

    const allOk = sensorResult.failed === 0 && commandResult.failed === 0 && ruleResult.failed === 0;
    setSectionStatus("add-device-status", `Provisioning complete — ${escapeHtmlText(summary.join(" • "))}`, allOk ? "is-success" : "is-error");
    showToast(allOk ? "Everything is provisioned on OmniTeq Cloud" : "Provisioning finished with some failures — check each section");
  } catch (err) {
    setSectionStatus("add-device-status", `Provisioning stopped: ${escapeHtmlText(err.message)}`, "is-error");
    showToast(err.message);
  } finally {
    if (btn) { btn.disabled = false; btn.classList.remove("is-busy"); }
  }
}

/**
 * Optional smoke test: publish one synthetic reading per pushed variable through
 * the public ingest API, so the user immediately sees data arriving. Uses the
 * device secret key from Section 02.
 */
async function sendTestTelemetry() {
  const deviceId = requireDeviceIdForProvisioning();
  const secretKey = (state.project.secretKey || "").trim();
  if (!deviceId || !secretKey || /^YOUR_/i.test(secretKey)) {
    showToast("Register the device to get a secret key before sending test telemetry");
    return;
  }

  const readings = [];
  state.sensors.forEach((sensor) => {
    getSensorVariableIds(sensor).forEach((entry) => {
      if (entry.value && !/^YOUR_/i.test(entry.value)) {
        readings.push({ variable_id: entry.value, value: 42, recorded_at: new Date().toISOString() });
      }
    });
  });
  if (state.project.statusVariableId && !/^YOUR_/i.test(state.project.statusVariableId)) {
    readings.push({ variable_id: state.project.statusVariableId, value: "RUNNING", recorded_at: new Date().toISOString() });
  }
  if (readings.length === 0) {
    showToast("No pushed variables yet — provision the device first");
    return;
  }

  try {
    await cloudRequest("POST", "/ingest/telemetry", { device_id: deviceId, secret_key: secretKey, readings }, { noAuth: true });
    showToast(`Test reading sent for ${readings.length} variable(s)`);
  } catch (err) {
    showToast(`Test telemetry failed: ${err.message}`);
  }
}

/* ---------------------------------------------------------------------------
   Init wiring for the new interactive surfaces
   --------------------------------------------------------------------------- */

/**
 * Section 01 — Status Variable UUID: auto (server-issued, read-only) vs manual.
 */
function initStatusUuidControls() {
  const input = document.getElementById("status-variable-id");
  const toggle = document.getElementById("status-uuid-auto");
  const genBtn = document.getElementById("btn-generate-status-uuid");
  const copyBtn = document.getElementById("btn-copy-status-uuid");

  if (toggle) {
    toggle.addEventListener("change", (e) => {
      state.project.statusVariableAuto = e.target.checked;
      if (e.target.checked) {
        // Auto mode: mint a placeholder UUID immediately so the sketch is valid,
        // then the gateway value replaces it on push.
        state.project.statusVariableServerIssued = false;
        if (!state.project.statusVariableId || /^YOUR_/i.test(state.project.statusVariableId)) {
          state.project.statusVariableId = generateUuidV4();
        }
        showToast("Status variable UUID will be issued by the server on provisioning");
      } else {
        showToast("Manual mode: edit or paste the status variable UUID yourself");
      }
      syncStatusUuidControls();
      updateStudio();
    });
  }

  if (input) {
    input.addEventListener("input", (e) => {
      if (state.project.statusVariableAuto !== false) return;
      state.project.statusVariableId = e.target.value.trim();
      state.project.statusVariableServerIssued = false;
      updateStudio();
    });
  }

  if (genBtn) {
    genBtn.addEventListener("click", () => {
      if (state.project.statusVariableAuto !== false) {
        showToast("Turn off auto-generate to mint a UUID manually");
        return;
      }
      state.project.statusVariableId = generateUuidV4();
      state.project.statusVariableServerIssued = false;
      syncStatusUuidControls();
      updateStudio();
      showToast("Status variable UUID generated");
    });
  }

  if (copyBtn) {
    copyBtn.addEventListener("click", () => {
      const value = state.project.statusVariableId || "";
      if (!value || /^YOUR_/i.test(value)) {
        showToast("No status variable UUID yet — enable auto mode or paste one");
        return;
      }
      copyTextToClipboard(value, "Status variable UUID copied");
    });
  }

  // Sensible first value: a real UUID so the generated sketch is never invalid.
  if (state.project.statusVariableAuto !== false && (!state.project.statusVariableId || /^YOUR_/i.test(state.project.statusVariableId))) {
    state.project.statusVariableId = generateUuidV4();
  }
  syncStatusUuidControls();
}

/** Section 04 — command templates: add/push controls. */
function initCommandHandlers() {
  const addBtn = document.getElementById("btn-add-command-row");
  if (addBtn) addBtn.addEventListener("click", () => addBlankCommandRow());

  const pushBtn = document.getElementById("btn-push-commands");
  if (pushBtn) pushBtn.addEventListener("click", () => { pushCommandsToCloud(); });

  renderCommandsList();
}

/** Section 05 — cloud rule engine: add/push controls. */
function initCloudRuleHandlers() {
  const addBtn = document.getElementById("btn-add-cloud-rule-row");
  if (addBtn) addBtn.addEventListener("click", () => addBlankCloudRuleRow());

  const pushBtn = document.getElementById("btn-push-rules");
  if (pushBtn) pushBtn.addEventListener("click", () => { pushRulesToCloud(); });

  renderCloudRulesList();
}

/**
 * Resolve where the header "Back" control should send the user: the same-origin
 * console page that opened the studio when there is one, otherwise the project
 * view for the active project, otherwise the dashboard. history.back() is not
 * used because a deep link opened in a new tab has no in-app history.
 */
function resolveConsoleReturnUrl() {
  const fallback = (state.project && state.project.projectId)
    ? `../cloud_project_view.html?id=${encodeURIComponent(state.project.projectId)}`
    : "../cloud_dashboard.html";
  try {
    const ref = document.referrer;
    if (ref) {
      const u = new URL(ref);
      if (u.origin === window.location.origin && /\/(cloud_[a-z_]+\.html)$/i.test(u.pathname)) {
        return ref;
      }
    }
  } catch (e) { /* ignore malformed referrer */ }
  return fallback;
}

function initBackButton() {
  const btn = document.getElementById("btn-back-console");
  if (!btn) return;
  const refresh = () => { btn.href = resolveConsoleReturnUrl(); };
  refresh();
  btn.addEventListener("click", (e) => {
    // Modified clicks (new tab / middle click) keep native link behaviour.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    window.location.href = resolveConsoleReturnUrl();
  });
  // Re-resolve once the project context has been loaded from the gateway.
  window.addEventListener("load", refresh);
}

/**
 * Bug 8 — dismissible JSON-backup guidance strip. The preference is stored in
 * localStorage so the hint does not reappear on every visit.
 */
function initJsonHint() {
  const hint = document.getElementById("studio-json-hint");
  if (!hint) return;
  const DISMISS_KEY = "omniteq_studio_json_hint_dismissed";
  try {
    if (localStorage.getItem(DISMISS_KEY) === "1") { hint.classList.add("is-hidden"); return; }
  } catch (e) { /* private mode: show it */ }
  const closeBtn = document.getElementById("studio-json-hint-close");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      hint.classList.add("is-hidden");
      try { localStorage.setItem(DISMISS_KEY, "1"); } catch (e) { /* ignore */ }
    });
  }
}

/**
 * PHASE 4 — shared light/dark theme for the studio. Uses the same
 * localStorage key as the console so the preference is consistent across the
 * whole product.
 */
function initStudioTheme() {
  const btn = document.getElementById("btn-studio-theme");
  const root = document.documentElement;
  const apply = (theme) => {
    const isDark = theme === "dark";
    root.setAttribute("data-theme", theme);
    root.classList.toggle("theme-dark", isDark);
    root.classList.toggle("theme-light", !isDark);
    root.style.colorScheme = theme;
    if (btn) btn.title = isDark ? "Switch to light theme" : "Switch to dark theme";
  };
  let saved = "light";
  try { saved = localStorage.getItem("theme") || "light"; } catch (e) { /* private mode */ }
  apply(saved);
  if (btn) {
    btn.addEventListener("click", () => {
      const next = (root.getAttribute("data-theme") || "light") === "dark" ? "light" : "dark";
      apply(next);
      try { localStorage.setItem("theme", next); } catch (e) { /* private mode */ }
    });
  }
}

function initTopActions() {
  const pushAllBtn = document.getElementById("btn-push-all");
  if (pushAllBtn) {
    pushAllBtn.addEventListener("click", () => { provisionAllToCloud(); });
  }

  const testTelemetryBtn = document.getElementById("btn-send-test-telemetry");
  if (testTelemetryBtn) {
    testTelemetryBtn.addEventListener("click", () => { sendTestTelemetry(); });
  }

  document.getElementById("btn-load-sample").addEventListener("click", () => {
    loadGreenhouseDemo();
  });

  document.getElementById("btn-export-json").addEventListener("click", () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
    const dlAnchorElem = document.createElement("a");
    const safeName = state.project.name.toLowerCase().replace(/[^a-z0-9]/g, "_");
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `${safeName}_spec.json`);
    dlAnchorElem.click();
    showToast("Project blueprint JSON exported!");
  });

  const fileInput = document.getElementById("file-import-json");
  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        if (imported.project && imported.sensors && imported.actuators) {
          Object.assign(state, imported);
          // Migrate blueprints exported by the older MQTT-based studio build.
          if (imported.project.serverHost && !imported.project.cloudUrl) {
            state.project.cloudUrl = `http://${imported.project.serverHost}:${imported.project.serverPort || 3000}/api/v1`;
          }
          if (imported.project.serverClientId && !imported.project.deviceId) {
            state.project.deviceId = imported.project.serverClientId;
          }
          // Blueprints written before the identity panel have no MAC yet.
          if (!state.project.macAddress) applyControllerDefaults({ force: false });
          syncProjectInputsToState();
          renderSensorsList();
          renderActuatorsList();
          renderRulesList();
          updateStudio();
          showToast("Specification imported successfully!");
        } else {
          showToast("Invalid project JSON schema format!");
        }
      } catch (err) {
        showToast("Error parsing JSON file!");
      }
    };
    reader.readAsText(file);
  });

  document.getElementById("btn-reset-all").addEventListener("click", async () => {
    const proceed = await StudioUI.confirm({
      title: "Reset the workspace?",
      message: "All sensors, actuators, commands and rules will be cleared and the cached session for this browser is removed. Your device identity is kept.",
      confirmText: "Reset workspace",
      danger: true
    });
    if (!proceed) return;

    // Keep the device identity from the current context: the user is resetting
    // the configuration, not un-registering the node.
    const keptIdentity = {
      name: state.project.name,
      projectId: state.project.projectId,
      deviceId: state.project.deviceId,
      secretKey: state.project.secretKey,
      location: state.project.location
    };

    state.sensors = [];
    state.actuators = [];
    state.commands = [];
    state.cloudRules = [];
    state.rules = [];
    state.failsafePolicy = "keep_local_loop";

    // A stale cache would restore the cleared work on the next load.
    clearSavedSession();
    state.project = Object.assign(
      studioDefaults ? JSON.parse(JSON.stringify(studioDefaults)) : {},
      Object.fromEntries(Object.entries(keptIdentity).filter(([, value]) => value !== undefined && value !== null && value !== ""))
    );

    applyControllerDefaults({ force: true });
    syncProjectInputsToState();
    renderSensorsList();
    renderActuatorsList();
    renderCommandsList();
    renderCloudRulesList();
    renderRulesList();
    updateStudio();
    showToast("Workspace cleared — started a blank device");
  });

  document.getElementById("btn-copy-code").addEventListener("click", () => {
    const rawCode = generateArduinoCode();
    navigator.clipboard.writeText(rawCode).then(() => {
      const copyLabel = document.getElementById("copy-label");
      copyLabel.textContent = "Copied! ✓";
      setTimeout(() => { copyLabel.textContent = "Copy Code"; }, 2000);
      showToast("Arduino C++ code copied to clipboard!");
    });
  });

  document.getElementById("btn-download-ino").addEventListener("click", () => {
    const rawCode = generateArduinoCode();
    const safeName = (state.project.name || "iot_firmware").replace(/[^a-zA-Z0-9_]/g, "_");
    const blob = new Blob([rawCode], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${safeName}.ino`;
    link.click();
    URL.revokeObjectURL(url);
    showToast(`Downloaded ${safeName}.ino`);
  });
}

function loadGreenhouseDemo() {
  state.project.name = "Smart Greenhouse Climate Node";
  state.project.location = "Greenhouse Sector 4B - Hydroponic Zone";
  state.project.wifiSSID = "IoT_Lab_WiFi";
  state.project.wifiPass = "SecurePass@2026";
  state.project.cloudUrl = "https://omniteq-server.tail206540.ts.net/api/v1";
  state.project.deviceId = "8f14e45f-ea0b-4c1f-9d20-2b5e6c7a9d31";
  state.project.secretKey = "sk_live_greenhouse_node01_example";
  state.project.macAddress = "02:1A:C4:9F:33:7B";
  state.project.macAuto = false;
  state.project.cpuFrequency = "240 MHz";
  state.project.flashSize = "4 MB";
  state.project.uploadSpeed = "921600";
  state.project.nodeRole = "field_node";
  state.project.statusVariableId = "YOUR_STATUS_VARIABLE_UUID";
  state.project.firmwareVersion = "1.1.0-ESP32";
  state.project.debug = true;
  state.project.telemetryInterval = 10000;
  state.project.heartbeatInterval = 30000;
  state.project.commandPollInterval = 10000;
  state.project.maxCommands = 5;
  state.project.httpTimeout = 10000;
  state.project.retryCount = 2;
  state.project.baudRate = 115200;
  state.controller = "esp32_devkit";

  state.sensors = [
    {
      id: "sens_dht",
      type: "dht22",
      name: "DHT22 Climate Sensor",
      pin: 4,
      signalType: "digital_input",
      varTemp: "temperature",
      varHum: "humidity",
      dataTypeTemp: "float",
      dataTypeHum: "float",
      uuidTemp: "YOUR_TEMPERATURE_VARIABLE_UUID",
      uuidHum: "YOUR_HUMIDITY_VARIABLE_UUID",
      unitTemp: "°C",
      unitHum: "%RH",
      readInterval: 2000
    },
    {
      id: "sens_soil",
      type: "soil",
      name: "Capacitive Soil Moisture",
      pin: 34,
      signalType: "adc",
      varVal: "soilMoisture",
      dataType: "float",
      varUuid: "YOUR_SOIL_MOISTURE_VARIABLE_UUID",
      unit: "%",
      readInterval: 3000,
      keyTouched: true,
      variableIds: {},
      // Demonstrates the Random Value Generator: synthetic readings until the probe is wired.
      random: { enabled: true, mode: "uniform", min: 20, max: 80, precision: 1, step: 2, periodSec: 60, seed: "", pushOnBoot: true, values: "", intervalMs: 3000 }
    },
    {
      id: "sens_ldr",
      type: "ldr",
      name: "Solar Canopy LDR",
      pin: 35,
      signalType: "adc",
      varVal: "lightLevel",
      dataType: "float",
      varUuid: "YOUR_LIGHT_LEVEL_VARIABLE_UUID",
      unit: "lux",
      readInterval: 2500
    },
    {
      id: "sens_rtc",
      type: "rtc_ds3231",
      name: "RTC DS3231 Chrono",
      pin: 21,
      signalType: "i2c",
      bus: "i2c",
      varVal: "rtcTimestamp",
      dataType: "string",
      varUuid: "YOUR_RTC_TIMESTAMP_VARIABLE_UUID",
      unit: "ISO8601",
      readInterval: 1000
    }
  ];

  state.actuators = [
    {
      id: "act_fan",
      type: "relay",
      name: "Exhaust Ventilation Fan",
      pin: 18,
      signalType: "digital_output",
      activeLow: true,
      defaultState: "LOW",
      varState: "fanState",
      paramType: "boolean",
      templateId: "YOUR_FAN_RELAY_TEMPLATE_UUID"
    },
    {
      id: "act_pump",
      type: "relay",
      name: "Nutrient Feed Pump",
      pin: 19,
      signalType: "digital_output",
      activeLow: true,
      defaultState: "LOW",
      varState: "pumpState",
      paramType: "boolean",
      templateId: "YOUR_PUMP_RELAY_TEMPLATE_UUID"
    },
    {
      id: "act_lcd",
      type: "lcd_16x2",
      name: "I2C Status LCD 16x2",
      pin: 21,
      signalType: "i2c",
      bus: "i2c",
      i2cAddress: "0x27",
      defaultState: "ON",
      varState: "lcdMessage",
      paramType: "string",
      templateId: "YOUR_LCD_MESSAGE_TEMPLATE_UUID"
    },
    {
      id: "act_motor",
      type: "motor_pwm",
      name: "Irrigation Blower Motor",
      pin: 25,
      signalType: "pwm",
      channel: 0,
      frequency: 5000,
      defaultState: "0",
      varState: "blowerSpeed",
      paramType: "integer",
      templateId: "YOUR_BLOWER_SPEED_TEMPLATE_UUID",
      // Dashboard sends 0-100 (%), the blower needs a 0-255 duty cycle.
      response: {
        mode: "scale", inputMin: 0, inputMax: 100, outputMin: 0, outputMax: 255,
        clamp: true, threshold: 50, fixedValue: 128, invert: false
      }
    }
  ];

  state.rules = [
    {
      id: "rule_1",
      sensorId: "sens_dht",
      subVar: "temperature",
      operator: ">",
      threshold: 32.0,
      hysteresis: 1.0,
      actuatorId: "act_fan",
      targetState: "HIGH",
      cloudAlert: true
    },
    {
      id: "rule_2",
      sensorId: "sens_soil",
      subVar: "soilMoisture",
      operator: "<",
      threshold: 35.0,
      hysteresis: 2.0,
      actuatorId: "act_pump",
      targetState: "HIGH",
      cloudAlert: true
    }
  ];

  // Command template bound to the feed pump, using the main-project schema.
  state.commands = [
    {
      id: "cmd_demo_pump",
      name: "Nutrient Pump Control",
      description: "Switches the nutrient feed pump on or off from the dashboard",
      parameters: [
        { param_name: "pumpState", param_type: "boolean", is_required: true, param_order: 1, default_value: null }
      ],
      targetActuatorId: "act_pump",
      serverId: "",
      serverIssued: false
    },
    {
      id: "cmd_demo_blower",
      name: "Blower Speed",
      description: "Sets the irrigation blower duty cycle in percent",
      parameters: [
        { param_name: "blowerSpeed", param_type: "integer", is_required: true, param_order: 1, default_value: null }
      ],
      targetActuatorId: "act_motor",
      serverId: "",
      serverIssued: false
    }
  ];

  // Server-side rules, mirroring the platform rule engine schema.
  state.cloudRules = [
    {
      id: "crule_demo_temp",
      name: "Ventilate On High Temperature",
      sensorId: "sens_dht",
      telemetryKey: "temperature",
      variable_id: "",
      operator: ">",
      threshold: 32,
      action_type: "send_alert",
      alert_message: "Greenhouse temperature above 32 C - check ventilation.",
      template_id: "",
      alert_channels: ["email"],
      enabled: true,
      serverId: "",
      serverIssued: false
    },
    {
      id: "crule_demo_soil",
      name: "Irrigate On Dry Soil",
      sensorId: "sens_soil",
      telemetryKey: "soilMoisture",
      variable_id: "",
      operator: "<",
      threshold: 35,
      action_type: "dispatch_command",
      alert_message: "Soil moisture below 35% - dispatching the nutrient pump.",
      template_id: "",
      alert_channels: ["email", "webhook"],
      enabled: true,
      serverId: "",
      serverIssued: false
    }
  ];

  syncProjectInputsToState();
  renderSensorsList();
  renderActuatorsList();
  renderCommandsList();
  renderCloudRulesList();
  renderRulesList();
  updateStudio();
  showToast("Greenhouse demo blueprint loaded for OmniTeq Cloud!");
}

function initTabs() {
  const tabs = document.querySelectorAll(".tab-btn");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");

      const targetTabId = "tab-" + tab.dataset.tab;
      document.querySelectorAll(".tab-content").forEach((content) => {
        content.classList.remove("active");
      });
      const activeContent = document.getElementById(targetTabId);
      if (activeContent) activeContent.classList.add("active");
    });
  });
}

function getAllAssignedPins() {
  const cKey = state.controller || "esp32_devkit";
  const busConfig = CONTROLLER_BUSES[cKey] || CONTROLLER_BUSES.esp32_devkit;
  const pins = [];

  // Discrete sensors (excluding shared buses and multi-pins)
  state.sensors.forEach((s) => {
    if (!s.bus && s.type !== "ultrasonic" && s.pin !== undefined) pins.push(s.pin);
    if (s.type === "ultrasonic") {
      pins.push(s.trigPin || busConfig.ultrasonic.trig);
      pins.push(s.echoPin || busConfig.ultrasonic.echo);
    }
  });

  // Discrete actuators (excluding shared buses and steppers)
  state.actuators.forEach((a) => {
    if (!a.bus && a.type !== "stepper_motor" && a.pin !== undefined) pins.push(a.pin);
    if (a.type === "stepper_motor") {
      (a.pins || busConfig.stepper.pins).forEach(p => pins.push(p));
    }
  });

  // Dedicated CS pins used by active SPI peripherals
  state.sensors.filter(s => s.bus === "spi").forEach(s => {
    if (s.pin !== undefined) pins.push(s.pin);
  });

  // If I2C is active, protect SDA and SCL from being taken by discrete sensors
  const hasI2C = state.sensors.some(s => s.bus === "i2c") || state.actuators.some(a => a.bus === "i2c");
  if (hasI2C) {
    pins.push(busConfig.i2c.sda);
    pins.push(busConfig.i2c.scl);
  }

  // If SPI is active, protect shared SCK, MISO, MOSI lines
  const hasSPI = state.sensors.some(s => s.bus === "spi") || state.actuators.some(a => a.bus === "spi");
  if (hasSPI) {
    pins.push(busConfig.spi.sck);
    pins.push(busConfig.spi.miso);
    pins.push(busConfig.spi.mosi);
  }

  // If UART is active, protect RX and TX lines
  const hasUART = state.sensors.some(s => s.bus === "uart") || state.actuators.some(a => a.bus === "uart");
  if (hasUART) {
    pins.push(busConfig.uart.rx);
    pins.push(busConfig.uart.tx);
  }

  return [...new Set(pins)];
}

function checkPinCollisions() {
  const cKey = state.controller || "esp32_devkit";
  const busConfig = CONTROLLER_BUSES[cKey] || CONTROLLER_BUSES.esp32_devkit;
  const pinAllocations = {};

  function record(pin, name, role, bus = null, isSharedBus = false) {
    if (pin === undefined || pin === null) return;
    const pKey = String(pin);
    if (!pinAllocations[pKey]) pinAllocations[pKey] = [];
    pinAllocations[pKey].push({ name, role, bus, isSharedBus });
  }

  // 1. I2C Devices (all share SDA & SCL)
  const i2cDevices = [...state.sensors, ...state.actuators].filter(d => d.bus === "i2c" || d.signalType === "i2c");
  i2cDevices.forEach(d => {
    record(busConfig.i2c.sda, d.name, "I2C SDA (Data)", "i2c", true);
    record(busConfig.i2c.scl, d.name, "I2C SCL (Clock)", "i2c", true);
  });

  // 2. SPI Devices (share SCK, MISO, MOSI; individual CS per device)
  const spiDevices = [...state.sensors, ...state.actuators].filter(d => d.bus === "spi" || d.signalType === "spi");
  spiDevices.forEach(d => {
    record(busConfig.spi.sck, d.name, "SPI SCK (Clock)", "spi", true);
    record(busConfig.spi.miso, d.name, "SPI MISO (Data In)", "spi", true);
    record(busConfig.spi.mosi, d.name, "SPI MOSI (Data Out)", "spi", true);
    record(d.pin, d.name, "SPI CS (Chip Select)", "spi", false);
  });

  // 3. UART Devices (dedicated RX, TX)
  const uartDevices = [...state.sensors, ...state.actuators].filter(d => d.bus === "uart" || d.signalType === "uart");
  uartDevices.forEach(d => {
    record(busConfig.uart.rx, d.name, "UART RX", "uart", false);
    record(busConfig.uart.tx, d.name, "UART TX", "uart", false);
  });

  // 4. Stepper Motors (4-wire driver phases)
  const stepperActuators = state.actuators.filter(a => a.type === "stepper_motor");
  stepperActuators.forEach(a => {
    const sPins = a.pins || busConfig.stepper.pins;
    sPins.forEach((sp, idx) => {
      record(sp, a.name, `Stepper Phase IN${idx + 1}`, "stepper", false);
    });
  });

  // 5. Ultrasonic Sensors (Dual-pin)
  const ultrasonicSensors = state.sensors.filter(s => s.type === "ultrasonic");
  ultrasonicSensors.forEach(s => {
    record(s.trigPin || busConfig.ultrasonic.trig, s.name, "Ultrasonic Trig Pulse", "ultrasonic", false);
    record(s.echoPin || busConfig.ultrasonic.echo, s.name, "Ultrasonic Echo Pulse", "ultrasonic", false);
  });

  // 6. Discrete Sensors
  state.sensors.forEach(s => {
    if (s.bus !== "i2c" && s.bus !== "spi" && s.bus !== "uart" && s.type !== "ultrasonic" && s.pin !== undefined) {
      record(s.pin, s.name, s.signalType === 'adc' ? "Analog ADC Input" : "Digital Input", null, false);
    }
  });

  // 7. Discrete Actuators
  state.actuators.forEach(a => {
    if (a.bus !== "i2c" && a.bus !== "spi" && a.bus !== "uart" && a.type !== "stepper_motor" && a.pin !== undefined) {
      record(a.pin, a.name, a.signalType === 'pwm' ? "PWM Output" : "Digital Output", null, false);
    }
  });

  // Find genuine conflicts
  const conflicts = [];
  for (const pin in pinAllocations) {
    const allocs = pinAllocations[pin];
    if (allocs.length <= 1) continue;

    // Is this a valid shared I2C bus pin?
    const allI2C = allocs.every(a => a.bus === "i2c" && a.isSharedBus);
    if (allI2C) continue;

    // Is this a valid shared SPI bus clock/data pin?
    const allSpiShared = allocs.every(a => a.bus === "spi" && a.isSharedBus);
    if (allSpiShared) continue;

    // Genuine conflict:
    const devicesList = [...new Set(allocs.map(a => `${a.name} [${a.role}]`))].join(", ");
    conflicts.push({
      pin,
      devices: devicesList
    });
  }

  const banner = document.getElementById("pin-collision-banner");
  const title = document.getElementById("pin-status-title");
  const desc = document.getElementById("pin-status-detail");

  if (conflicts.length > 0) {
    banner.className = "pin-status-banner danger";
    title.textContent = "Hardware Pin Collision Detected!";
    desc.textContent = `GPIO ${conflicts[0].pin} collision: ${conflicts[0].devices}. Please reassign to unique pins.`;
  } else {
    banner.className = "pin-status-banner safe";
    title.textContent = "Pin Mapping Clean:";
    const busSummaryParts = [];
    if (i2cDevices.length > 0) busSummaryParts.push(`I2C Bus: ${i2cDevices.length} devices (SDA ${busConfig.i2c.sda}, SCL ${busConfig.i2c.scl})`);
    if (spiDevices.length > 0) busSummaryParts.push(`SPI Bus: ${spiDevices.length} devices (SCK ${busConfig.spi.sck}, MISO ${busConfig.spi.miso}, MOSI ${busConfig.spi.mosi})`);
    if (uartDevices.length > 0) busSummaryParts.push(`UART Serial: ${uartDevices.length} devices (RX ${busConfig.uart.rx}, TX ${busConfig.uart.tx})`);
    if (stepperActuators.length > 0) busSummaryParts.push(`4-Wire Stepper: ${stepperActuators.length} motors`);
    if (ultrasonicSensors.length > 0) busSummaryParts.push(`Ultrasonic: ${ultrasonicSensors.length} sensors`);

    const busSummaryText = busSummaryParts.length > 0 ? ` [${busSummaryParts.join(" | ")}]` : "";
    const totalAllocated = Object.keys(pinAllocations).length;
    if (totalAllocated === 0) {
      desc.textContent = "All discrete GPIOs are free with no collisions. Add peripherals in Section 3 & 4.";
    } else {
      desc.textContent = `All ${totalAllocated} active hardware GPIO pins are uniquely assigned with no collisions.${busSummaryText}`;
    }
  }

  return { pinAllocations, conflicts };
}

function updateStudio() {
  checkPinCollisions();
  renderCloudSchemaTable();
  renderPinMapTable();
  renderCloudApiTable();
  updateDeviceIdentityUI();
  syncStatusUuidControls();
  renderCommandsList();
  renderCloudRulesList();
  persistStudioState();

  const rawCode = generateArduinoCode();
  const highlighted = syntaxHighlight(rawCode);
  document.getElementById("code-output").innerHTML = highlighted;

  const lineCount = rawCode.split("\n").length;
  document.getElementById("code-line-count").textContent = `Lines: ${lineCount}`;

  const controllerLabel = state.controller === "esp32_devkit" ? "ESP32 DevKit V1" :
    state.controller === "esp32_s3" ? "ESP32-S3" :
      state.controller === "esp8266" ? "ESP8266 NodeMCU" : "Arduino Nano 33 IoT";

  document.getElementById("code-target-badge").textContent = `${controllerLabel} • OmniTeq Cloud`;
}

function escapeHtmlText(str) {
  if (str === undefined || str === null) return "";
  return String(str).replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[m]));
}

/**
 * Every cloud variable a sensor publishes. Dual-reading sensors (DHT11/DHT22,
 * BMP280/BME280) expose two independent variables because the gateway models a
 * variable as one label + one immutable data_type.
 */
/**
 * Cloud variable slots of a sensor.
 *
 * `uuid` is the server-issued variable_id once the sensor has been pushed, and
 * falls back to the legacy `uuid*` fields so blueprints written by earlier
 * studio builds still resolve. `simulated` mirrors the Random Value Generator
 * flag so the schema table shows where the readings come from.
 */
function getSensorVariableSlots(sensor) {
  if (!sensor) return [];
  const t = sensor.type;
  const ids = sensor.variableIds || {};
  const simulated = normalizeRandomConfig(sensor).enabled;
  const legacyPrimary = sensor.varUuid || sensor.uuidTemp || "";
  const legacySecondary = sensor.uuidHum || sensor.uuidPress || "";

  if (t === "dht22" || t === "dht11") {
    return [
      { role: "Temperature", label: sensor.varTemp || "temperature", uuid: ids.primary || legacyPrimary, dataType: sensor.dataTypeTemp || "float", unit: "C", simulated },
      { role: "Humidity", label: sensor.varHum || "humidity", uuid: ids.secondary || legacySecondary, dataType: sensor.dataTypeHum || "float", unit: "%", simulated }
    ];
  }
  if (t === "bmp280") {
    return [
      { role: "Temperature", label: sensor.varTemp || "baroTemp", uuid: ids.primary || legacyPrimary, dataType: sensor.dataTypeTemp || "float", unit: "C", simulated },
      { role: "Pressure", label: sensor.varPress || "baroPress", uuid: ids.secondary || legacySecondary, dataType: sensor.dataTypePress || "float", unit: "hPa", simulated }
    ];
  }
  return [{
    role: "Reading",
    label: sensor.varVal || sensor.varTemp || "value",
    uuid: ids.primary || legacyPrimary,
    dataType: sensor.dataType || "float",
    unit: sensor.unit || "val",
    simulated
  }];
}

function uuidCell(value, placeholder) {
  const text = (value || "").trim();
  if (!text) return `<span class="uuid-missing">not bound</span>`;
  const isPlaceholder = /^YOUR_/i.test(text) || text === (placeholder || "YOUR_VARIABLE_UUID");
  return `<code class="uuid-code ${isPlaceholder ? "is-placeholder" : ""}">${escapeHtmlText(text)}</code>`;
}

function renderCloudSchemaTable() {
  const tbody = document.getElementById("cloud-schema-tbody");
  if (!tbody) return;

  const rows = [];

  state.sensors.forEach((s) => {
    getSensorVariableSlots(s).forEach((slot) => {
      rows.push(`
        <tr>
          <td>${uuidCell(slot.uuid)}</td>
          <td><code>${escapeHtmlText(slot.label)}</code></td>
          <td>${escapeHtmlText(s.name)} <span style="color: var(--text-dim);">(${slot.role}${slot.unit ? ", " + escapeHtmlText(slot.unit) : ""})</span></td>
          <td>${slot.dataType}</td>
          <td><code>POST /ingest/telemetry</code></td>
          <td><span class="tag" style="color: #6EE7B7">PUBLISH</span></td>
        </tr>
      `);
    });
  });

  state.actuators.forEach((a) => {
    rows.push(`
      <tr>
        <td>${uuidCell(a.templateId, "YOUR_COMMAND_TEMPLATE_UUID")}</td>
        <td><code>${escapeHtmlText(a.varState || "actState")}</code></td>
        <td>${escapeHtmlText(a.name)} <span style="color: var(--text-dim);">(Command)</span></td>
        <td>${a.paramType || "boolean"}</td>
        <td><code>GET /ingest/commands/pending</code> → <code>POST /ingest/commands/:instanceId/ack</code></td>
        <td><span class="tag" style="color: #FCD34D">SUBSCRIBE / ACK</span></td>
      </tr>
    `);
  });

  state.commands.forEach((cmd) => {
    const boundActuator = state.actuators.find((a) => a.commandId === cmd.id);
    rows.push(`
      <tr>
        <td>${uuidCell(cmd.serverId, "YOUR_COMMAND_TEMPLATE_UUID")}</td>
        <td><code>${escapeHtmlText(cmd.parameters.map((p) => p.param_name).join(", "))}</code></td>
        <td>${escapeHtmlText(cmd.name)} <span style="color: var(--text-dim);">(Template, ${cmd.parameters.length} param(s))${boundActuator ? "" : " — unbound"}</span></td>
        <td>command</td>
        <td><code>GET /ingest/commands/pending</code> → <code>POST /ingest/commands/:instanceId/ack</code></td>
        <td><span class="tag" style="color: #FCD34D">SUBSCRIBE / ACK</span></td>
      </tr>
    `);
  });

  const statusUuid = state.project.statusVariableId || "";
  rows.push(`
    <tr>
      <td>${uuidCell(statusUuid, "YOUR_STATUS_VARIABLE_UUID")}</td>
      <td><code>nodeStatus</code></td>
      <td>Node Health Status <span style="color: var(--text-dim);">(String, e.g. "RUNNING")</span></td>
      <td>string</td>
      <td><code>POST /ingest/telemetry</code></td>
      <td><span class="tag" style="color: #6EE7B7">PUBLISH</span></td>
    </tr>
  `);

  if (state.sensors.length === 0 && state.actuators.length === 0) {
    rows.unshift(`
      <tr style="background: rgba(148, 163, 184, 0.05);">
        <td colspan="6" style="text-align: center; color: var(--text-dim); padding: 1rem;">
          No peripherals bound yet. Add sensors (Sec 03) or actuators (Sec 04) to register cloud variables and command templates.
        </td>
      </tr>
    `);
  }

  tbody.innerHTML = rows.join("");
}

/**
 * The exact runtime call sequence of the generated firmware, so the endpoint
 * contract is visible before flashing.
 */
function renderCloudApiTable() {
  const tbody = document.getElementById("cloud-api-tbody");
  if (!tbody) return;

  const p = state.project;
  const deviceId = p.deviceId || "YOUR_DEVICE_ID";
  const telemetryCount = state.sensors.reduce((sum, s) => sum + getSensorVariableSlots(s).length, 0) +
    (p.statusVariableId ? 1 : 0);

  const calls = [
    {
      endpoint: "POST /ingest/heartbeat",
      trigger: "Boot, then every " + Math.round((p.heartbeatInterval || 30000) / 1000) + "s",
      payload: `device_id=${deviceId}, secret_key=***, status=online, firmware_version=${p.firmwareVersion || "1.0.4"}, ip_address=WiFi.localIP()`,
      purpose: "Registers the node as online and records firmware/IP."
    },
    {
      endpoint: "POST /ingest/telemetry",
      trigger: "Every " + Math.round((p.telemetryInterval || 10000) / 1000) + "s",
      payload: `${telemetryCount} reading(s): [{ variable_id, value }] — max 500 per call, HTTP 207 on partial failure`,
      purpose: "Batch telemetry upload for every bound cloud variable."
    },
    {
      endpoint: "GET /ingest/commands/pending",
      trigger: "Every " + Math.round((p.commandPollInterval || 10000) / 1000) + "s",
      payload: `?device_id=${deviceId}&secret_key=***`,
      purpose: "Claims queued commands (auto-marked sent) into a " + (p.maxCommands || 5) + "-slot buffer."
    },
    {
      endpoint: "POST /ingest/commands/:instanceId/ack",
      trigger: "After each command executes",
      payload: `device_id=${deviceId}, secret_key=***, status=success|failed, failure_reason?`,
      purpose: "Closes the command lifecycle: received → queued → sent → executed → success|failed."
    }
  ];

  tbody.innerHTML = calls.map((c, i) => `
    <tr>
      <td>${i + 1}</td>
      <td><code>${escapeHtmlText(c.endpoint)}</code></td>
      <td>${escapeHtmlText(c.trigger)}</td>
      <td style="font-family: var(--font-mono); font-size: 0.78rem;">${escapeHtmlText(c.payload)}</td>
      <td>${escapeHtmlText(c.purpose)}</td>
    </tr>
  `).join("");
}

function renderPinMapTable() {
  const tbody = document.getElementById("pin-map-tbody");
  if (!tbody) return;

  const cKey = state.controller || "esp32_devkit";
  const busConfig = CONTROLLER_BUSES[cKey] || CONTROLLER_BUSES.esp32_devkit;
  const availablePins = CONTROLLER_PINS[cKey] || CONTROLLER_PINS.esp32_devkit;

  // Run collision evaluation to get pin allocations & conflicts
  const { pinAllocations, conflicts } = checkPinCollisions();

  const i2cDevices = [...state.sensors, ...state.actuators].filter(x => x.bus === "i2c" || x.signalType === "i2c");
  const spiDevices = [...state.sensors, ...state.actuators].filter(x => x.bus === "spi" || x.signalType === "spi");
  const uartDevices = [...state.sensors, ...state.actuators].filter(x => x.bus === "uart" || x.signalType === "uart");
  const stepperActuators = state.actuators.filter(a => a.type === "stepper_motor");
  const ultrasonicSensors = state.sensors.filter(s => s.type === "ultrasonic");

  const rows = [];

  // --- 1. Header Overview Rows for Multi-Pin Hardware Buses ---
  if (i2cDevices.length > 0) {
    rows.push(`
      <tr style="background: rgba(99, 102, 241, 0.12); border-left: 4px solid #818CF8;">
        <td><code>I2C BUS (SDA ${busConfig.i2c.sda}, SCL ${busConfig.i2c.scl})</code></td>
        <td><strong>Shared Hardware I2C Network (${i2cDevices.length} Connected):</strong> ${i2cDevices.map(d => d.name).join(", ")}</td>
        <td>HARDWARE I2C (Multi-Drop)</td>
        <td><span class="tag tag-bus-i2c">Active (${i2cDevices.length} Devices Shared)</span></td>
      </tr>
    `);
  }

  if (spiDevices.length > 0) {
    const csMappingStr = spiDevices.map(d => `${d.name} (CS: GPIO ${d.pin})`).join(" • ");
    rows.push(`
      <tr style="background: rgba(245, 158, 11, 0.12); border-left: 4px solid #F59E0B;">
        <td><code>SPI BUS (SCK ${busConfig.spi.sck}, MISO ${busConfig.spi.miso}, MOSI ${busConfig.spi.mosi})</code></td>
        <td><strong>Shared Hardware SPI Network (${spiDevices.length} Devices):</strong> ${csMappingStr}</td>
        <td>HARDWARE SPI (Multi-Slave)</td>
        <td><span class="tag tag-bus-spi">Active (${spiDevices.length} Devices Shared)</span></td>
      </tr>
    `);
  }

  if (uartDevices.length > 0) {
    rows.push(`
      <tr style="background: rgba(16, 185, 129, 0.12); border-left: 4px solid #10B981;">
        <td><code>UART BUS (RX ${busConfig.uart.rx}, TX ${busConfig.uart.tx})</code></td>
        <td><strong>Hardware Serial UART2:</strong> ${uartDevices.map(d => d.name).join(", ")}</td>
        <td>HARDWARE SERIAL (Full Duplex)</td>
        <td><span class="tag tag-bus-uart">Active (RX & TX Assigned)</span></td>
      </tr>
    `);
  }

  if (stepperActuators.length > 0) {
    const sPins = stepperActuators[0].pins || busConfig.stepper.pins;
    rows.push(`
      <tr style="background: rgba(168, 85, 247, 0.12); border-left: 4px solid #A855F7;">
        <td><code>STEPPER 4-PIN (${sPins.join(", ")})</code></td>
        <td><strong>4-Wire Stepper Motor Driver:</strong> ${stepperActuators.map(a => a.name).join(", ")} (IN1:${sPins[0]}, IN2:${sPins[1]}, IN3:${sPins[2]}, IN4:${sPins[3]})</td>
        <td>4-PHASE DRIVER</td>
        <td><span class="tag tag-stepper">Active (4-Wire Drive)</span></td>
      </tr>
    `);
  }

  if (ultrasonicSensors.length > 0) {
    const u = ultrasonicSensors[0];
    rows.push(`
      <tr style="background: rgba(0, 240, 255, 0.12); border-left: 4px solid #00F0FF;">
        <td><code>ULTRASONIC (Trig ${u.trigPin || busConfig.ultrasonic.trig}, Echo ${u.echoPin || busConfig.ultrasonic.echo})</code></td>
        <td><strong>Dual-Pin Sonar Sensor:</strong> ${ultrasonicSensors.map(s => s.name).join(", ")}</td>
        <td>SONAR PULSE TIMING</td>
        <td><span class="tag tag-ultrasonic">Active (Trig & Echo Assigned)</span></td>
      </tr>
    `);
  }

  // --- 2. Complete Physical Microcontroller Pin Mapping ---
  availablePins.forEach((p) => {
    const pKey = String(p.pin);
    const allocs = pinAllocations[pKey] || [];
    const isConflicted = conflicts.some(c => c.pin === pKey);

    if (isConflicted) {
      rows.push(`
        <tr style="background: rgba(239, 68, 68, 0.15); border-left: 3px solid #EF4444;">
          <td><code style="color: #EF4444; font-weight: 700;">GPIO ${p.pin}</code></td>
          <td><strong style="color: #EF4444;">PIN RESOURCE COLLISION!</strong> ${allocs.map(a => `${a.name} (${a.role})`).join(" + ")}</td>
          <td><span style="color: #EF4444;">CONFLICT</span></td>
          <td><span class="tag" style="color: #EF4444; border: 1px solid #EF4444; background: rgba(239,68,68,0.2)">COLLISION!</span></td>
        </tr>
      `);
      return;
    }

    // A. I2C Bus Pins (Both SDA and SCL)
    if (allocs.some(a => a.bus === "i2c")) {
      const isSDA = p.pin === busConfig.i2c.sda;
      const lineName = isSDA ? "SDA (Serial Data Line)" : "SCL (Serial Clock Line)";
      rows.push(`
        <tr style="background: rgba(99, 102, 241, 0.08); border-left: 3px solid #818CF8;">
          <td><code style="color: #818CF8; font-weight: 700;">GPIO ${p.pin}</code></td>
          <td><strong>Shared I2C Bus [${lineName}]</strong> • Connected (${i2cDevices.length}): <span style="color: var(--text-main);">${i2cDevices.map(d => d.name).join(", ")}</span></td>
          <td>I2C Bus (${isSDA ? 'SDA' : 'SCL'})</td>
          <td><span class="tag tag-bus-i2c">Active (${i2cDevices.length} Devices)</span></td>
        </tr>
      `);
      return;
    }

    // B. SPI Bus Pins (Shared Clock & Data Lines)
    if (allocs.some(a => a.bus === "spi" && a.isSharedBus)) {
      let spiLine = "SCK (Serial Clock)";
      if (p.pin === busConfig.spi.miso) spiLine = "MISO (Master In Slave Out)";
      if (p.pin === busConfig.spi.mosi) spiLine = "MOSI (Master Out Slave In)";

      rows.push(`
        <tr style="background: rgba(245, 158, 11, 0.08); border-left: 3px solid #F59E0B;">
          <td><code style="color: #F59E0B; font-weight: 700;">GPIO ${p.pin}</code></td>
          <td><strong>Shared SPI Bus [${spiLine}]</strong> • Connected (${spiDevices.length}): <span style="color: var(--text-main);">${spiDevices.map(d => d.name).join(", ")}</span></td>
          <td>SPI Bus (${p.pin === busConfig.spi.sck ? 'SCK' : (p.pin === busConfig.spi.miso ? 'MISO' : 'MOSI')})</td>
          <td><span class="tag tag-bus-spi">Active (${spiDevices.length} Devices)</span></td>
        </tr>
      `);
      return;
    }

    // C. SPI Dedicated Chip Select (CS) Pins
    const spiCsAlloc = allocs.find(a => a.bus === "spi" && !a.isSharedBus);
    if (spiCsAlloc) {
      rows.push(`
        <tr style="background: rgba(245, 158, 11, 0.05); border-left: 3px solid #F59E0B;">
          <td><code style="color: #F59E0B; font-weight: 700;">GPIO ${p.pin}</code></td>
          <td><strong>${spiCsAlloc.name}</strong> [Dedicated SPI Chip Select (CS Line)]</td>
          <td>SPI CS (Device Select)</td>
          <td><span class="tag tag-bus-spi">Active (SPI CS)</span></td>
        </tr>
      `);
      return;
    }

    // D. UART Serial Pins (Both RX & TX)
    const uartAlloc = allocs.find(a => a.bus === "uart");
    if (uartAlloc) {
      const isRX = p.pin === busConfig.uart.rx;
      rows.push(`
        <tr style="background: rgba(16, 185, 129, 0.08); border-left: 3px solid #10B981;">
          <td><code style="color: #10B981; font-weight: 700;">GPIO ${p.pin}</code></td>
          <td><strong>${uartAlloc.name}</strong> [Hardware Serial UART2 ${isRX ? 'RX (Receive Line)' : 'TX (Transmit Line)'}]</td>
          <td>UART Serial (${isRX ? 'RX' : 'TX'})</td>
          <td><span class="tag tag-bus-uart">Active (UART ${isRX ? 'RX' : 'TX'})</span></td>
        </tr>
      `);
      return;
    }

    // E. Stepper Motor Driver (All 4 Phases)
    const stepperAlloc = allocs.find(a => a.bus === "stepper");
    if (stepperAlloc) {
      rows.push(`
        <tr style="background: rgba(168, 85, 247, 0.08); border-left: 3px solid #A855F7;">
          <td><code style="color: #C084FC; font-weight: 700;">GPIO ${p.pin}</code></td>
          <td><strong>${stepperAlloc.name}</strong> [${stepperAlloc.role}]</td>
          <td>OUTPUT (Stepper 4-Wire)</td>
          <td><span class="tag tag-stepper">Active (${stepperAlloc.role.replace("Stepper ", "")})</span></td>
        </tr>
      `);
      return;
    }

    // F. Ultrasonic Sonar Sensor (Both Trig & Echo)
    const ultraAlloc = allocs.find(a => a.bus === "ultrasonic");
    if (ultraAlloc) {
      const isTrig = ultraAlloc.role.includes("Trig");
      rows.push(`
        <tr style="background: rgba(0, 240, 255, 0.08); border-left: 3px solid #00F0FF;">
          <td><code style="color: #00F0FF; font-weight: 700;">GPIO ${p.pin}</code></td>
          <td><strong>${ultraAlloc.name}</strong> [${ultraAlloc.role}]</td>
          <td>${isTrig ? 'DIGITAL OUTPUT (Trig Pulse)' : 'DIGITAL INPUT (Echo Timing)'}</td>
          <td><span class="tag tag-ultrasonic">Active (${isTrig ? 'Trig' : 'Echo'})</span></td>
        </tr>
      `);
      return;
    }

    // G. Other Discrete Sensors & Actuators
    if (allocs.length > 0) {
      const usage = allocs[0];
      rows.push(`
        <tr style="background: rgba(0, 240, 255, 0.05);">
          <td><code>GPIO ${p.pin}</code></td>
          <td><strong>${usage.name}</strong></td>
          <td>${usage.role}</td>
          <td><span class="tag" style="color: #00F0FF; border: 1px solid rgba(0,240,255,0.4)">Assigned</span></td>
        </tr>
      `);
      return;
    }

    // H. Free Unassigned GPIO Pin
    rows.push(`
      <tr style="opacity: 0.65;">
        <td><code>GPIO ${p.pin}</code></td>
        <td style="color: var(--text-dim);">${p.label}</td>
        <td style="color: var(--text-dim);">${p.inputOnly ? 'Input Only' : (p.adc ? 'GPIO / ADC' : 'GPIO / PWM')}</td>
        <td><span class="tag">Free</span></td>
      </tr>
    `);
  });

  tbody.innerHTML = rows.join("");
}

/**
 * Translate a received command value into an actuator output value.
 *
 * Returns the C++ statements for one actuator, already indented, or "" for
 * text displays (which consume a message rather than a level).
 *
 * `raw*` is the value exactly as received; `mappedValue` is what the hardware
 * acts on, so the Serial trace shows both and a mapping mistake is visible on
 * the bench instead of showing up as a silently wrong output.
 */
function buildCommandTranslation(ap) {
  const a = ap.actuator;
  const map = ap.response;
  const range = ap.responseRange;
  const key = a.varState || "actState";
  const stateVar = ap.stateLocal;
  const int = (value) => {
    const parsed = typeof value === "number" ? value : parseFloat(value);
    return Math.round(Number.isFinite(parsed) ? parsed : 0);
  };

  // Displays receive a message string; there is no level to map.
  if (range.kind === "display") return "";

  const boolParam = a.paramType === "boolean";
  const digitalOut = range.kind === "digital";
  const lines = [];

  // 1. Read the payload value in the shape the template actually sends.
  if (boolParam) {
    lines.push(`bool rawValue = extractBoolParam(parameters, "${key}", ${digitalOut ? stateVar : "false"});`);
  } else {
    lines.push(`long rawValue = extractIntParam(parameters, "${key}", ${stateVar});`);
  }
  // Numeric view of the payload (a boolean command is a plain OFF/ON level) and
  // boolean view, used by the two output kinds below.
  const rawNumeric = boolParam ? "(rawValue ? 1 : 0)" : "rawValue";
  const rawBool = boolParam ? "rawValue" : "(rawValue != 0)";

  if (digitalOut) {
    // 2a. Digital output: any mode collapses to ON or OFF.
    if (map.mode === "fixed") {
      lines.push(`bool mappedValue = ${map.fixedValue ? "true" : "false"};`);
    } else if (map.mode === "threshold") {
      lines.push(`bool mappedValue = (${rawNumeric} >= ${int(map.threshold)});`);
    } else if (map.mode === "scale") {
      lines.push(`long scaledValue = mapCommandValue(${rawNumeric}, ${int(map.inputMin)}, ${int(map.inputMax)}, ${int(map.outputMin)}, ${int(map.outputMax)}, ${map.clamp ? "true" : "false"});`);
      lines.push(`bool mappedValue = (scaledValue != 0);`);
    } else {
      // direct / invert: the payload already decides ON or OFF.
      lines.push(`bool mappedValue = ${rawBool};`);
    }
    // Invert applies to the boolean result, whatever produced it.
    if (map.invert || map.mode === "invert") {
      lines.push(`mappedValue = !mappedValue; // inverted ON/OFF`);
    }
    lines.push(`${stateVar} = mappedValue;`);
  } else {
    // 2b. Analogue output: PWM duty, servo angle or stepper travel.
    if (map.mode === "scale") {
      lines.push(`long mappedValue = mapCommandValue(${rawNumeric}, ${int(map.inputMin)}, ${int(map.inputMax)}, ${int(map.outputMin)}, ${int(map.outputMax)}, ${map.clamp ? "true" : "false"});`);
    } else if (map.mode === "threshold") {
      lines.push(`long mappedValue = (${rawNumeric} >= ${int(map.threshold)}) ? ${int(map.outputMax)} : ${int(map.outputMin)};`);
    } else if (map.mode === "fixed") {
      lines.push(`long mappedValue = ${int(map.fixedValue)};`);
    } else if (map.mode === "invert") {
      // Inverted range: the output extremes swap places.
      lines.push(`long mappedValue = ${int(map.outputMin)} + ${int(map.outputMax)} - ${rawNumeric};`);
      lines.push(`mappedValue = constrain(mappedValue, min(${int(map.outputMin)}, ${int(map.outputMax)}), max(${int(map.outputMin)}, ${int(map.outputMax)}));`);
    } else {
      lines.push(`long mappedValue = ${rawNumeric};`);
      if (map.clamp) {
        lines.push(`mappedValue = constrain(mappedValue, ${int(map.outputMin)}, ${int(map.outputMax)});`);
      }
    }
    lines.push(`${stateVar} = (int)mappedValue;`);
  }

  // 3. Trace, so the mapping is observable on the Serial monitor.
  lines.push(`Serial.print(F("[MAPPING] ${a.name}: "));`);
  lines.push(`Serial.print(rawValue);`);
  lines.push(`Serial.print(F(" -> "));`);
  lines.push(`Serial.println(${stateVar});`);

  return lines.map((line) => "    " + line).join("\n") + "\n";
}

function sanitizeMacroIdentifier(value) {
  const out = String(value || "").toUpperCase().replace(/[^A-Z0-9]/g, "_").replace(/_+/g, "_").replace(/^_+|_+$/g, "");
  return out || "NODE";
}

function sanitizeCppIdentifier(value) {
  let out = String(value || "").replace(/[^a-zA-Z0-9_]/g, "_").replace(/_+/g, "_");
  out = out.replace(/^_+/, "");
  if (!out) out = "value";
  if (/^[0-9]/.test(out)) out = "v_" + out;
  return out;
}

/**
 * Format a number as a valid C++ *float* literal.
 *
 * C++ requires a floating literal to carry a decimal point or an exponent, so
 * appending `f` to a whole number produces `20f`, which does not compile
 * ("unable to find numeric literal operator operator\"\"f"). This normalises any
 * number to a form that always has one, and never emits NaN/Infinity.
 */
function cppFloat(value, fallback) {
  const num = typeof value === "number" ? value : parseFloat(value);
  const safe = Number.isFinite(num) ? num : (Number.isFinite(fallback) ? fallback : 0);
  let text = String(safe);
  // Exponent notation (1e-7) is already a valid floating literal.
  if (!/[.eE]/.test(text)) text += ".0";
  return text + "f";
}

function uniqueIdentifier(base, used) {
  let name = base;
  let counter = 2;
  while (used.has(name)) {
    name = `${base}_${counter}`;
    counter++;
  }
  used.add(name);
  return name;
}

/**
 * Generates the OmniteqIoTCloud firmware sketch.
 *
 * The output mirrors the shipped device demos in documents/*_FullDeviceDemo.ino:
 *   Wi-Fi connect -> IoTCloudConfig + cloud.begin() -> immediate startup heartbeat
 *   -> automatic heartbeat -> batch telemetry -> command polling / ACK.
 *
 * Peripheral handling (sensor reads, actuator writes, local edge rules) is layered
 * on top so every bound cloud variable has a real hardware source.
 */
function generateArduinoCode() {
  const isESP32 = state.controller === "esp32_devkit" || state.controller === "esp32_s3";
  const isESP8266 = state.controller === "esp8266";
  const isNano = state.controller === "nano33_iot";
  const busInfo = CONTROLLER_BUSES[state.controller] || CONTROLLER_BUSES.esp32_devkit;
  const controllerMeta = getControllerMeta();
  const p = state.project;

  const controllerLabel = state.controller === "esp32_devkit" ? "ESP32 DevKit V1 (Xtensa Dual-Core)" :
    state.controller === "esp32_s3" ? "ESP32-S3 (Xtensa LX7)" :
      state.controller === "esp8266" ? "ESP8266 NodeMCU (ESP-12E)" : "Arduino Nano 33 IoT (SAMD21)";

  const transportDecl = isESP8266 ? "BearSSL::WiFiClientSecure client;" :
    isNano ? "WiFiSSLClient client;" : "WiFiClientSecure client;";

  const usedConsts = new Set();
  const usedLocals = new Set();
  const usedPinMacros = new Set();

  // ---------------------------------------------------------------------------
  // Analysis pass: cloud variable UUIDs, command templates, pins and local vars
  // ---------------------------------------------------------------------------

  const sensorPlans = state.sensors.map((sensor) => {
    const t = sensor.type;
    const slots = [];

    // Server-issued variable ids, consumed in slot order (primary, then secondary).
    // The gateway mints these on push, so nothing here is user-authored.
    const issuedIds = getSensorVariableIds(sensor).map((entry) => entry.value || "");
    let issuedIndex = 0;

    const pushSlot = (role, label, dataType, localBase, ctype, unit) => {
      const uuid = issuedIds[issuedIndex++] || "";
      const constName = uniqueIdentifier(
        sanitizeMacroIdentifier(sensor.name) + (role ? "_" + sanitizeMacroIdentifier(role) : "") + "_VARIABLE_ID",
        usedConsts
      );
      const localName = uniqueIdentifier(sanitizeCppIdentifier(localBase || label || "value"), usedLocals);
      const fallbackUuid = "YOUR_" + sanitizeMacroIdentifier(label || role || "VARIABLE") + "_VARIABLE_UUID";
      slots.push({
        role,
        label: label || role || "value",
        uuid: (uuid || "").trim() || fallbackUuid,
        dataType,
        constName,
        localName,
        ctype,
        unit
      });
    };

    if (t === "dht22" || t === "dht11") {
      pushSlot("Temperature", sensor.varTemp || "temperature", sensor.dataTypeTemp || "float", sensor.varTemp || "temperature", "float", sensor.unitTemp || "°C");
      pushSlot("Humidity", sensor.varHum || "humidity", sensor.dataTypeHum || "float", sensor.varHum || "humidity", "float", sensor.unitHum || "%");
    } else if (t === "bmp280") {
      pushSlot("Temperature", sensor.varTemp || "baroTemp", sensor.dataTypeTemp || "float", sensor.varTemp || "baroTemp", "float", sensor.unitTemp || "°C");
      pushSlot("Pressure", sensor.varPress || "baroPress", sensor.dataTypePress || "float", sensor.varPress || "baroPress", "float", sensor.unitPress || "hPa");
    } else if (["pushbutton", "toggle_switch", "ir_sensor", "pir", "sd_card"].includes(t)) {
      pushSlot("State", sensor.varVal || "sensorState", sensor.dataType || "boolean", sensor.varVal || "sensorState", "bool", sensor.unit === "bool" ? "" : (sensor.unit || ""));
    } else if (t === "rtc_ds3231") {
      pushSlot("Timestamp", sensor.varVal || "rtcTimestamp", "string", sensor.varVal || "rtcTimestamp", "char25", "ISO8601");
    } else if (t === "rfid_rc522") {
      pushSlot("CardUID", sensor.varVal || "rfidCardUid", "string", sensor.varVal || "rfidCardUid", "char20", "hex");
    } else if (t === "gsm_gps") {
      pushSlot("Position", sensor.varVal || "gpsCoordinates", "string", sensor.varVal || "gpsCoordinates", "char32", "lat,lon");
    } else {
      pushSlot("Reading", sensor.varVal || sensor.varTemp || "value", sensor.dataType || "float", sensor.varVal || "value", "float", sensor.unit && sensor.unit !== "val" ? sensor.unit : "");
    }

    return {
      sensor,
      slots,
      pinMacro: uniqueIdentifier("PIN_" + sanitizeMacroIdentifier(sensor.name), usedPinMacros)
    };
  });

  const actuatorPlans = state.actuators.map((actuator) => {
    const catalogItem = ACTUATOR_CATALOG.find((c) => c.id === actuator.catalogId || c.type === actuator.type);
    return {
      actuator,
      catalogItem,
      // How an incoming command value is translated into actuator output.
      response: normalizeResponseMap(actuator),
      responseRange: getActuatorOutputRange(actuator),
      templateConst: uniqueIdentifier(sanitizeMacroIdentifier(actuator.name) + "_TEMPLATE_ID", usedConsts),
      stateLocal: uniqueIdentifier(sanitizeCppIdentifier(actuator.varState || "actState"), usedLocals),
      paramType: actuator.paramType || inferActuatorParamType(catalogItem),
      pinMacro: uniqueIdentifier("PIN_" + sanitizeMacroIdentifier(actuator.name), usedPinMacros)
    };
  });

  const sensorById = new Map(sensorPlans.map((sp) => [sp.sensor.id, sp]));
  const actuatorById = new Map(actuatorPlans.map((ap) => [ap.actuator.id, ap]));
  const slotFor = (sp, subVar) => sp.slots.find((s) => s.label === subVar) || sp.slots[0];

  const statusVariableId = (p.statusVariableId || "").trim();
  const statusUuid = statusVariableId || "YOUR_STATUS_VARIABLE_UUID";

  const hasI2C = state.sensors.some((s) => s.bus === "i2c" || s.signalType === "i2c") ||
    state.actuators.some((a) => a.bus === "i2c" || a.signalType === "i2c");
  const hasSPI = state.sensors.some((s) => s.bus === "spi" || s.signalType === "spi");
  const hasDHT = state.sensors.some((s) => s.type === "dht22" || s.type === "dht11");
  const hasBMP = state.sensors.some((s) => s.type === "bmp280");
  const hasRTC = state.sensors.some((s) => s.type === "rtc_ds3231");
  const hasSD = state.sensors.some((s) => s.type === "sd_card");
  const hasRFID = state.sensors.some((s) => s.type === "rfid_rc522");
  const hasMPU = state.sensors.some((s) => s.type === "mpu6050");
  const hasGPS = state.sensors.some((s) => s.type === "gsm_gps");
  const hasUltrasonic = state.sensors.some((s) => s.type === "ultrasonic");
  const hasServo = state.actuators.some((a) => a.type === "servo");
  const hasOLED = state.actuators.some((a) => a.type === "oled");
  const hasLCD16x2 = state.actuators.some((a) => a.type === "lcd_16x2");
  const hasLCD20x4 = state.actuators.some((a) => a.type === "lcd_20x4");
  const hasStepper = state.actuators.some((a) => a.type === "stepper_motor");
  const hasPWM = state.actuators.some((a) => a.type === "pwm_led" || a.type === "motor_pwm");

  // Random Value Generator: a simulated sensor skips its hardware read entirely.
  const simulatedPlans = sensorPlans.filter((sp) => normalizeRandomConfig(sp.sensor).enabled);
  const hasSimulation = simulatedPlans.length > 0;
  const simPushOnBoot = simulatedPlans.some((sp) => normalizeRandomConfig(sp.sensor).pushOnBoot);

  // Built-in LED mirroring, used as visible confirmation of command execution.
  const builtInLed = getBuiltInLed();
  const ledMirrorPlans = actuatorPlans.filter((ap) => !!ap.actuator.useBuiltInLed);

  // A correlation mapping needs the shared scale helper in the sketch.
  const hasRangeMapping = actuatorPlans.some((ap) => ap.response.mode === "scale");
  const hasLedMirror = ledMirrorPlans.length > 0;

  const readingCapacity = sensorPlans.reduce((sum, sp) => sum + sp.slots.length, 0) + 1; // +1 node status
  const quoteStr = 'String("\\"")';

  let code = "";

  // ---------------------------------------------------------------------------
  // Header
  // ---------------------------------------------------------------------------
  code += `/**\n`;
  code += ` * =========================================================================\n`;
  code += ` * Project: ${p.name || "IoT Node"}\n`;
  code += ` * Location: ${p.location || "Default Location"}\n`;
  code += ` * Node Role: ${NODE_ROLE_LABELS[p.nodeRole] || NODE_ROLE_LABELS.field_node}\n`;
  code += ` * Board: ${p.boardLabel || controllerLabel}\n`;
  code += ` * Chip: ${controllerMeta.chip}\n`;
  code += ` * Target Microcontroller: ${controllerLabel}\n`;
  code += ` * Build Settings: CPU ${p.cpuFrequency || controllerMeta.cpuFrequency}, Flash ${p.flashSize || controllerMeta.flashSize}, Upload ${p.uploadSpeed || controllerMeta.uploadSpeed} baud\n`;
  code += ` * Hardware MAC: ${p.macAddress || "(not set)"}\n`;
  code += ` * Cloud Architecture: OmniTeq Cloud Platform (REST device ingest API)\n`;
  code += ` * Cloud URL: ${p.cloudUrl || "https://omniteq-server.tail206540.ts.net/api/v1"}\n`;
  code += ` * Device ID: ${p.deviceId || "YOUR_DEVICE_ID"}\n`;
  code += ` * Telemetry: POST /ingest/telemetry  (max 500 readings per call)\n`;
  code += ` * Heartbeat: POST /ingest/heartbeat\n`;
  code += ` * Commands:  GET  /ingest/commands/pending  ->  POST /ingest/commands/:instanceId/ack\n`;
  code += ` * Telemetry Interval: ${p.telemetryInterval || 10000} ms\n`;
  code += ` * Command Poll Interval: ${p.commandPollInterval || 10000} ms\n`;
  code += ` * Failsafe Policy: ${state.failsafePolicy}\n`;
  code += ` * Generated by: OmniTeq Cloud Studio\n`;
  code += ` * Generated at: ${new Date().toISOString()}\n`;
  code += ` * =========================================================================\n`;
  code += ` */\n\n`;

  // ---------------------------------------------------------------------------
  // Includes
  // ---------------------------------------------------------------------------
  code += `// --- Library Inclusions ---\n`;
  if (isESP32) {
    code += `#include <WiFi.h>\n`;
    code += `#include <WiFiClientSecure.h>\n`;
  } else if (isESP8266) {
    code += `#include <ESP8266WiFi.h>\n`;
    code += `#include <WiFiClientSecure.h>\n`;
  } else {
    code += `#include <SPI.h>\n`;
    code += `#include <WiFiNINA.h>\n`;
  }
  code += `#include <OmniteqIoTCloud.h>\n`;

  if (hasI2C) code += `#include <Wire.h>\n`;
  if (hasSPI) code += `#include <SPI.h>\n`;
  if (hasDHT) code += `#include <DHT.h>\n`;
  if (hasBMP) code += `#include <Adafruit_BMP280.h>\n`;
  if (hasRTC) code += `#include <RTClib.h>\n`;
  if (hasSD) code += `#include <SD.h>\n`;
  if (hasRFID) code += `#include <MFRC522.h>\n`;
  if (hasMPU) {
    code += `#include <Adafruit_MPU6050.h>\n`;
    code += `#include <Adafruit_Sensor.h>\n`;
  }
  if (hasLCD16x2 || hasLCD20x4) code += `#include <LiquidCrystal_I2C.h>\n`;
  if (hasStepper) code += `#include <Stepper.h>\n`;
  if (hasServo) code += isESP32 ? `#include <ESP32Servo.h>\n` : `#include <Servo.h>\n`;
  if (hasOLED) {
    code += `#include <Adafruit_GFX.h>\n`;
    code += `#include <Adafruit_SSD1306.h>\n`;
  }

  // ---------------------------------------------------------------------------
  // Credentials
  // ---------------------------------------------------------------------------
  code += `\n// --- Wi-Fi Credentials ---\n`;
  code += `const char* WIFI_SSID     = "${p.wifiSSID || "YOUR_WIFI_SSID"}";\n`;
  code += `const char* WIFI_PASSWORD = "${p.wifiPass || "YOUR_WIFI_PASSWORD"}";\n`;

  code += `\n// --- OmniTeq Cloud Device Credentials (issued once at device creation) ---\n`;
  code += `const char* CLOUD_URL        = "${p.cloudUrl || "https://omniteq-server.tail206540.ts.net/api/v1"}";\n`;
  code += `const char* DEVICE_ID        = "${p.deviceId || "YOUR_DEVICE_ID"}";\n`;
  code += `const char* DEVICE_MAC       = "${p.macAddress || "02:00:00:00:00:00"}"; // hardware identity reported at boot\n`;
  code += `const char* SECRET_KEY       = "${p.secretKey || "YOUR_SECRET_KEY"}";\n`;
  code += `const char* FIRMWARE_VERSION = "${p.firmwareVersion || "1.0.4"}";\n`;
  code += `const char* BOARD_MODEL      = "${p.boardLabel || controllerMeta.label}";\n`;
  code += `const char* NODE_ROLE        = "${NODE_ROLE_LABELS[p.nodeRole] || NODE_ROLE_LABELS.field_node}";\n`;

  code += `\n// --- Cloud Variable UUIDs (passed as variable_id in every CloudReading) ---\n`;
  sensorPlans.forEach((sp) => {
    code += `// ${sp.sensor.name}\n`;
    sp.slots.forEach((slot) => {
      code += `const char* ${slot.constName} = "${slot.uuid}";\n`;
    });
  });
  code += `// Node health status variable (String, e.g. "RUNNING")\n`;
  code += `const char* NODE_STATUS_VARIABLE_ID = "${statusUuid}";\n`;

  if (actuatorPlans.length > 0) {
    code += `\n// --- Cloud Command Template UUIDs (CloudCommand.templateId) ---\n`;
    actuatorPlans.forEach((ap) => {
      code += `// ${ap.actuator.name} (parameter: ${ap.actuator.varState || "actState"}, type: ${ap.paramType})\n`;
      code += `const char* ${ap.templateConst} = "${ap.actuator.templateId || "YOUR_COMMAND_TEMPLATE_UUID"}";\n`;
    });
  }

  // ---------------------------------------------------------------------------
  // Pin definitions
  // ---------------------------------------------------------------------------
  code += `\n// --- Hardware Pin Definitions ---\n`;
  if (hasI2C) {
    code += `// Shared hardware I2C bus\n`;
    code += `#define I2C_SDA ${busInfo.i2c.sda}\n`;
    code += `#define I2C_SCL ${busInfo.i2c.scl}\n`;
  }
  if (hasSPI) {
    code += `// Shared hardware SPI bus (one Chip Select per slave)\n`;
    code += `#define SPI_SCK  ${busInfo.spi.sck}\n`;
    code += `#define SPI_MISO ${busInfo.spi.miso}\n`;
    code += `#define SPI_MOSI ${busInfo.spi.mosi}\n`;
  }
  if (hasGPS) {
    code += `// Hardware serial for the GNSS/modem module\n`;
    code += `#define UART2_RX ${busInfo.uart.rx}\n`;
    code += `#define UART2_TX ${busInfo.uart.tx}\n`;
  }
  if (hasStepper) {
    const sPins = busInfo.stepper.pins;
    code += `// 4-wire stepper driver pins\n`;
    code += `#define PIN_STEPPER_IN1 ${sPins[0]}\n`;
    code += `#define PIN_STEPPER_IN2 ${sPins[1]}\n`;
    code += `#define PIN_STEPPER_IN3 ${sPins[2]}\n`;
    code += `#define PIN_STEPPER_IN4 ${sPins[3]}\n`;
  }
  if (hasUltrasonic) {
    code += `// HC-SR04 ultrasonic sonar pins\n`;
    code += `#define PIN_ULTRA_TRIG ${busInfo.ultrasonic.trig}\n`;
    code += `#define PIN_ULTRA_ECHO ${busInfo.ultrasonic.echo}\n`;
  }

  sensorPlans.forEach((sp) => {
    const s = sp.sensor;
    if (s.type === "ultrasonic") return;
    if (s.bus === "i2c" || s.signalType === "i2c") return;
    if (s.bus === "uart" || s.signalType === "uart") return;
    if (s.bus === "spi" || s.signalType === "spi") {
      code += `#define ${sp.pinMacro}_CS ${s.pin} // SPI chip select\n`;
      return;
    }
    code += `#define ${sp.pinMacro} ${s.pin}\n`;
  });

  actuatorPlans.forEach((ap) => {
    const a = ap.actuator;
    if (a.type === "stepper_motor") return;
    if (a.bus === "i2c" || a.signalType === "i2c") return;
    code += `#define ${ap.pinMacro} ${a.pin}\n`;
  });

  // ---------------------------------------------------------------------------
  // Peripheral instances
  // ---------------------------------------------------------------------------
  if (hasLedMirror) {
    code += `// Onboard LED used as visible confirmation that a command executed\n`;
    code += `// ${builtInLed.note}\n`;
    code += `#define PIN_BUILTIN_LED ${builtInLed.pin}\n`;
    code += `const bool BUILTIN_LED_ACTIVE_LOW = ${builtInLed.activeLow ? "true" : "false"}; // onboard wiring`;
    code += `\n\n`;
  }

  if (state.sensors.length > 0) {
    code += `\n// --- Sensor Object Instances ---\n`;
    sensorPlans.forEach((sp) => {
      const s = sp.sensor;
      if (s.type === "dht22") {
        code += `DHT dht_${s.id}(${sp.pinMacro}, DHT22);\n`;
      } else if (s.type === "dht11") {
        code += `DHT dht_${s.id}(${sp.pinMacro}, DHT11);\n`;
      } else if (s.type === "bmp280") {
        code += `Adafruit_BMP280 bmp280_${s.id};\n`;
      } else if (s.type === "rtc_ds3231") {
        code += `RTC_DS3231 rtc_${s.id};\n`;
      } else if (s.type === "rfid_rc522") {
        code += `MFRC522 rfid_${s.id}(${sp.pinMacro}_CS, ${busInfo.i2c.sda}); // SS, RST\n`;
      } else if (s.type === "mpu6050") {
        code += `Adafruit_MPU6050 mpu_${s.id};\n`;
      }
    });
  }

  if (state.actuators.length > 0) {
    code += `\n// --- Actuator Object Instances ---\n`;
    actuatorPlans.forEach((ap) => {
      const a = ap.actuator;
      if (a.type === "servo") {
        code += `Servo servo_${a.id};\n`;
      } else if (a.type === "oled") {
        code += `Adafruit_SSD1306 display_${a.id}(128, 64, &Wire, -1);\n`;
      } else if (a.type === "lcd_16x2") {
        code += `LiquidCrystal_I2C lcd16x2_${a.id}(${a.i2cAddress || "0x27"}, 16, 2);\n`;
      } else if (a.type === "lcd_20x4") {
        code += `LiquidCrystal_I2C lcd20x4_${a.id}(${a.i2cAddress || "0x27"}, 20, 4);\n`;
      } else if (a.type === "stepper_motor") {
        const sPins = a.pins || busInfo.stepper.pins;
        code += `const int STEPS_PER_REV_${a.id} = 2048;\n`;
        code += `Stepper stepper_${a.id}(STEPS_PER_REV_${a.id}, PIN_STEPPER_IN1, PIN_STEPPER_IN3, PIN_STEPPER_IN2, PIN_STEPPER_IN4); // ${sPins.join(", ")}\n`;
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Transport + local variables
  // ---------------------------------------------------------------------------
  code += `\n// --- Cloud Transport ---\n`;
  code += `${transportDecl}\n`;
  code += `IoTCloudDevice cloud;\n`;

  code += `\n// --- Local Variables Mirrored To Cloud Variables ---\n`;
  sensorPlans.forEach((sp) => {
    code += `// ${sp.sensor.name}\n`;
    sp.slots.forEach((slot) => {
      if (slot.ctype === "bool") code += `bool ${slot.localName} = false;\n`;
      else if (slot.ctype === "char25") code += `char ${slot.localName}[25] = "2026-01-01T00:00:00Z";\n`;
      else if (slot.ctype === "char20") code += `char ${slot.localName}[20] = "NONE";\n`;
      else if (slot.ctype === "char32") code += `char ${slot.localName}[32] = "0.0000,0.0000";\n`;
      else code += `float ${slot.localName} = 0.0;\n`;
    });
  });

  if (actuatorPlans.length > 0) {
    actuatorPlans.forEach((ap) => {
      const a = ap.actuator;
      if (a.type === "pwm_led" || a.type === "motor_pwm") {
        code += `int ${ap.stateLocal} = ${parseInt(a.defaultState, 10) || 0};\n`;
      } else if (a.type === "stepper_motor") {
        code += `int ${ap.stateLocal} = 0;\n`;
      } else if (a.type === "lcd_16x2" || a.type === "lcd_20x4" || a.type === "oled") {
        code += `char ${ap.stateLocal}[64] = "System Active";\n`;
      } else if (a.type === "servo") {
        code += `int ${ap.stateLocal} = ${parseInt(a.defaultState, 10) || 0};\n`;
      } else {
        code += `bool ${ap.stateLocal} = ${a.defaultState === "HIGH" ? "true" : "false"};\n`;
      }
    });
  }

  code += `\nString nodeLocation = "${p.location || "Node 1"}";\n`;
  code += `const size_t READING_CAPACITY = ${readingCapacity};\n`;
  code += `const unsigned long TELEMETRY_INTERVAL_MS = ${p.telemetryInterval || 10000};\n`;
  code += `const unsigned long COMMAND_POLL_INTERVAL_MS = ${p.commandPollInterval || 10000};\n`;
  code += `unsigned long lastTelemetry = 0;\n`;
  code += `unsigned long lastCommandPoll = 0;\n`;

  code += `\n// --- Forward Declarations ---\n`;
  code += `void connectWiFi();\n`;
  code += `void readSensors();\n`;
  code += `void evaluateAutomationLogic();\n`;
  code += `size_t buildReadings(CloudReading* readings, size_t maxCount);\n`;
  code += `void sendBatchTelemetry();\n`;
  if (actuatorPlans.length > 0) code += `void processCommand(const CloudCommand& command);\n`;
  if (state.failsafePolicy === "safe_shutdown") code += `void emergencyShutdown();\n`;
  if (hasLedMirror) code += `void setBuiltInLed(bool on);\n`;

  // ---------------------------------------------------------------------------
  // setup()
  // ---------------------------------------------------------------------------
  code += `\n// --- System Setup Routine ---\n`;
  code += `void setup()\n{\n`;
  code += `  Serial.begin(${p.baudRate || 115200});\n`;
  if (isNano) {
    code += `  while (!Serial) { delay(10); }\n`;
    code += `  if (WiFi.status() == WL_NO_MODULE) {\n`;
    code += `    Serial.println(F("[WIFI] WiFiNINA module not detected."));\n`;
    code += `    while (true) { delay(1000); }\n`;
    code += `  }\n`;
  } else {
    code += `  delay(1000);\n`;
  }
  code += `  Serial.println(F("[SYSTEM] Booting ${p.name || "IoT Node"} for OmniTeq Cloud..."));\n`;
  code += `  Serial.print(F("[SYSTEM] Cloud endpoint: "));\n`;
  code += `  Serial.println(CLOUD_URL);\n`;
  code += `  Serial.print(F("[SYSTEM] Board: "));\n`;
  code += `  Serial.print(BOARD_MODEL);\n`;
  code += `  Serial.print(F(" | Role: "));\n`;
  code += `  Serial.println(NODE_ROLE);\n`;
  code += `  Serial.print(F("[SYSTEM] Device ID: "));\n`;
  code += `  Serial.println(DEVICE_ID);\n`;
  code += `  Serial.print(F("[SYSTEM] Hardware MAC (configured): "));\n`;
  code += `  Serial.println(DEVICE_MAC);\n\n`;

  if (!isNano) {
    code += `  // TLS transport for the HTTPS gateway. setInsecure() skips certificate\n`;
    code += `  // validation (acceptable for the public Tailscale URL) - replace with\n`;
    code += `  // client.setCACert(...) before production rollout.\n`;
    code += `  client.setInsecure();\n\n`;
  }

  if (hasI2C) {
    code += `  // Initialize the shared I2C bus\n`;
    code += `  Wire.begin(I2C_SDA, I2C_SCL);\n`;
  }
  if (hasSPI) {
    code += `  // Initialize the shared SPI bus\n`;
    code += `  SPI.begin(SPI_SCK, SPI_MISO, SPI_MOSI);\n`;
  }
  if (hasGPS) {
    code += `  // Initialize hardware serial for the GNSS/modem module\n`;
    code += `  Serial2.begin(9600, SERIAL_8N1, UART2_RX, UART2_TX);\n`;
  }

  if (actuatorPlans.length > 0) {
    code += `\n  // Initialize actuators in their configured boot state\n`;
    actuatorPlans.forEach((ap) => {
      const a = ap.actuator;
      if ((a.type === "pwm_led" || a.type === "motor_pwm") && isESP32) {
        code += `  // ${a.name}\n`;
        code += `  ledcSetup(${a.channel || 0}, ${a.frequency || 5000}, 8);\n`;
        code += `  ledcAttachPin(${ap.pinMacro}, ${a.channel || 0});\n`;
        code += `  ledcWrite(${a.channel || 0}, ${ap.stateLocal});\n`;
      } else if (a.type === "pwm_led" || a.type === "motor_pwm") {
        code += `  pinMode(${ap.pinMacro}, OUTPUT);\n`;
        code += `  analogWrite(${ap.pinMacro}, ${ap.stateLocal});\n`;
      } else if (a.type === "servo") {
        code += `  servo_${a.id}.attach(${ap.pinMacro});\n`;
        code += `  servo_${a.id}.write(${ap.stateLocal});\n`;
      } else if (a.type === "lcd_16x2") {
        code += `  lcd16x2_${a.id}.init();\n`;
        code += `  lcd16x2_${a.id}.backlight();\n`;
        code += `  lcd16x2_${a.id}.setCursor(0, 0);\n`;
        code += `  lcd16x2_${a.id}.print(F("OmniTeq Cloud"));\n`;
      } else if (a.type === "lcd_20x4") {
        code += `  lcd20x4_${a.id}.init();\n`;
        code += `  lcd20x4_${a.id}.backlight();\n`;
        code += `  lcd20x4_${a.id}.setCursor(0, 0);\n`;
        code += `  lcd20x4_${a.id}.print(F("Node online"));\n`;
      } else if (a.type === "stepper_motor") {
        code += `  stepper_${a.id}.setSpeed(60); // RPM\n`;
      } else if (a.type === "oled") {
        code += `  if (display_${a.id}.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {\n`;
        code += `    display_${a.id}.clearDisplay();\n`;
        code += `    display_${a.id}.setTextSize(1);\n`;
        code += `    display_${a.id}.setTextColor(WHITE);\n`;
        code += `    display_${a.id}.setCursor(0, 0);\n`;
        code += `    display_${a.id}.print(F("OmniTeq Cloud"));\n`;
        code += `    display_${a.id}.display();\n`;
        code += `  }\n`;
      } else {
        code += `  pinMode(${ap.pinMacro}, OUTPUT);\n`;
        const bootPin = a.activeLow
          ? (a.defaultState === "HIGH" ? "LOW" : "HIGH")
          : (a.defaultState === "HIGH" ? "HIGH" : "LOW");
        code += `  digitalWrite(${ap.pinMacro}, ${bootPin});\n`;
      }
    });
  }

  if (state.sensors.length > 0) {
    code += `\n  // Initialize sensors\n`;
    sensorPlans.forEach((sp) => {
      const s = sp.sensor;
      if (s.type === "dht22" || s.type === "dht11") {
        code += `  dht_${s.id}.begin();\n`;
      } else if (s.type === "bmp280") {
        code += `  if (!bmp280_${s.id}.begin(0x76)) { Serial.println(F("[SENSOR] BMP280 not found at 0x76")); }\n`;
      } else if (s.type === "rtc_ds3231") {
        code += `  if (!rtc_${s.id}.begin()) { Serial.println(F("[SENSOR] RTC DS3231 not found")); }\n`;
      } else if (s.type === "sd_card") {
        code += `  if (!SD.begin(${sp.pinMacro}_CS)) { Serial.println(F("[SENSOR] SD card init failed")); }\n`;
      } else if (s.type === "rfid_rc522") {
        code += `  rfid_${s.id}.PCD_Init();\n`;
      } else if (s.type === "mpu6050") {
        code += `  if (!mpu_${s.id}.begin()) { Serial.println(F("[SENSOR] MPU6050 not detected")); }\n`;
      } else if (s.type === "ultrasonic") {
        code += `  pinMode(PIN_ULTRA_TRIG, OUTPUT);\n`;
        code += `  pinMode(PIN_ULTRA_ECHO, INPUT);\n`;
      } else if (s.type === "pushbutton" || s.type === "toggle_switch") {
        code += `  pinMode(${sp.pinMacro}, INPUT_PULLUP);\n`;
      } else if (s.type === "ir_sensor" || s.type === "pir") {
        code += `  pinMode(${sp.pinMacro}, INPUT);\n`;
      }
    });
  }

  if (hasLedMirror) {
    code += `  // Onboard LED used for command feedback\n`;
    code += `  pinMode(PIN_BUILTIN_LED, OUTPUT);\n`;
    code += `  setBuiltInLed(false);\n\n`;
  }

  if (hasSimulation) {
    code += `  // Seed the Random Value Generator`;
    code += `\n`;
    simulatedPlans.forEach((sp, index) => {
      const rc = normalizeRandomConfig(sp.sensor);
      const seed = rc.seed && /^[0-9]+$/.test(rc.seed) ? rc.seed : "0";
      if (index === 0) {
        code += `  simSeed(${parseInt(seed, 10) || 0}UL); // 0 = seed from micros() at runtime\n`;
      } else {
        code += `  // ${sp.sensor.name} shares the same generator stream\n`;
      }
    });
    code += `\n`;
  }

  code += `\n  // Connect to the Wi-Fi network\n`;
  code += `  connectWiFi();\n\n`;
  code += `  // Configure the OmniTeq Cloud client (device_id + secret_key auth)\n`;
  code += `  IoTCloudConfig config;\n`;
  code += `  config.baseUrl = CLOUD_URL;\n`;
  code += `  config.deviceId = DEVICE_ID;\n`;
  code += `  config.secretKey = SECRET_KEY;\n`;
  code += `  config.firmwareVersion = FIRMWARE_VERSION;\n`;
  code += `  config.ipAddress = WiFi.localIP().toString();\n`;
  code += `  config.timeoutMs = ${p.httpTimeout || 10000};\n`;
  code += `  config.retryCount = ${p.retryCount || 0};\n`;
  code += `  config.autoHeartbeat = true;\n`;
  code += `  config.heartbeatIntervalMs = ${p.heartbeatInterval || 30000};\n`;
  code += `  config.autoCommandPolling = false; // commands are polled manually in loop()\n`;
  code += `  config.commandPollIntervalMs = ${p.commandPollInterval || 10000};\n`;
  code += `  config.debug = ${p.debug === false ? "false" : "true"};\n\n`;
  code += `  if (!cloud.begin(client, config))\n`;
  code += `  {\n`;
  code += `    Serial.println(F("[CLOUD] Initialization failed."));\n`;
  code += `    return;\n`;
  code += `  }\n\n`;
  code += `  // Immediate heartbeat after boot, exactly like the device demo sketches.\n`;
  code += `  CloudResult heartbeat = cloud.heartbeat();\n`;
  code += `  Serial.print(F("[CLOUD] Startup heartbeat: "));\n`;
  code += `  Serial.println(heartbeat.success ? F("SUCCESS") : F("FAILED"));\n`;
  if (simPushOnBoot) {
    code += `\n  // The Random Value Generator is configured to publish a first sample at boot,\n`;
    code += `  // so dashboards and rules have data immediately.\n`;
    code += `  readSensors();\n`;
    code += `  evaluateAutomationLogic();\n`;
    code += `  sendBatchTelemetry();\n\n`;
  }
  code += `  Serial.println(F("[SYSTEM] Setup complete."));\n`;
  code += `}\n`;

  // ---------------------------------------------------------------------------
  // loop()
  // ---------------------------------------------------------------------------
  code += `\n// --- Main Execution Loop ---\n`;
  code += `void loop()\n{\n`;
  code += `  // Maintains the automatic heartbeat.\n`;
  code += `  cloud.loop();\n\n`;
  code += `  // Sample hardware, run local edge automation, then publish batch telemetry.\n`;
  code += `  if (millis() - lastTelemetry >= TELEMETRY_INTERVAL_MS)\n`;
  code += `  {\n`;
  code += `    lastTelemetry = millis();\n`;
  code += `    readSensors();\n`;
  code += `    evaluateAutomationLogic();\n`;
  code += `    sendBatchTelemetry();\n`;
  code += `  }\n\n`;

  code += `  // Poll the gateway for queued commands.\n`;
  code += `  if (millis() - lastCommandPoll >= COMMAND_POLL_INTERVAL_MS)\n`;
  code += `  {\n`;
  code += `    lastCommandPoll = millis();\n\n`;
  if (actuatorPlans.length > 0) {
    code += `    CloudCommand commands[${p.maxCommands || 5}];\n`;
    code += `    size_t commandCount = cloud.getCommands(commands, ${p.maxCommands || 5});\n\n`;
    code += `    for (size_t i = 0; i < commandCount; ++i)\n`;
    code += `    {\n`;
    code += `      processCommand(commands[i]);\n`;
    code += `    }\n`;
  } else {
    code += `    // No actuators are bound, so commands are only logged and acknowledged.\n`;
    code += `    CloudCommand commands[${p.maxCommands || 5}];\n`;
    code += `    size_t commandCount = cloud.getCommands(commands, ${p.maxCommands || 5});\n\n`;
    code += `    for (size_t i = 0; i < commandCount; ++i)\n`;
    code += `    {\n`;
    code += `      processCommand(commands[i]);\n`;
    code += `    }\n`;
  }
  code += `  }\n\n`;

  if (state.failsafePolicy === "safe_shutdown") {
    code += `  // Failsafe policy: turn every output OFF while the cloud link is down.\n`;
    code += `  if (WiFi.status() != WL_CONNECTED)\n`;
    code += `  {\n`;
    code += `    emergencyShutdown();\n`;
    code += `  }\n\n`;
  } else if (state.failsafePolicy === "freeze_state") {
    code += `  // Failsafe policy: freeze actuator state. Outputs are deliberately left\n`;
    code += `  // untouched while the link is down, so physical state is preserved.\n`;
    code += `  if (WiFi.status() != WL_CONNECTED)\n`;
    code += `  {\n`;
    code += `    Serial.println(F("[FAILSAFE] Link down - actuators locked at last known state."));\n`;
    code += `  }\n\n`;
  } else {
    code += `  // Failsafe policy: keep running the autonomous local loop even when the\n`;
    code += `  // cloud link is unavailable, so edge automation is never interrupted.\n`;
    code += `  if (WiFi.status() != WL_CONNECTED)\n`;
    code += `  {\n`;
    code += `    Serial.println(F("[FAILSAFE] Link down - continuing autonomous local loop."));\n`;
    code += `  }\n\n`;
  }

  code += `  delay(10);\n`;
  code += `}\n`;

  // ---------------------------------------------------------------------------
  // readSensors()
  // ---------------------------------------------------------------------------
  if (hasSimulation) {
    // The Random Value Generator replaces hardware sampling with synthetic data,
    // so the full cloud path can be validated before any sensor is wired up.
    simulatedPlans.forEach((sp) => {
      const rc = normalizeRandomConfig(sp.sensor);
      if (rc.mode !== "string") return;
      const values = String(rc.values || "ONLINE,IDLE").split(",").map((v) => v.trim()).filter(Boolean);
      const list = values.length > 0 ? values : ["ONLINE"];
      code += `static const char* const SIM_STR_${sanitizeMacroIdentifier(sp.sensor.name)}[] = { ${list.map((v) => '"' + v.replace(/"/g, '\\"') + '"').join(", ")} };\n`;
      code += `static const uint8_t SIM_STR_${sanitizeMacroIdentifier(sp.sensor.name)}_COUNT = ${list.length};\n`;
    });
    code += `\n// --- Random Value Generator (simulation mode) ---\n`;
    // Two channels per sensor keep the walk/ramp history unique per reading.
    const simChannelCount = Math.max(2, sensorPlans.length * 2);
    code += `#define SIM_CHANNEL_COUNT ${simChannelCount}\n`;
    code += `static unsigned long simRngState = 0;\n`;
    code += `static float simLastValue[SIM_CHANNEL_COUNT] = { 0.0f }; // channel = sensorIndex * 2 + slotIndex\n\n`;
    code += `void simSeed(unsigned long seed)\n{\n`;
    code += `  simRngState = (seed == 0) ? (micros() | 1UL) : seed;\n`;
    code += `}\n\n`;
    code += `unsigned long simNextRaw()\n{\n`;
    code += `  // xorshift32 - deterministic when a seed is supplied, cheap either way.\n`;
    code += `  simRngState ^= simRngState << 13;\n`;
    code += `  simRngState ^= simRngState >> 17;\n`;
    code += `  simRngState ^= simRngState << 5;\n`;
    code += `  return simRngState;\n`;
    code += `}\n\n`;
    code += `float simNoise()\n{\n`;
    code += `  return (float)(simNextRaw() & 0xFFFFFF) / (float)0x1000000;\n`;
    code += `}\n\n`;
    code += `float simRound(float value, uint8_t decimals)\n{\n`;
    code += `  float factor = 1.0f;\n`;
    code += `  for (uint8_t i = 0; i < decimals; ++i) { factor *= 10.0f; }\n`;
    code += `  return round(value * factor) / factor;\n`;
    code += `}\n\n`;
    code += `float simUniform(float lo, float hi, uint8_t decimals)\n{\n`;
    code += `  if (hi < lo) { float t = lo; lo = hi; hi = t; }\n`;
    code += `  return simRound(lo + simNoise() * (hi - lo), decimals);\n`;
    code += `}\n\n`;
    code += `float simWalk(uint8_t channel, float lo, float hi, float step, uint8_t decimals)\n{\n`;
    code += `  if (hi < lo) { float t = lo; lo = hi; hi = t; }\n`;
    code += `  if (simLastValue[channel] < lo || simLastValue[channel] > hi) { simLastValue[channel] = (lo + hi) / 2.0f; }\n`;
    code += `  simLastValue[channel] += (simNoise() * 2.0f - 1.0f) * step;\n`;
    code += `  if (simLastValue[channel] < lo) { simLastValue[channel] = lo; }\n`;
    code += `  if (simLastValue[channel] > hi) { simLastValue[channel] = hi; }\n`;
    code += `  return simRound(simLastValue[channel], decimals);\n`;
    code += `}\n\n`;
    code += `float simSine(uint8_t channel, float lo, float hi, float periodSec, uint8_t decimals)\n{\n`;
    code += `  if (hi < lo) { float t = lo; lo = hi; hi = t; }\n`;
    code += `  float mid = (lo + hi) / 2.0f;\n`;
    code += `  float amp = (hi - lo) / 2.0f;\n`;
    code += `  float periodMs = periodSec * 1000.0f;\n`;
    code += `  float phase = (float)(millis() % (unsigned long)periodMs) / periodMs;\n`;
    code += `  return simRound(mid + amp * sin(phase * 2.0f * PI), decimals);\n`;
    code += `}\n\n`;
    code += `float simRamp(uint8_t channel, float lo, float hi, float step, uint8_t decimals)\n{\n`;
    code += `  if (hi < lo) { float t = lo; lo = hi; hi = t; }\n`;
    code += `  if (simLastValue[channel] < lo || simLastValue[channel] >= hi) { simLastValue[channel] = lo; }\n`;
    code += `  simLastValue[channel] += step;\n`;
    code += `  if (simLastValue[channel] > hi) { simLastValue[channel] = hi; }\n`;
    code += `  return simRound(simLastValue[channel], decimals);\n`;
    code += `}\n\n`;
    code += `bool simBool()\n{\n`;
    code += `  return (simNextRaw() & 0x1UL) == 1UL;\n`;
    code += `}\n\n`;
    code += `uint8_t simPick(uint8_t count)\n{\n`;
    code += `  if (count == 0) { return 0; }\n`;
    code += `  return (uint8_t)(simNextRaw() % count);\n`;
    code += `}\n`;
  }

  code += `\n// --- Sensor Sampling Routine ---\n`;
  code += `void readSensors()\n{\n`;
  if (state.sensors.length === 0) {
    code += `  // No sensors configured. Only the node status reading is published.\n`;
  } else {
    sensorPlans.forEach((sp) => {
      const s = sp.sensor;
      const slot0 = sp.slots[0];
      code += `  // ${s.name}\n`;
      const simConfig = normalizeRandomConfig(s);

      if (simConfig.enabled) {
        // Random Value Generator: emit synthetic values instead of touching hardware.
        const simChannelBase = sensorPlans.indexOf(sp) * 2;
        sp.slots.forEach((slot, slotIndex) => {
          const channel = simChannelBase + slotIndex;
          if (slot.dataType === "string") {
            code += `  strncpy(${slot.localName}, SIM_STR_${sanitizeMacroIdentifier(s.name)}[simPick(SIM_STR_${sanitizeMacroIdentifier(s.name)}_COUNT)], sizeof(${slot.localName}) - 1);\n`;
            code += `  ${slot.localName}[sizeof(${slot.localName}) - 1] = '\\0';\n`;
          } else if (slot.dataType === "boolean") {
            code += `  ${slot.localName} = simBool();\n`;
          } else if (simConfig.mode === "walk") {
            code += `  ${slot.localName} = simWalk(${channel}, ${cppFloat(simConfig.min)}, ${cppFloat(simConfig.max)}, ${cppFloat(simConfig.step)}, ${simConfig.precision});\n`;
          } else if (simConfig.mode === "sine") {
            code += `  ${slot.localName} = simSine(${channel}, ${cppFloat(simConfig.min)}, ${cppFloat(simConfig.max)}, ${cppFloat(simConfig.periodSec, 60)}, ${simConfig.precision});\n`;
          } else if (simConfig.mode === "ramp") {
            code += `  ${slot.localName} = simRamp(${channel}, ${cppFloat(simConfig.min)}, ${cppFloat(simConfig.max)}, ${cppFloat(simConfig.step)}, ${simConfig.precision});\n`;
          } else {
            code += `  ${slot.localName} = simUniform(${cppFloat(simConfig.min)}, ${cppFloat(simConfig.max)}, ${simConfig.precision});\n`;
          }
        });
        code += `  Serial.print(F("[SIM] ${s.name} -> "));\n`;
        sp.slots.forEach((slot, slotIndex) => {
          if (slotIndex > 0) code += `  Serial.print(F(", "));\n`;
          code += `  Serial.print(${slot.localName});\n`;
        });
        code += `  Serial.println(F("  (random value generator)"));\n`;
        return;
      }

      if (s.type === "dht22" || s.type === "dht11") {
        const tSlot = sp.slots[0];
        const hSlot = sp.slots[1];
        code += `  float t_${s.id} = dht_${s.id}.readTemperature();\n`;
        code += `  float h_${s.id} = dht_${s.id}.readHumidity();\n`;
        code += `  if (!isnan(t_${s.id})) { ${tSlot.localName} = t_${s.id}; }\n`;
        code += `  if (!isnan(h_${s.id})) { ${hSlot.localName} = h_${s.id}; }\n`;
        code += `  Serial.print(F("[SENSOR] ${s.name} -> temp: "));\n`;
        code += `  Serial.print(${tSlot.localName}, 2);\n`;
        code += `  Serial.print(F(" C, humidity: "));\n`;
        code += `  Serial.print(${hSlot.localName}, 2);\n`;
        code += `  Serial.println(F(" %"));\n`;
      } else if (s.type === "bmp280") {
        const tSlot = sp.slots[0];
        const pSlot = sp.slots[1];
        code += `  ${tSlot.localName} = bmp280_${s.id}.readTemperature();\n`;
        code += `  ${pSlot.localName} = bmp280_${s.id}.readPressure() / 100.0F;\n`;
        code += `  Serial.print(F("[SENSOR] ${s.name} -> temp: "));\n`;
        code += `  Serial.print(${tSlot.localName}, 2);\n`;
        code += `  Serial.print(F(" C, pressure: "));\n`;
        code += `  Serial.print(${pSlot.localName}, 2);\n`;
        code += `  Serial.println(F(" hPa"));\n`;
      } else if (s.type === "soil") {
        code += `  int raw_${s.id} = analogRead(${sp.pinMacro});\n`;
        code += `  ${slot0.localName} = map(raw_${s.id}, 4095, 1200, 0, 100);\n`;
        code += `  Serial.print(F("[SENSOR] ${s.name} -> moisture: "));\n`;
        code += `  Serial.print(${slot0.localName}, 1);\n`;
        code += `  Serial.println(F(" %"));\n`;
      } else if (s.type === "ldr") {
        code += `  int raw_${s.id} = analogRead(${sp.pinMacro});\n`;
        code += `  ${slot0.localName} = map(raw_${s.id}, 0, 4095, 0, 1000);\n`;
        code += `  Serial.print(F("[SENSOR] ${s.name} -> light: "));\n`;
        code += `  Serial.print(${slot0.localName}, 1);\n`;
        code += `  Serial.println(F(" lux"));\n`;
      } else if (s.type === "mq135") {
        code += `  int raw_${s.id} = analogRead(${sp.pinMacro});\n`;
        code += `  ${slot0.localName} = map(raw_${s.id}, 0, 4095, 10, 1000);\n`;
        code += `  Serial.print(F("[SENSOR] ${s.name} -> air quality: "));\n`;
        code += `  Serial.print(${slot0.localName}, 1);\n`;
        code += `  Serial.println(F(" ppm"));\n`;
      } else if (s.type === "pushbutton") {
        code += `  ${slot0.localName} = (digitalRead(${sp.pinMacro}) == LOW); // active LOW with INPUT_PULLUP\n`;
        code += `  Serial.print(F("[SENSOR] ${s.name} -> "));\n`;
        code += `  Serial.println(${slot0.localName} ? F("PRESSED") : F("IDLE"));\n`;
      } else if (s.type === "toggle_switch") {
        code += `  ${slot0.localName} = (digitalRead(${sp.pinMacro}) == LOW);\n`;
        code += `  Serial.print(F("[SENSOR] ${s.name} -> "));\n`;
        code += `  Serial.println(${slot0.localName} ? F("ON") : F("OFF"));\n`;
      } else if (s.type === "ir_sensor") {
        code += `  ${slot0.localName} = (digitalRead(${sp.pinMacro}) == LOW); // active LOW emitter\n`;
        code += `  Serial.print(F("[SENSOR] ${s.name} -> "));\n`;
        code += `  Serial.println(${slot0.localName} ? F("DETECTED") : F("CLEAR"));\n`;
      } else if (s.type === "pir") {
        code += `  ${slot0.localName} = (digitalRead(${sp.pinMacro}) == HIGH);\n`;
        code += `  Serial.print(F("[SENSOR] ${s.name} -> "));\n`;
        code += `  Serial.println(${slot0.localName} ? F("MOTION") : F("CLEAR"));\n`;
      } else if (s.type === "rtc_ds3231") {
        code += `  DateTime now_${s.id} = rtc_${s.id}.now();\n`;
        code += `  snprintf(${slot0.localName}, sizeof(${slot0.localName}), "%04d-%02d-%02dT%02d:%02d:%02dZ",\n`;
        code += `           now_${s.id}.year(), now_${s.id}.month(), now_${s.id}.day(),\n`;
        code += `           now_${s.id}.hour(), now_${s.id}.minute(), now_${s.id}.second());\n`;
        code += `  Serial.print(F("[SENSOR] ${s.name} -> "));\n`;
        code += `  Serial.println(${slot0.localName});\n`;
      } else if (s.type === "sd_card") {
        code += `  ${slot0.localName} = (SD.cardSize() > 0);\n`;
        code += `  Serial.print(F("[SENSOR] ${s.name} -> "));\n`;
        code += `  Serial.println(${slot0.localName} ? F("CARD_READY") : F("NO_CARD"));\n`;
      } else if (s.type === "rfid_rc522") {
        code += `  if (rfid_${s.id}.PICC_IsNewCardPresent() && rfid_${s.id}.PICC_ReadCardSerial())\n`;
        code += `  {\n`;
        code += `    snprintf(${slot0.localName}, sizeof(${slot0.localName}), "%02X%02X%02X%02X",\n`;
        code += `             rfid_${s.id}.uid.uidByte[0], rfid_${s.id}.uid.uidByte[1],\n`;
        code += `             rfid_${s.id}.uid.uidByte[2], rfid_${s.id}.uid.uidByte[3]);\n`;
        code += `    Serial.print(F("[SENSOR] ${s.name} -> card UID: "));\n`;
        code += `    Serial.println(${slot0.localName});\n`;
        code += `    rfid_${s.id}.PICC_HaltA();\n`;
        code += `  }\n`;
      } else if (s.type === "mpu6050") {
        code += `  sensors_event_t accel_${s.id}, gyro_${s.id}, temp_${s.id};\n`;
        code += `  mpu_${s.id}.getEvent(&accel_${s.id}, &gyro_${s.id}, &temp_${s.id});\n`;
        code += `  ${slot0.localName} = sqrt(sq(accel_${s.id}.acceleration.x) + sq(accel_${s.id}.acceleration.y) + sq(accel_${s.id}.acceleration.z));\n`;
        code += `  Serial.print(F("[SENSOR] ${s.name} -> accel magnitude: "));\n`;
        code += `  Serial.print(${slot0.localName}, 2);\n`;
        code += `  Serial.println(F(" m/s^2"));\n`;
      } else if (s.type === "gsm_gps") {
        code += `  // Sample the NMEA stream. For production parsing add a TinyGPS++ feed here.\n`;
        code += `  while (Serial2.available()) { Serial2.read(); }\n`;
        code += `  snprintf(${slot0.localName}, sizeof(${slot0.localName}), "28.6139,77.2090");\n`;
        code += `  Serial.print(F("[SENSOR] ${s.name} -> position: "));\n`;
        code += `  Serial.println(${slot0.localName});\n`;
      } else if (s.type === "ultrasonic") {
        code += `  digitalWrite(PIN_ULTRA_TRIG, LOW);\n`;
        code += `  delayMicroseconds(2);\n`;
        code += `  digitalWrite(PIN_ULTRA_TRIG, HIGH);\n`;
        code += `  delayMicroseconds(10);\n`;
        code += `  digitalWrite(PIN_ULTRA_TRIG, LOW);\n`;
        code += `  long duration_${s.id} = pulseIn(PIN_ULTRA_ECHO, HIGH, 30000);\n`;
        code += `  ${slot0.localName} = (duration_${s.id} > 0) ? (duration_${s.id} * 0.034 / 2.0) : 400.0;\n`;
        code += `  Serial.print(F("[SENSOR] ${s.name} -> distance: "));\n`;
        code += `  Serial.print(${slot0.localName}, 1);\n`;
        code += `  Serial.println(F(" cm"));\n`;
      } else {
        code += `  int raw_${s.id} = analogRead(${sp.pinMacro});\n`;
        code += `  ${slot0.localName} = map(raw_${s.id}, 0, 4095, 0, 100);\n`;
      }
    });
  }
  code += `}\n`;

  // ---------------------------------------------------------------------------
  // evaluateAutomationLogic()
  // ---------------------------------------------------------------------------
  code += `\n// --- Autonomous Edge Logic & Automation Rules ---\n`;
  code += `void evaluateAutomationLogic()\n{\n`;
  if (state.rules.length === 0) {
    code += `  // No edge automation rules configured.\n`;
  } else {
    state.rules.forEach((rule, idx) => {
      const sp = sensorById.get(rule.sensorId);
      const ap = actuatorById.get(rule.actuatorId);
      if (!sp || !ap) return;

      const sensor = sp.sensor;
      const actuator = ap.actuator;
      const condModel = getSensorConditionModel(sensor);
      const actModel = getActuatorActionModel(actuator);
      const slot = slotFor(sp, rule.subVar);
      const actPin = ap.pinMacro;

      let conditionExpr = "";
      if (condModel.isDigital) {
        const stateVal = rule.targetDigitalState || (rule.threshold === 1 ? "PRESSED" : "RELEASED");
        if (sensor.type === "pushbutton") {
          conditionExpr = (stateVal === "PRESSED") ? `(${slot.localName} == true)` : `(${slot.localName} == false)`;
        } else if (sensor.type === "toggle_switch") {
          conditionExpr = (stateVal === "ON") ? `(${slot.localName} == true)` : `(${slot.localName} == false)`;
        } else if (sensor.type === "ir_sensor") {
          conditionExpr = (stateVal === "DETECTED") ? `(${slot.localName} == true)` : `(${slot.localName} == false)`;
        } else if (sensor.type === "pir") {
          conditionExpr = (stateVal === "MOTION") ? `(${slot.localName} == true)` : `(${slot.localName} == false)`;
        } else if (sensor.type === "rfid_rc522") {
          conditionExpr = (stateVal === "DETECTED") ? `(strcmp(${slot.localName}, "NONE") != 0)` : `(strcmp(${slot.localName}, "NONE") == 0)`;
        } else if (sensor.type === "sd_card") {
          conditionExpr = (stateVal === "READY") ? `(${slot.localName} == true)` : `(${slot.localName} == false)`;
        } else {
          conditionExpr = `(${slot.localName} == ${rule.threshold ? "true" : "false"})`;
        }
      } else {
        conditionExpr = `(${slot.localName} ${rule.operator || ">"} ${rule.threshold || 0})`;
      }

      code += `  // Rule #${idx + 1}: ${sensor.name} (${slot.label}) -> ${actuator.name}\n`;
      code += `  if ${conditionExpr}\n`;
      code += `  {\n`;

      if (actModel.category === "digital") {
        if (rule.targetState === "TOGGLE") {
          code += `    ${ap.stateLocal} = !${ap.stateLocal};\n`;
          code += `    digitalWrite(${actPin}, ${ap.stateLocal} ? LOW : HIGH);\n`;
        } else {
          const isHigh = rule.targetState === "HIGH";
          code += `    ${ap.stateLocal} = ${isHigh ? "true" : "false"};\n`;
          code += `    digitalWrite(${actPin}, ${ap.stateLocal} ? ${actuator.activeLow ? "LOW" : "HIGH"} : ${actuator.activeLow ? "HIGH" : "LOW"});\n`;
        }
      } else if (actModel.category === "pwm") {
        const pwmVal = rule.targetState === "custom"
          ? (parseInt(rule.customVal, 10) || 200)
          : (parseInt(rule.targetState, 10) || 255);
        code += `    ${ap.stateLocal} = ${pwmVal};\n`;
        code += isESP32
          ? `    ledcWrite(${actuator.channel || 0}, ${ap.stateLocal});\n`
          : `    analogWrite(${actPin}, ${ap.stateLocal});\n`;
      } else if (actModel.category === "servo") {
        const angle = rule.targetState === "custom" ? (parseInt(rule.customVal, 10) || 90) : (parseInt(rule.targetState, 10) || 90);
        code += `    ${ap.stateLocal} = ${angle};\n`;
        code += `    servo_${actuator.id}.write(${ap.stateLocal});\n`;
      } else if (actModel.category === "stepper") {
        const steps = rule.targetState === "custom" ? (parseInt(rule.customVal, 10) || 1000) : (parseInt(rule.targetState, 10) || 1000);
        code += `    ${ap.stateLocal} = ${steps};\n`;
        code += `    stepper_${actuator.id}.step(${ap.stateLocal});\n`;
      } else if (actModel.category === "display") {
        const cleanMsg = (rule.customMessage || "ALERT: LIMIT REACHED!").replace(/"/g, '\\"');
        if (actuator.type === "oled") {
          if (rule.targetState === "CLEAR") {
            code += `    display_${actuator.id}.clearDisplay();\n`;
            code += `    display_${actuator.id}.display();\n`;
          } else if (rule.targetState === "SHOW_READING") {
            code += `    display_${actuator.id}.clearDisplay();\n`;
            code += `    display_${actuator.id}.setCursor(0, 0);\n`;
            code += `    display_${actuator.id}.print(F("${sensor.name.substring(0, 20)}"));\n`;
            code += `    display_${actuator.id}.setCursor(0, 12);\n`;
            code += `    display_${actuator.id}.print(${slot.localName});\n`;
            code += `    display_${actuator.id}.display();\n`;
          } else {
            code += `    display_${actuator.id}.clearDisplay();\n`;
            code += `    display_${actuator.id}.setCursor(0, 0);\n`;
            code += `    display_${actuator.id}.print(F("${cleanMsg.substring(0, 20)}"));\n`;
            code += `    display_${actuator.id}.display();\n`;
          }
        } else {
          const instance = actuator.type === "lcd_16x2" ? `lcd16x2_${actuator.id}` : `lcd20x4_${actuator.id}`;
          if (rule.targetState === "CLEAR") {
            code += `    ${instance}.clear();\n`;
          } else if (rule.targetState === "BACKLIGHT_OFF") {
            code += `    ${instance}.noBacklight();\n`;
          } else if (rule.targetState === "SHOW_READING") {
            code += `    ${instance}.setCursor(0, 0);\n`;
            code += `    ${instance}.print(F("${sensor.name.substring(0, 16)}"));\n`;
            code += `    ${instance}.setCursor(0, 1);\n`;
            code += `    ${instance}.print(${slot.localName});\n`;
          } else {
            code += `    ${instance}.setCursor(0, 0);\n`;
            code += `    ${instance}.print(F("${cleanMsg.substring(0, 16)}"));\n`;
            code += `    strncpy(${ap.stateLocal}, "${cleanMsg.substring(0, 32)}", sizeof(${ap.stateLocal}) - 1);\n`;
            code += `    ${ap.stateLocal}[sizeof(${ap.stateLocal}) - 1] = '\\0';\n`;
          }
        }
      }

      if (rule.cloudAlert) {
        code += `    Serial.println(F("[ALERT] Rule #${idx + 1} breached - reflected in the next telemetry batch."));\n`;
      }

      code += `  }\n`;
      code += `  else\n`;
      code += `  {\n`;

      if (actModel.category === "digital") {
        if (rule.targetState !== "TOGGLE" && actuator.type !== "buzzer") {
          const reverse = rule.targetState === "HIGH" ? "LOW" : "HIGH";
          const pinReverse = actuator.activeLow ? (reverse === "HIGH" ? "LOW" : "HIGH") : reverse;
          code += `    ${ap.stateLocal} = false;\n`;
          code += `    digitalWrite(${actPin}, ${pinReverse});\n`;
        } else if (actuator.type === "buzzer") {
          code += `    ${ap.stateLocal} = false;\n`;
          code += `    digitalWrite(${actPin}, LOW);\n`;
        }
      } else if (actModel.category === "pwm") {
        code += `    ${ap.stateLocal} = 0;\n`;
        code += isESP32 ? `    ledcWrite(${actuator.channel || 0}, 0);\n` : `    analogWrite(${actPin}, 0);\n`;
      } else if (actModel.category === "servo") {
        code += `    ${ap.stateLocal} = 0;\n`;
        code += `    servo_${actuator.id}.write(0);\n`;
      } else if (actModel.category === "stepper") {
        code += `    // Stepper idle - no steps issued.\n`;
      } else if (actModel.category === "display") {
        if (actuator.type === "lcd_16x2" || actuator.type === "lcd_20x4") {
          const instance = actuator.type === "lcd_16x2" ? `lcd16x2_${actuator.id}` : `lcd20x4_${actuator.id}`;
          if (rule.targetState === "BACKLIGHT_OFF") {
            code += `    ${instance}.backlight();\n`;
          } else {
            code += `    ${instance}.setCursor(0, 0);\n`;
            code += `    ${instance}.print(F("Status: Normal  "));\n`;
          }
        } else {
          code += `    display_${actuator.id}.clearDisplay();\n`;
          code += `    display_${actuator.id}.setCursor(0, 0);\n`;
          code += `    display_${actuator.id}.print(F("Status: Normal"));\n`;
          code += `    display_${actuator.id}.display();\n`;
        }
      }

      // Mirror the resulting output state onto the onboard LED, in both the
      // trigger and the reset branch, so the LED always reflects reality.
      if (hasLedMirror && actuator.useBuiltInLed) {
        if (actModel.category === "digital") code += `    setBuiltInLed(${ap.stateLocal});\n`;
        else if (actModel.category === "pwm") code += `    setBuiltInLed(${ap.stateLocal} > 0);\n`;
        else if (actModel.category === "servo" || actModel.category === "stepper") code += `    setBuiltInLed(${ap.stateLocal} != 0);\n`;
      }

      code += `  }\n\n`;
    });
  }
  code += `}\n`;

  // ---------------------------------------------------------------------------
  // buildReadings() + sendBatchTelemetry()
  // ---------------------------------------------------------------------------
  code += `\n// --- Cloud Telemetry Batch Builder ---\n`;
  code += `size_t buildReadings(CloudReading* readings, size_t maxCount)\n{\n`;
  code += `  size_t count = 0;\n\n`;
  code += `  // String readings must be supplied as valid JSON strings, so string\n`;
  code += `  // variables are wrapped in escaped quotes.\n`;
  sensorPlans.forEach((sp) => {
    code += `  // ${sp.sensor.name}\n`;
    sp.slots.forEach((slot) => {
      let valueExpr;
      if (slot.dataType === "boolean") valueExpr = `(${slot.localName} ? "1" : "0")`;
      else if (slot.dataType === "integer") valueExpr = `String(${slot.localName})`;
      else if (slot.dataType === "string") valueExpr = `${quoteStr} + String(${slot.localName}) + ${quoteStr}`;
      else valueExpr = `String(${slot.localName}, 2)`;
      code += `  if (count < maxCount) { readings[count++] = CloudReading(${slot.constName}, ${valueExpr}); }\n`;
    });
  });
  code += `\n  // Node health status (string value, JSON-escaped)\n`;
  code += `  if (count < maxCount) { readings[count++] = CloudReading(NODE_STATUS_VARIABLE_ID, "\\"RUNNING\\""); }\n`;
  code += `\n  return count;\n`;
  code += `}\n`;

  code += `\n// --- Batch Telemetry Upload ---\n`;
  code += `void sendBatchTelemetry()\n{\n`;
  code += `  CloudReading readings[READING_CAPACITY];\n`;
  code += `  size_t readingCount = buildReadings(readings, READING_CAPACITY);\n\n`;
  code += `  if (readingCount == 0)\n`;
  code += `  {\n`;
  code += `    return;\n`;
  code += `  }\n\n`;
  code += `  CloudResult result = cloud.sendTelemetryBatch(readings, readingCount);\n\n`;
  code += `  Serial.println();\n`;
  code += `  Serial.println(F("===== BATCH TELEMETRY ====="));\n`;
  code += `  Serial.print(F("Result: "));\n`;
  code += `  Serial.println(result.success ? F("SUCCESS") : F("FAILED"));\n\n`;
  code += `  if (result.success)\n`;
  code += `  {\n`;
  code += `    Serial.print(F("Inserted: "));\n`;
  code += `    Serial.println(result.insertedCount);\n`;
  code += `    Serial.print(F("Rejected: "));\n`;
  code += `    Serial.println(result.rejectedCount);\n`;
  code += `  }\n`;
  code += `  else\n`;
  code += `  {\n`;
  code += `    Serial.print(F("HTTP: "));\n`;
  code += `    Serial.println(result.httpCode);\n`;
  code += `    Serial.print(F("Error: "));\n`;
  code += `    Serial.println(result.errorCode);\n`;
  code += `    Serial.print(F("Message: "));\n`;
  code += `    Serial.println(result.errorMessage);\n`;
  code += `  }\n`;
  code += `}\n`;

  // ---------------------------------------------------------------------------
  // Command handling
  // ---------------------------------------------------------------------------
  if (actuatorPlans.length > 0) {
    code += `\n// --- Command Parameter Helpers ---\n`;
    code += `// parametersJson is the raw JSON string carried by the command instance.\n`;
    code += `int extractIntParam(const String& json, const char* key, int fallback)\n{\n`;
    code += `  int keyIndex = json.indexOf(key);\n`;
    code += `  if (keyIndex < 0) { return fallback; }\n`;
    code += `  int colonIndex = json.indexOf(':', keyIndex);\n`;
    code += `  if (colonIndex < 0) { return fallback; }\n`;
    code += `  return json.substring(colonIndex + 1).toInt();\n`;
    code += `}\n\n`;
    code += `bool extractBoolParam(const String& json, const char* key, bool fallback)\n{\n`;
    code += `  int keyIndex = json.indexOf(key);\n`;
    code += `  if (keyIndex < 0) { return fallback; }\n`;
    code += `  String value = json.substring(keyIndex);\n`;
    code += `  if (value.indexOf("true") >= 0 || value.indexOf("1") >= 0) { return true; }\n`;
    code += `  if (value.indexOf("false") >= 0 || value.indexOf("0") >= 0) { return false; }\n`;
    code += `  return fallback;\n`;
    code += `}\n\n`;
    code += `String extractStringParam(const String& json, const char* key, const char* fallback)\n{\n`;
    code += `  int keyIndex = json.indexOf(key);\n`;
    code += `  if (keyIndex < 0) { return String(fallback); }\n`;
    code += `  int colonIndex = json.indexOf(':', keyIndex);\n`;
    code += `  if (colonIndex < 0) { return String(fallback); }\n`;
    code += `  String value = json.substring(colonIndex + 1);\n`;
    code += `  value.trim();\n`;
    code += `  int endIndex = value.indexOf(',');\n`;
    code += `  if (endIndex > 0) { value = value.substring(0, endIndex); }\n`;
    code += `  value.replace("\\"", "");\n`;
    code += `  value.trim();\n`;
    code += `  return value;\n`;
    code += `}\n\n`;
  }

  if (hasRangeMapping) {
    code += `\n// --- Command Response Mapping ---\n`;
    code += `// Correlates an incoming command value with an actuator's output range:\n`;
    code += `// e.g. a dashboard sends 0-100 (%), while the LED needs 0-255 duty cycle.\n`;
    code += `long mapCommandValue(long raw, long inMin, long inMax, long outMin, long outMax, bool clampOutput)\n{\n`;
    code += `  if (inMax == inMin) { return outMin; }\n`;
    code += `  long mapped = (raw - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;\n`;
    code += `  if (clampOutput)\n`;
    code += `  {\n`;
    code += `    long lo = min(outMin, outMax);\n`;
    code += `    long hi = max(outMin, outMax);\n`;
    code += `    if (mapped < lo) { mapped = lo; }\n`;
    code += `    if (mapped > hi) { mapped = hi; }\n`;
    code += `  }\n`;
    code += `  return mapped;\n`;
    code += `}\n`;
  }

  code += `\n// --- Cloud Command Handler ---\n`;
  code += `void processCommand(const CloudCommand& command)\n{\n`;
  code += `  // Normalize to String so template ids and parameters can be compared and\n`;
  code += `  // searched regardless of the underlying library field type.\n`;
  code += `  String templateId = String(command.templateId);\n`;
  code += `  String parameters = String(command.parametersJson);\n\n`;
  code += `  Serial.println();\n`;
  code += `  Serial.println(F("===== CLOUD COMMAND ====="));\n`;
  code += `  Serial.print(F("Instance ID: "));\n`;
  code += `  Serial.println(command.instanceId);\n`;
  code += `  Serial.print(F("Template ID: "));\n`;
  code += `  Serial.println(templateId);\n`;
  code += `  Serial.print(F("Parameters: "));\n`;
  code += `  Serial.println(parameters);\n\n`;

  if (actuatorPlans.length === 0) {
    code += `  // No actuator is bound to this node, so the command is acknowledged as a no-op.\n`;
    code += `  bool hardwareOperationOk = true;\n`;
    code += `  String failureReason = "";\n`;
  } else {
    code += `  bool hardwareOperationOk = false;\n`;
    code += `  String failureReason = "No matching command template on this device";\n\n`;
    actuatorPlans.forEach((ap) => {
      const a = ap.actuator;
      const key = a.varState || "actState";
      // Value translation for this actuator, generated from its response map.
      const translation = buildCommandTranslation(ap);
      code += `  // ${a.name} - template ${a.templateId || "YOUR_COMMAND_TEMPLATE_UUID"}\n`;
      code += `  if (templateId == ${ap.templateConst} || parameters.indexOf("${key}") >= 0)\n`;
      code += `  {\n`;

      if (a.type === "pwm_led" || a.type === "motor_pwm") {
        code += translation;
        code += isESP32
          ? `    ledcWrite(${a.channel || 0}, ${ap.stateLocal});\n`
          : `    analogWrite(${ap.pinMacro}, ${ap.stateLocal});\n`;
        code += `    Serial.print(F("[ACTUATOR] ${a.name} -> PWM duty "));\n`;
        code += `    Serial.println(${ap.stateLocal});\n`;
      } else if (a.type === "servo") {
        code += translation;
        code += `    servo_${a.id}.write(${ap.stateLocal});\n`;
        code += `    Serial.print(F("[ACTUATOR] ${a.name} -> angle "));\n`;
        code += `    Serial.println(${ap.stateLocal});\n`;
      } else if (a.type === "stepper_motor") {
        code += translation;
        code += `    stepper_${a.id}.step(${ap.stateLocal});\n`;
        code += `    Serial.print(F("[ACTUATOR] ${a.name} -> steps "));\n`;
        code += `    Serial.println(${ap.stateLocal});\n`;
      } else if (a.type === "lcd_16x2" || a.type === "lcd_20x4") {
        const inst = a.type === "lcd_16x2" ? `lcd16x2_${a.id}` : `lcd20x4_${a.id}`;
        const width = a.type === "lcd_16x2" ? 16 : 20;
        code += `    String message = extractStringParam(parameters, "${key}", "CLOUD CMD");\n`;
        code += `    ${inst}.clear();\n`;
        code += `    ${inst}.setCursor(0, 0);\n`;
        code += `    ${inst}.print(message.substring(0, ${width}));\n`;
        code += `    strncpy(${ap.stateLocal}, message.c_str(), sizeof(${ap.stateLocal}) - 1);\n`;
        code += `    ${ap.stateLocal}[sizeof(${ap.stateLocal}) - 1] = '\\0';\n`;
      } else if (a.type === "oled") {
        code += `    String message = extractStringParam(parameters, "${key}", "CLOUD CMD");\n`;
        code += `    display_${a.id}.clearDisplay();\n`;
        code += `    display_${a.id}.setTextSize(1);\n`;
        code += `    display_${a.id}.setCursor(0, 0);\n`;
        code += `    display_${a.id}.print(message);\n`;
        code += `    display_${a.id}.display();\n`;
        code += `    strncpy(${ap.stateLocal}, message.c_str(), sizeof(${ap.stateLocal}) - 1);\n`;
        code += `    ${ap.stateLocal}[sizeof(${ap.stateLocal}) - 1] = '\\0';\n`;
      } else {
        code += translation;
        code += `    digitalWrite(${ap.pinMacro}, ${ap.stateLocal} ? ${a.activeLow ? "LOW" : "HIGH"} : ${a.activeLow ? "HIGH" : "LOW"});\n`;
        code += `    Serial.print(F("[ACTUATOR] ${a.name} -> "));\n`;
        code += `    Serial.println(${ap.stateLocal} ? F("ON") : F("OFF"));\n`;
      }

      if (hasLedMirror && a.useBuiltInLed) {
        if (a.type === "pwm_led" || a.type === "motor_pwm" || a.type === "servo" || a.type === "stepper_motor") {
          code += `    setBuiltInLed(${ap.stateLocal} != 0);\n`;
        } else if (a.type === "lcd_16x2" || a.type === "lcd_20x4" || a.type === "oled") {
          code += `    setBuiltInLed(true); // blink on message command\n`;
        } else {
          code += `    setBuiltInLed(${ap.stateLocal});\n`;
        }
      }

      code += `    hardwareOperationOk = true;\n`;
      code += `    failureReason = "";\n`;

      code += `  }\n\n`;
    });
  }

  code += `  CloudResult ack = cloud.ackCommand(\n`;
  code += `    command.instanceId,\n`;
  code += `    hardwareOperationOk,\n`;
  code += `    hardwareOperationOk ? "" : failureReason.c_str()\n`;
  code += `  );\n\n`;
  code += `  Serial.print(F("ACK: "));\n`;
  code += `  Serial.println(ack.success ? F("SUCCESS") : F("FAILED"));\n`;
  code += `}\n`;

  // ---------------------------------------------------------------------------
  // connectWiFi() + failsafe
  // ---------------------------------------------------------------------------
  if (hasLedMirror) {
    code += `\n// --- Built-in LED Feedback ---\n`;
    code += `// Lights the onboard LED whenever a mirrored output is ON, giving instant\n`;
    code += `// visual confirmation that a cloud command or rule actually executed.\n`;
    code += `void setBuiltInLed(bool on)\n{\n`;
    code += `  digitalWrite(PIN_BUILTIN_LED, (on != BUILTIN_LED_ACTIVE_LOW) ? HIGH : LOW);\n`;
    code += `}\n`;
  }

  code += `\n// --- Wi-Fi Link Manager ---\n`;
  code += `void connectWiFi()\n{\n`;
  if (isNano) {
    code += `  Serial.print(F("[WIFI] Connecting to "));\n`;
    code += `  Serial.println(WIFI_SSID);\n\n`;
    code += `  while (WiFi.status() != WL_CONNECTED)\n`;
    code += `  {\n`;
    code += `    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);\n`;
    code += `    delay(5000);\n`;
    code += `    Serial.print(F("."));\n`;
    code += `  }\n\n`;
    code += `  Serial.println();\n`;
    code += `  Serial.print(F("[WIFI] Connected. IP address: "));\n`;
    code += `  Serial.println(WiFi.localIP());\n`;
  } else {
    code += `  WiFi.mode(WIFI_STA);\n`;
    code += `  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);\n\n`;
    code += `  Serial.print(F("[WIFI] Connecting to "));\n`;
    code += `  Serial.println(WIFI_SSID);\n\n`;
    code += `  int attempts = 0;\n`;
    code += `  while (WiFi.status() != WL_CONNECTED && attempts < 40)\n`;
    code += `  {\n`;
    code += `    delay(500);\n`;
    code += `    Serial.print(F("."));\n`;
    code += `    attempts++;\n`;
    code += `  }\n\n`;
    code += `  Serial.println();\n`;
    code += `  if (WiFi.status() == WL_CONNECTED)\n`;
    code += `  {\n`;
    code += `    Serial.print(F("[WIFI] Connected. IP address: "));\n`;
    code += `    Serial.println(WiFi.localIP());\n`;
    code += `    // Real hardware MAC, printed so it can be compared with DEVICE_MAC.\n`;
    code += `    Serial.print(F("[WIFI] Hardware MAC (runtime): "));\n`;
    code += `    Serial.println(WiFi.macAddress());\n`;
    code += `  }\n`;
    code += `  else\n`;
    code += `  {\n`;
    code += `    Serial.println(F("[WIFI] Connection failed. Check the SSID/password or AP reachability."));\n`;
    code += `  }\n`;
  }
  code += `}\n`;

  if (state.failsafePolicy === "safe_shutdown") {
    code += `\n// --- Failsafe: Safe Shutdown ---\n`;
    code += `void emergencyShutdown()\n{\n`;
    code += `  static bool shutdownLogged = false;\n`;
    code += `  if (!shutdownLogged)\n`;
    code += `  {\n`;
    code += `    Serial.println(F("[FAILSAFE] Cloud link down - forcing every output OFF."));\n`;
    code += `    shutdownLogged = true;\n`;
    if (hasLedMirror) code += `    setBuiltInLed(false);\n`;
    code += `  }\n\n`;
    actuatorPlans.forEach((ap) => {
      const a = ap.actuator;
      if (a.type === "pwm_led" || a.type === "motor_pwm") {
        code += `  ${ap.stateLocal} = 0;\n`;
        code += isESP32 ? `  ledcWrite(${a.channel || 0}, 0);\n` : `  analogWrite(${ap.pinMacro}, 0);\n`;
      } else if (a.type === "servo") {
        code += `  ${ap.stateLocal} = 0;\n`;
        code += `  servo_${a.id}.write(0);\n`;
      } else if (a.type === "stepper_motor") {
        code += `  // Stepper left unpowered (no step pulses).\n`;
      } else if (a.type === "lcd_16x2" || a.type === "lcd_20x4" || a.type === "oled") {
        code += `  // Display outputs are non-hazardous, so they are left readable.\n`;
      } else {
        code += `  ${ap.stateLocal} = false;\n`;
        code += `  digitalWrite(${ap.pinMacro}, ${a.activeLow ? "HIGH" : "LOW"});\n`;
      }
    });
    code += `}\n`;
  }

  return code;
}

function syntaxHighlight(code) {
  let escaped = code
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const tokens = [];
  function pushTok(cls, content) {
    const key = `@@@TOK${tokens.length}@@@`;
    tokens.push({ key, html: `<span class="${cls}">${content}</span>` });
    return key;
  }

  // 1. Comments
  escaped = escaped.replace(/(\/\*[\s\S]*?\*\/)/g, (m) => pushTok("token-comment", m));
  escaped = escaped.replace(/(\/\/[^\n]*)/g, (m) => pushTok("token-comment", m));

  // 2. Preprocessor directives
  escaped = escaped.replace(/(#(?:include|define|ifndef|endif)[^\n]*)/g, (m) => pushTok("token-preprocessor", m));

  // 3. Strings
  escaped = escaped.replace(/("(?:\\.|[^"\\])*")/g, (m) => pushTok("token-string", m));

  // 4. Numbers
  escaped = escaped.replace(/\b(\d+(?:\.\d+)?f?)\b/g, (m) => pushTok("token-number", m));

  // 5. Language Keywords
  const keywords = /\b(void|int|float|bool|char|unsigned|long|const|if|else|return|while|for|switch|case|break|String)\b/g;
  escaped = escaped.replace(keywords, (m) => pushTok("token-keyword", m));

  // 6. Macros & Constants
  const macros = /\b(HIGH|LOW|INPUT|OUTPUT|INPUT_PULLUP|READ|READWRITE|ON_CHANGE|NULL|WL_CONNECTED|F|true|false)\b/g;
  escaped = escaped.replace(macros, (m) => pushTok("token-macro", m));

  // Restore tokens in reverse
  for (let i = tokens.length - 1; i >= 0; i--) {
    escaped = escaped.replace(tokens[i].key, tokens[i].html);
  }

  return escaped;
}

function showToast(message, type) {
  // Stacked, typed, dismissible toasts (studio-ui.js). Type is inferred when omitted.
  if (window.StudioUI) return window.StudioUI.toast(message, type);
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove("show"), 2600);
}

function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}
