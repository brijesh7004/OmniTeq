/*
  OmniteqIoTCloud - ESP32-S3 Full Device Demo

  Complete device-side example:
    1. Wi-Fi connection
    2. IoT Cloud initialization
    3. Startup heartbeat
    4. Automatic heartbeat
    5. Batch telemetry
    6. Command polling
    7. Command acknowledgement

  Replace all YOUR_* values before uploading.
*/

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <OmniteqIoTCloud.h>

const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

const char* CLOUD_URL = "https://omniteq-server.tail206540.ts.net/api/v1";
const char* DEVICE_ID = "YOUR_DEVICE_ID";
const char* SECRET_KEY = "YOUR_SECRET_KEY";

const char* TEMPERATURE_VARIABLE_ID = "YOUR_TEMPERATURE_VARIABLE_UUID";
const char* HUMIDITY_VARIABLE_ID = "YOUR_HUMIDITY_VARIABLE_UUID";
const char* STATUS_VARIABLE_ID = "YOUR_STATUS_VARIABLE_UUID";

WiFiClientSecure client;
IoTCloudDevice cloud;

unsigned long lastTelemetry = 0;
unsigned long lastCommandPoll = 0;

void connectWiFi()
{
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  Serial.print("Connecting to Wi-Fi");

  while (WiFi.status() != WL_CONNECTED)
  {
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
}

void sendBatchTelemetry()
{
  float temperature = 25.0 + (millis() % 1000) / 100.0;
  float humidity = 50.0 + (millis() % 500) / 100.0;

  CloudReading readings[3];

  readings[0] = CloudReading(
    TEMPERATURE_VARIABLE_ID,
    String(temperature, 2)
  );

  readings[1] = CloudReading(
    HUMIDITY_VARIABLE_ID,
    String(humidity, 2)
  );

  // String values must be supplied as valid JSON strings when using
  // CloudReading directly.
  readings[2] = CloudReading(
    STATUS_VARIABLE_ID,
    "\"RUNNING\""
  );

  CloudResult result =
    cloud.sendTelemetryBatch(readings, 3);

  Serial.println();
  Serial.println("===== BATCH TELEMETRY =====");
  Serial.print("Result: ");
  Serial.println(result.success ? "SUCCESS" : "FAILED");

  if (result.success)
  {
    Serial.print("Inserted: ");
    Serial.println(result.insertedCount);

    Serial.print("Rejected: ");
    Serial.println(result.rejectedCount);
  }
  else
  {
    Serial.print("HTTP: ");
    Serial.println(result.httpCode);
    Serial.print("Error: ");
    Serial.println(result.errorCode);
    Serial.print("Message: ");
    Serial.println(result.errorMessage);
  }
}

void processCommand(const CloudCommand& command)
{
  Serial.println();
  Serial.println("===== CLOUD COMMAND =====");
  Serial.print("Instance ID: ");
  Serial.println(command.instanceId);
  Serial.print("Template ID: ");
  Serial.println(command.templateId);
  Serial.print("Parameters: ");
  Serial.println(command.parametersJson);

  // Execute the real actuator operation here.
  bool hardwareOperationOk = true;

  CloudResult ack = cloud.ackCommand(
    command.instanceId,
    hardwareOperationOk,
    hardwareOperationOk ? "" : "Hardware operation failed"
  );

  Serial.print("ACK: ");
  Serial.println(ack.success ? "SUCCESS" : "FAILED");
}

void setup()
{
  Serial.begin(115200);
  delay(1000);

  // HTTPS: use TLS transport for the public Tailscale URL.
  // For production, replace setInsecure() with CA certificate validation.
  client.setInsecure();

  connectWiFi();

  IoTCloudConfig config;
  config.baseUrl = CLOUD_URL;
  config.deviceId = DEVICE_ID;
  config.secretKey = SECRET_KEY;
  config.firmwareVersion = "1.1.1-ESP32S3";
  config.ipAddress = WiFi.localIP().toString();
  config.timeoutMs = 10000;
  config.retryCount = 2;

  config.autoHeartbeat = true;
  config.heartbeatIntervalMs = 30000;

  config.autoCommandPolling = false;
  config.commandPollIntervalMs = 10000;

  config.debug = true;

  if (!cloud.begin(client, config))
  {
    Serial.println("Cloud initialization failed.");
    return;
  }

  // Immediate heartbeat after boot.
  CloudResult heartbeat = cloud.heartbeat();

  Serial.print("Startup heartbeat: ");
  Serial.println(heartbeat.success ? "SUCCESS" : "FAILED");
}

void loop()
{
  // Maintains automatic heartbeat.
  cloud.loop();

  // Send telemetry every 10 seconds.
  if (millis() - lastTelemetry >= 10000)
  {
    lastTelemetry = millis();
    sendBatchTelemetry();
  }

  // Poll commands every 10 seconds.
  if (millis() - lastCommandPoll >= 10000)
  {
    lastCommandPoll = millis();

    CloudCommand commands[5];
    size_t commandCount = cloud.getCommands(commands, 5);

    for (size_t i = 0; i < commandCount; ++i)
    {
      processCommand(commands[i]);
    }
  }

  delay(10);
}
