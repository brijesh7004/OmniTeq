<?php
require_once '../utils/db.php';

$db = getDB();
$iot_users = $db->query("SELECT * FROM iot_users")->fetchAll(PDO::FETCH_ASSOC);
$iot_devices = $db->query("SELECT * FROM iot_devices")->fetchAll(PDO::FETCH_ASSOC);
?>
<!DOCTYPE html>
<html lang="en" class="dark-theme">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Panel - OmniTeq</title>
    <!-- Favicon -->
    <link rel="icon" href="../../../images/logo/favicon.svg" type="image/svg+xml">
    <!-- CSS Files -->
    <link rel="stylesheet" href="../../../css/style.css?v=2.1">
    <link rel="stylesheet" href="../../../css/responsive.css?v=2.1">
    <!-- Font Awesome for icons -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <!-- Theme Check -->
    <script>
        (function() {
            const savedTheme = localStorage.getItem('theme') || 'dark';
            if (savedTheme === 'dark') {
                document.documentElement.classList.add('dark-theme');
            } else {
                document.documentElement.classList.remove('dark-theme');
            }
        })();
    </script>
    <style>
        .admin-page-content {
            padding-top: 100px;
            padding-bottom: 60px;
            min-height: calc(100vh - 80px);
            background-color: var(--white);
            color: var(--dark);
            transition: var(--theme-transition);
        }
        
        .styled-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.95em;
            margin: 25px 0;
            font-family: var(--body-font);
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.15);
            border-radius: 8px;
            overflow: hidden;
            background-color: var(--light-gray);
            transition: var(--theme-transition);
        }
        
        .dark-theme .styled-table {
            background-color: var(--light);
            box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.05), var(--card-shadow);
        }

        .styled-table thead tr {
            background: var(--brand-gradient);
            color: #ffffff;
            text-align: left;
        }

        .styled-table th,
        .styled-table td {
            padding: 12px 15px;
        }
        
        .styled-table tbody tr {
            border-bottom: 1px solid rgba(0, 0, 0, 0.05);
            transition: var(--theme-transition);
        }
        
        .dark-theme .styled-table tbody tr {
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            color: var(--gray);
        }

        .styled-table tbody tr:nth-of-type(even) {
            background-color: rgba(0, 0, 0, 0.02);
        }
        
        .dark-theme .styled-table tbody tr:nth-of-type(even) {
            background-color: rgba(255, 255, 255, 0.02);
        }

        .styled-table tbody tr:last-of-type {
            border-bottom: 2px solid var(--primary);
        }

        .dark-theme h2 {
            color: var(--dark);
        }
    </style>
</head>
<body>
    <!-- Simple Admin Header -->
    <header id="header">
        <div class="container">
            <div class="logo">
                <a href="../../../index.html">
                    <img src="../../../images/logo/logo.svg" alt="OmniTeq Logo" id="navbar-logo">
                    <script>if(localStorage.getItem('theme') === 'light') document.getElementById('navbar-logo').src='../../../images/logo/logo-white.svg';</script>
                </a>
            </div>
            
            <ul class="nav-menu">
                <li><a href="../../../index.html">Main Site <i class="fas fa-external-link-alt" style="font-size:0.8rem;margin-left:4px;"></i></a></li>
            </ul>

            <div class="nav-actions">
                <button class="theme-toggle" aria-label="Toggle dark mode" id="theme-toggle">
                    <i class="fas fa-sun"></i>
                    <i class="fas fa-moon"></i>
                </button>
            </div>
        </div>
    </header>

    <div class="admin-page-content">
        <div class="container">
            <div class="section-header">
                <h2>Users Management</h2>
                <p>Overview of registered IoT users</p>
            </div>
            <div style="overflow-x:auto;">
                <table class="styled-table">
                <thead>
                    <tr><th>ID</th><th>Username</th><th>Email</th></tr>
                </thead>
                <tbody>
                <?php foreach ($iot_users as $user): ?>
                <tr>
                <td><?= htmlspecialchars($user['id']) ?></td>
                <td><?= htmlspecialchars($user['username']) ?></td>
                <td><?= htmlspecialchars($user['email']) ?></td>
                </tr>
                <?php endforeach; ?>
                </tbody>
                </table>
            </div>

            <div class="section-header" style="margin-top: 50px;">
                <h2>IoT Devices</h2>
                <p>Registry of connected hardware</p>
            </div>
            <div style="overflow-x:auto;">
                <table class="styled-table">
                <thead>
                    <tr><th>ID</th><th>User ID</th><th>Name</th><th>Secret</th></tr>
                </thead>
                <tbody>
                <?php foreach ($iot_devices as $dev): ?>
                <tr>
                <td><?= htmlspecialchars($dev['id']) ?></td>
                <td><?= htmlspecialchars($dev['user_id']) ?></td>
                <td><?= htmlspecialchars($dev['device_name']) ?></td>
                <td><?= htmlspecialchars($dev['device_secret']) ?></td>
                </tr>
                <?php endforeach; ?>
                </tbody>
                </table>
            </div>
        </div>
    </div>

    <!-- JavaScript Files for Theme Toggle -->
    <script src="../../../js/main.js?v=1.1"></script>
</body>
</html>