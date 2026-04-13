<?php
// Session check or other logic can go here
?>
<!DOCTYPE html>
<html lang="en" class="dark-theme">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>User Dashboard - OmniTeq</title>
    <meta name="description"
        content="Manage your OmniTeq IoT devices, view order history, profile settings, and support queries.">
    <!-- Favicon -->
    <link rel="icon" href="../images/logo/favicon.svg" type="image/svg+xml">

    <!-- Global CSS Files -->
    <link rel="stylesheet" href="../css/style.css?v=3.6">
    <!-- Dashboard Specific CSS -->
    <link rel="stylesheet" href="../css/dashboard.css?v=1.0">
    <!-- Refined Dashboard Styles (Extracted) -->
    <link rel="stylesheet" href="css/dashboard_refined.css?v=1.0">

    <!-- Font Awesome for icons -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">

    <!-- Theme Check -->
    <script>
        (function () {
            const savedTheme = localStorage.getItem('theme') || 'dark';
            if (savedTheme === 'dark') {
                document.documentElement.classList.add('dark-theme');
            } else {
                document.documentElement.classList.remove('dark-theme');
            }
        })();
    </script>
</head>

<body class="dashboard-page">
    <div class="dashboard-container">
        <!-- Sidebar Navigation -->
        <aside class="dashboard-sidebar" id="sidebar">
            <div class="sidebar-header">
                <a href="../index.html">
                    <img src="../images/logo/logo.svg" alt="OmniTeq Logo" id="sidebar-logo">
                    <script>if (localStorage.getItem('theme') === 'dark') document.getElementById('sidebar-logo').src = '../images/logo/logo-white.svg';</script>
                </a>
                <button class="mobile-close-btn" id="mobile-close"><i class="fas fa-times"></i></button>
            </div>

            <nav class="sidebar-nav">
                <ul class="nav-list">
                    <li class="nav-item">
                        <a href="#overview" class="nav-link active" data-tab="overview">
                            <i class="fas fa-home"></i> <span>Overview</span>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="#products" class="nav-link" data-tab="products">
                            <i class="fas fa-microchip"></i> <span>My Products</span>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="#orders" class="nav-link" data-tab="orders">
                            <i class="fas fa-box-open"></i> <span>Order History</span>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="#queries" class="nav-link" data-tab="queries">
                            <i class="fas fa-ticket-alt"></i> <span>Query Page</span>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="#profile" class="nav-link" data-tab="profile">
                            <i class="fas fa-user-cog"></i> <span>Profile Settings</span>
                        </a>
                    </li>
                </ul>
            </nav>

            <div class="sidebar-footer">
                <a href="#" class="nav-link logout-link" onclick="handleLogout(event)">
                    <i class="fas fa-sign-out-alt"></i> <span>Logout</span>
                </a>
            </div>
        </aside>

        <!-- Main Content Area -->
        <main class="dashboard-main">
            <!-- Top Header -->
            <header class="dashboard-header">
                <div class="header-left">
                    <button class="sidebar-toggle" id="sidebar-toggle">
                        <i class="fas fa-bars"></i>
                    </button>
                    <h2 id="current-page-title">Overview</h2>
                </div>

                <div class="header-right">
                    <button class="theme-toggle" aria-label="Toggle dark mode" id="dashboard-theme-toggle">
                        <i class="fas fa-sun"></i>
                        <i class="fas fa-moon"></i>
                    </button>
                    <div class="notification-bell">
                        <i class="fas fa-bell"></i>
                    </div>
                    <div class="user-profile-menu">
                        <img src="https://placehold.co/40x40/0066cc/FFFFFF?text=JD" id="header-avatar" alt="User Avatar"
                            class="avatar">
                        <span class="user-name" id="header-user-name">John Doe</span>
                    </div>
                </div>
            </header>

            <!-- Dynamic Tab Content -->
            <div class="dashboard-content">
                <?php include 'components/dash_overview.php'; ?>
                <?php include 'components/dash_products.php'; ?>
                <?php include 'components/dash_orders.php'; ?>
                <?php include 'components/dash_queries.php'; ?>
                <?php include 'components/dash_profile.php'; ?>
            </div>
        </main>
    </div>

    <!-- MODALS SECTION -->
    <?php include 'components/modals.php'; ?>

    <!-- JavaScript Files -->
    <script src="../js/main.js"></script>
    <script src="js/dashboard.js"></script>
</body>

</html>