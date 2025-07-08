<?php
require_once '../utils/db.php';

$db = getDB();
$iot_users = $db->query("SELECT * FROM iot_users")->fetchAll(PDO::FETCH_ASSOC);
$iot_devices = $db->query("SELECT * FROM iot_devices")->fetchAll(PDO::FETCH_ASSOC);
?>
<!DOCTYPE html>
<html>
<head><title>Admin Panel</title></head>
<body>
<h2>Users</h2>
<table border="1">
<tr><th>ID</th><th>Username</th><th>Email</th></tr>
<?php foreach ($iot_users as $user): ?>
<tr>
<td><?= $user['id'] ?></td>
<td><?= $user['username'] ?></td>
<td><?= $user['email'] ?></td>
</tr>
<?php endforeach; ?>
</table>

<h2>iot_devices</h2>
<table border="1">
<tr><th>ID</th><th>User ID</th><th>Name</th><th>Secret</th></tr>
<?php foreach ($iot_devices as $dev): ?>
<tr>
<td><?= $dev['id'] ?></td>
<td><?= $dev['user_id'] ?></td>
<td><?= $dev['device_name'] ?></td>
<td><?= $dev['device_secret'] ?></td>
</tr>
<?php endforeach; ?>
</table>
</body>
</html>