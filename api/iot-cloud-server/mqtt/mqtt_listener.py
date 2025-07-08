import paho.mqtt.client as mqtt
import pymysql
import json

DB_CONFIG = {
    "host": "localhost",
    "user": "omniteq_user",
    "password": "omniteq@123",
    "database": "omniteq_db"
}

def on_connect(client, userdata, flags, rc):
    print("Connected with result code " + str(rc))
    client.subscribe("device/+/status")
    client.subscribe("device/+/control")

def on_message(client, userdata, msg):
    topic_parts = msg.topic.split('/')
    if len(topic_parts) < 3:
        return

    device_secret = topic_parts[1]
    data = json.loads(msg.payload.decode())

    conn = pymysql.connect(**DB_CONFIG)
    cursor = conn.cursor()

    cursor.execute("SELECT id FROM iot_devices WHERE device_secret=%s", (device_secret,))
    device = cursor.fetchone()
    if not device:
        return
    device_id = device[0]

    for io in data.get("ios", []):
        cursor.execute("""
            INSERT INTO iot_device_io_status (device_id, io_type, io_index, status)
            VALUES (%s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE status=%s, updated_at=NOW()
        """, (device_id, io['type'], io['index'], io['status'], io['status']))

        cursor.execute("""
            INSERT INTO iot_device_io_history (device_id, io_type, io_index, previous_status, new_status, changed_by)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (device_id, io['type'], io['index'], None, io['status'], 'device'))

    conn.commit()
    cursor.close()
    conn.close()

client = mqtt.Client()
client.on_connect = on_connect
client.on_message = on_message

client.connect("localhost", 1883, 60)
client.loop_forever()