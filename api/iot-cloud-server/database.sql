
-- iot_users TABLE
CREATE TABLE iot_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- iot_devices TABLE
CREATE TABLE iot_devices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    device_name VARCHAR(100) NOT NULL,
    device_secret VARCHAR(100) UNIQUE NOT NULL,
    input_count INT DEFAULT 0,
    output_count INT DEFAULT 0,
    last_seen DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES iot_users(id) ON DELETE CASCADE
);

-- DEVICE I/O STATUS TABLE
CREATE TABLE iot_device_io_status (
    id INT AUTO_INCREMENT PRIMARY KEY,
    device_id INT NOT NULL,
    io_type ENUM('input', 'output') NOT NULL,
    io_index INT NOT NULL,
    status TINYINT(1) NOT NULL DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (device_id) REFERENCES iot_devices(id) ON DELETE CASCADE
);

-- DEVICE LOGS TABLE
CREATE TABLE iot_device_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    device_id INT NOT NULL,
    topic VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (device_id) REFERENCES iot_devices(id) ON DELETE CASCADE
);

-- DEVICE I/O STATUS HISTORY TABLE
CREATE TABLE iot_device_io_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    device_id INT NOT NULL,
    io_type ENUM('input', 'output') NOT NULL,
    io_index INT NOT NULL,
    previous_status TINYINT(1),
    new_status TINYINT(1),
    changed_by ENUM('device', 'app') DEFAULT 'device',
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (device_id) REFERENCES iot_devices(id) ON DELETE CASCADE
);
