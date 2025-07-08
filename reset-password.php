<?php
session_start();

// Check if token is provided in URL
$token = isset($_GET['token']) ? $_GET['token'] : '';

// Check if token exists
if (empty($token)) {
    header('Location: /reset-password.php');
    exit;
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Password - OmniTeq</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f5f5f5;
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
        }

        .reset-container {
            background: white;
            padding: 2rem;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            width: 100%;
            max-width: 400px;
        }

        .reset-header {
            text-align: center;
            margin-bottom: 2rem;
        }

        .reset-header h1 {
            color: #333;
            margin: 0;
        }

        .reset-form {
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }

        .form-group {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }

        .form-group label {
            color: #666;
            font-weight: 500;
        }

        .form-group input {
            padding: 0.75rem;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 1rem;
        }

        .form-group input:focus {
            outline: none;
            border-color: #007bff;
        }

        .reset-btn {
            background-color: #007bff;
            color: white;
            padding: 0.75rem;
            border: none;
            border-radius: 4px;
            font-size: 1rem;
            cursor: pointer;
            transition: background-color 0.3s;
        }

        .reset-btn:hover {
            background-color: #0056b3;
        }

        .error-message {
            color: #dc3545;
            padding: 0.5rem;
            border-radius: 4px;
            background-color: #f8d7da;
            margin: 1rem 0;
        }

        .success-message {
            color: #28a745;
            padding: 0.5rem;
            border-radius: 4px;
            background-color: #d4edda;
            margin: 1rem 0;
        }
    </style>
</head>
<body>
    <div class="reset-container">
        <div class="reset-header">
            <h1>Reset Password</h1>
        </div>
        
        <?php
        if (isset($_SESSION['reset_error'])) {
            echo '<div class="error-message">' . $_SESSION['reset_error'] . '</div>';
            unset($_SESSION['reset_error']);
        }
        
        if (isset($_SESSION['reset_success'])) {
            echo '<div class="success-message">' . $_SESSION['reset_success'] . '</div>';
            unset($_SESSION['reset_success']);
        }
        
        // Display success message if password was reset
        if (isset($_GET['success']) && $_GET['success'] === 'true') {
            echo '<div class="success-message">
                <p>Your password has been successfully reset!</p>
                <p><a href="http://omniteq.in" class="reset-btn">Return to Website</a></p>
            </div>';
            exit;
        }
        ?>
        
        <?php if (!isset($_GET['success']) || $_GET['success'] !== 'true') : ?>
        <form class="reset-form" action="api/iot-cloud-server/api/user/reset-password.php" method="POST">
            <input type="hidden" name="token" value="<?php echo htmlspecialchars($token); ?>">            
            
            <div class="form-group">
                <label for="password">New Password</label>
                <input type="password" id="password" name="password" required minlength="8">
            </div>
            
            <div class="form-group">
                <label for="confirm_password">Confirm Password</label>
                <input type="password" id="confirm_password" name="confirm_password" required minlength="8">
            </div>

            <?php if (isset($_GET['error'])) : ?>
                <div class="error-message"><?php echo htmlspecialchars($_GET['error']); ?></div>
            <?php endif; ?>
            
            <button type="submit" class="reset-btn">Reset Password</button>
        </form>
        <?php endif; ?>
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const password = document.getElementById('password');
            const confirmPassword = document.getElementById('confirm_password');
            const form = document.querySelector('form');

            form.addEventListener('submit', function(e) {
                if (password.value !== confirmPassword.value) {
                    e.preventDefault();
                    alert('Passwords do not match!');
                }
            });
        });
    </script>
</body>
</html>
