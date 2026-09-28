#include <SPI.h>
#include <WiFiNINA.h>
#include <OmniteqIoTCloud.h>

const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

const char* CLOUD_URL = "https://omniteq-server.tail206540.ts.net/api/v1";
const char* DEVICE_ID = "YOUR_DEVICE_ID";
const char* SECRET_KEY = "YOUR_SECRET_KEY";


WiFiSSLClient client;
IoTCloudDevice cloud;

void connectWiFi()
{
  Serial.print("Connecting to Wi-Fi");
  while (WiFi.status() != WL_CONNECTED)
  {
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    delay(5000);
    Serial.print(".");
  }
  Serial.println();
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
}

const char* TEMPERATURE_VARIABLE_ID = "YOUR_TEMPERATURE_VARIABLE_UUID";
const char* HUMIDITY_VARIABLE_ID = "YOUR_HUMIDITY_VARIABLE_UUID";
const char* STATUS_VARIABLE_ID = "YOUR_STATUS_VARIABLE_UUID";

void sendBatchTelemetry()
{
  float temperature = 25.0 + (millis() % 1000) / 100.0;
  float humidity = 50.0 + (millis() % 500) / 100.0;

  CloudReading readings[3];
  readings[0] = CloudReading(TEMPERATURE_VARIABLE_ID, String(temperature, 2));
  readings[1] = CloudReading(HUMIDITY_VARIABLE_ID, String(humidity, 2));
  readings[2] = CloudReading(STATUS_VARIABLE_ID, "\"RUNNING\"");

  CloudResult result = cloud.sendTelemetryBatch(readings, 3);

  Serial.println();
  Serial.println("===== BATCH TELEMETRY =====");
  Serial.println(result.success ? "SUCCESS" : "FAILED");
  if (!result.success)
  {
    Serial.print("HTTP: "); Serial.println(result.httpCode);
    Serial.print("Error: "); Serial.println(result.errorCode);
    Serial.print("Message: "); Serial.println(result.errorMessage);
  }
}

void processCommand(const CloudCommand& command)
{
  Serial.println();
  Serial.println("===== CLOUD COMMAND =====");
  Serial.print("Instance ID: "); Serial.println(command.instanceId);
  Serial.print("Template ID: "); Serial.println(command.templateId);
  Serial.print("Parameters: "); Serial.println(command.parametersJson);

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
  while (!Serial) { delay(10); }

  if (WiFi.status() == WL_NO_MODULE)
  {
    Serial.println("WiFiNINA module not detected.");
    while (true) delay(1000);
  }

  connectWiFi();

  IoTCloudConfig config;
  config.baseUrl = CLOUD_URL;
  config.deviceId = DEVICE_ID;
  config.secretKey = SECRET_KEY;
  config.firmwareVersion = "1.1.1-Nano33IoT";
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

  CloudResult heartbeat = cloud.heartbeat();
  Serial.print("Startup heartbeat: ");
  Serial.println(heartbeat.success ? "SUCCESS" : "FAILED");
}

void loop()
{
  cloud.loop();

  static unsigned long lastTelemetry = 0;
  static unsigned long lastCommandPoll = 0;

  if (millis() - lastTelemetry >= 10000)
  {
    lastTelemetry = millis();
    sendBatchTelemetry();
  }

  if (millis() - lastCommandPoll >= 10000)
  {
    lastCommandPoll = millis();

    CloudCommand commands[5];
    size_t commandCount = cloud.getCommands(commands, 5);

    for (size_t i = 0; i < commandCount; ++i)
      processCommand(commands[i]);
  }

  delay(10);
}
