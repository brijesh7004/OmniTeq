<?php
session_start();

// Check if token is provided in URL
$token = isset($_GET['token']) ? $_GET['token'] : '';

// Check if token exists
if (empty($token) && !isset($_GET['success'])) {
    header('Location: login.html');
    exit;
}
?>

<!DOCTYPE html>
<html lang="en" class="dark-theme">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Password - OmniTeq</title>
    <!-- Favicon -->
    <link rel="icon" href="images/logo/favicon.svg" type="image/svg+xml">
    <!-- Boxicons -->
    <link href='https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css' rel='stylesheet'>
    <!-- CSS Files -->
    <link rel="stylesheet" href="css/style.css?v=3.6">
    <link rel="stylesheet" href="css/cloud.css">
    <link rel="stylesheet" href="css/auth.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <script>
        (function () {
            const savedTheme = localStorage.getItem('theme') || 'dark';
            if (savedTheme === 'dark') document.documentElement.classList.add('dark-theme');
        })();
    </script>
</head>
<body class="dark-theme">
    <!-- Navigation -->
    <nav class="landing-nav glass-panel">
        <div class="nav-container">
            <div class="logo">
                <a href="index.html">
                    <img src="images/logo/logo-white.svg" alt="OmniTeq Logo" id="navbar-logo">
                </a>
            </div>
            <ul class="nav-menu">
                <li><a href="index.html">Home</a></li>
                <li><a href="about.html">About Us</a></li>
                <li><a href="products.html">Products</a></li>
                <li><a href="services.html">Services</a></li>
                <li><a href="resources.html">Resources</a></li>
                <li><a href="contact.html">Contact</a></li>
            </ul>
            <div class="nav-actions">
                <a href="login.html" class="nav-auth-link">Login</a>
                <a href="register.html" class="nav-auth-btn">Register</a>
                <a href="lets-talk.html" class="cta-button">Let's Talk</a>
            </div>
        </div>
    </nav>

    <div class="login-container">
        <div class="login-left animate-on-scroll">
            <i class="fas fa-user-shield" style="font-size: 80px; color: var(--white); opacity: 0.1;"></i>
            <div class="login-welcome">
                <h1>Set New <span class="text-gradient">Password</span></h1>
                <p>Choose a strong, unique password to secure your OmniTeq account.</p>
            </div>
        </div>
        <div class="login-right animate-on-scroll delay-1">
            <div class="login-box glass-panel">
                <div class="login-title text-gradient">Create New Password</div>
                
                <?php
                if (isset($_SESSION['reset_error'])) {
                    echo '<div class="alert alert-danger" style="background: rgba(220, 53, 69, 0.1); color: #ff6b6b; padding: 10px; border-radius: 6px; margin-bottom: 20px; font-size: 0.9rem;">' . $_SESSION['reset_error'] . '</div>';
                    unset($_SESSION['reset_error']);
                }
                
                if (isset($_SESSION['reset_success'])) {
                    echo '<div class="alert alert-success" style="background: rgba(40, 167, 69, 0.1); color: #51cf66; padding: 10px; border-radius: 6px; margin-bottom: 20px; font-size: 0.9rem;">' . $_SESSION['reset_success'] . '</div>';
                    unset($_SESSION['reset_success']);
                }
                
                if (isset($_GET['success']) && $_GET['success'] === 'true') {
                    echo '<div class="text-center">
                        <p style="color: var(--text-muted-dark); margin-bottom: 20px;">Your password has been successfully reset!</p>
                        <a href="login.html" class="login-btn btn-primary" style="display: block; text-decoration: none;">Proceed to Login</a>
                    </div>';
                } else {
                ?>
                
                <form class="reset-form" action="api/iot-cloud-server/api/user/reset-password.php" method="POST" id="reset-form">
                    <input type="hidden" name="token" value="<?php echo htmlspecialchars($token); ?>">            
                    
                    <div class="mb-3">
                        <label for="password" class="form-label">New Password</label>
                        <input type="password" class="form-control" id="password" name="password" required minlength="8" placeholder="Min. 8 characters">
                    </div>
                    
                    <div class="mb-4">
                        <label for="confirm_password" class="form-label">Confirm Password</label>
                        <input type="password" class="form-control" id="confirm_password" name="confirm_password" required minlength="8" placeholder="Repeat new password">
                    </div>

                    <?php if (isset($_GET['error'])) : ?>
                        <div class="alert alert-danger" style="background: rgba(220, 53, 69, 0.1); color: #ff6b6b; padding: 10px; border-radius: 6px; margin-bottom: 20px; font-size: 0.9rem;"><?php echo htmlspecialchars($_GET['error']); ?></div>
                    <?php endif; ?>
                    
                    <button type="submit" class="login-btn btn-primary">Reset Password</button>
                </form>
                <?php } ?>
            </div>
        </div>
    </div>

    <!-- Footer -->
    <footer class="landing-footer">
        <div class="container footer-content">
            <div class="footer-brand">
                <div class="logo">
                    <a href="index.html">
                        <img src="images/logo/logo-white.svg" alt="OmniTeq Logo">
                    </a>
                </div>
                <p>Transforming industries through innovative IoT and automation solutions that drive efficiency and growth.</p>
                <div class="social-icons" style="display: flex; gap: 15px; margin-top: 25px;">
                    <a href="https://www.linkedin.com/company/omniteq-solutions/" target="_blank" class="nav-auth-link"><i class='bx bxl-linkedin'></i></a>
                    <a href="https://x.com/omniteq_info" target="_blank" class="nav-auth-link"><i class='bx bxl-twitter'></i></a>
                    <a href="https://www.instagram.com/omniteq_solutions" target="_blank" class="nav-auth-link"><i class='bx bxl-instagram'></i></a>
                    <a href="https://www.youtube.com/@Omniteq_solutions" target="_blank" class="nav-auth-link"><i class='bx bxl-youtube'></i></a>
                </div>
            </div>
            <div class="footer-links-container">
                <div class="footer-links-col">
                    <h4>Quick Links</h4>
                    <a href="index.html">Home</a>
                    <a href="about.html">About Us</a>
                    <a href="products.html">Products</a>
                    <a href="services.html">Services</a>
                    <a href="resources.html">Resources</a>
                    <a href="contact.html">Contact</a>
                </div>
                <div class="footer-links-col">
                    <h4>Our Services</h4>
                    <a href="services.html#iot">IoT Solutions</a>
                    <a href="services.html#plc">PLC Programming</a>
                    <a href="services.html#embedded">Embedded Systems</a>
                    <a href="services.html#ai-ml">AI & ML Integration</a>
                    <a href="services.html#outsourcing">Resource Outsourcing</a>
                </div>
                <div class="footer-links-col">
                    <h4>Contact Us</h4>
                    <a href="mailto:info@omniteq.in"><i class='bx bx-envelope'></i> info@omniteq.in</a>
                    <a href="tel:+919825246857"><i class='bx bx-phone'></i> +91 98252 46857</a>
                    <div style="color: var(--text-muted-dark); margin-bottom: 12px; display: flex; align-items: flex-start; gap: 8px; font-size: 14px;">
                        <i class='bx bx-map' style="font-size: 18px; color: var(--primary);"></i>
                        <span>Aditya House, Iscon Mega City, Bhavnagar</span>
                    </div>
                </div>
            </div>
        </div>
        <div class="footer-bottom">
            <p>&copy; 2026 OmniTeq Solutions. All rights reserved.</p>
        </div>
    </footer>

    <!-- JavaScript Files -->
    <script src="js/cloud.js"></script>
    <script src="js/main.js"></script>
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const password = document.getElementById('password');
            const confirmPassword = document.getElementById('confirm_password');
            const form = document.getElementById('reset-form');

            if (form) {
                form.addEventListener('submit', function(e) {
                    if (password.value !== confirmPassword.value) {
                        e.preventDefault();
                        if (window.showToast) {
                            window.showToast('Passwords do not match!', 'error');
                        } else {
                            alert('Passwords do not match!');
                        }
                    }
                });
            }
        });
    </script>
</body>
</html>
