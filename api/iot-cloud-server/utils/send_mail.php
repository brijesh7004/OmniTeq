<?php
// send_mail.php - Enhanced email handling with robust error checking and logging
require_once '../../../config.php';
require_once '../../../phpmailer/src/Exception.php';
require_once '../../../phpmailer/src/PHPMailer.php';
require_once '../../../phpmailer/src/SMTP.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
use PHPMailer\PHPMailer\SMTP;

function validateEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL);
}

function logEmailError($type, $error, $details = []) {
    $timestamp = date('Y-m-d H:i:s');
    $logMessage = "[$timestamp] $type Error: $error";
    if (!empty($details)) {
        $logMessage .= " | Details: " . json_encode($details);
    }
    error_log($logMessage);
    return false;
}

function configureMailer($mailer, $recipientEmail, $recipientName = '') {
    try {
        // Debug settings
        $mailer->SMTPDebug = SMTP::DEBUG_SERVER; // Enable verbose debug output
        $mailer->Debugoutput = function($str, $level) {
            //if you want to debug then enable this
            //error_log("DEBUG [$level]: $str"); 
        };

        // Basic SMTP settings
        $mailer->isSMTP();
        $mailer->Host = mail_host;
        $mailer->Port = mail_port;
        
        // Authentication
        $mailer->SMTPAuth = true;
        $mailer->Username = MAIL_USERNAME;
        $mailer->Password = MAIL_PASSWORD;
        
        // TLS/SSL Settings
        $mailer->SMTPSecure = 'ssl';
        $mailer->SMTPOptions = array(
            'ssl' => array(
                'verify_peer' => false,
                'verify_peer_name' => false,
                'allow_self_signed' => true
            )
        );
        
        // Timeout settings
        $mailer->Timeout = 30; // Timeout in seconds
        
        // Email format settings
        $mailer->isHTML(true);
        $mailer->CharSet = 'UTF-8';
        
        // Clear recipients and add new one
        $mailer->clearAddresses();
        if ($recipientName) {
            $mailer->addAddress($recipientEmail, $recipientName);
        } else {
            $mailer->addAddress($recipientEmail);
        }
        
        // Log configuration
        //error_log("Mail Configuration - Host: {$mailer->Host}, Port: {$mailer->Port}, Username: {$mailer->Username}");
        
        return true;
    } catch (Exception $e) {
        error_log("Mail Configuration Error: " . $e->getMessage());
        return logEmailError('Configuration', $e->getMessage(), [
            'host' => mail_host,
            'port' => mail_port,
            'username' => MAIL_USERNAME,
            'recipient' => $recipientEmail
        ]);
    }
}

function sendEmails($email, $username, $token) {
    // Input validation
    if (empty($email) || !validateEmail($email)) {
        return logEmailError('Validation', 'Invalid email address', ['email' => $email]);
    }

    $userName = htmlspecialchars($username);
    $userEmail = filter_var($email, FILTER_SANITIZE_EMAIL);
    $acktitle = "Omniteq - Password Reset";
    $ackbody = generateResetEmailBody($userName, $token);
    $ackaltbody = "You have recieved a password reset token. Please use it to reset your password.";
    $success = false;
        
    // Send acknowledgment email
    $ack = new PHPMailer(true);
    try {
        if (!configureMailer($ack, $userEmail, $userName)) {
            throw new Exception('Failed to configure acknowledgment email');
        }
        
        $ack->setFrom(MAIL_FROM, MAIL_FROM_NAME);
        $ack->Subject = $acktitle;
        $ack->Body = $ackbody;
        $ack->AltBody = $ackaltbody;
        
        // error_log("Attempting to send acknowledgment email to: $userEmail");
        if (!$ack->send()) {
            throw new Exception($ack->ErrorInfo);
        }else{
            $success = true;
        }
        // error_log("Successfully sent acknowledgment email to: $userEmail");
    } catch (Exception $e) {
        error_log("Failed to send acknowledgment email: " . $e->getMessage());
        $success = logEmailError('Acknowledgment', $e->getMessage(), [
            'error_info' => $ack->ErrorInfo,
            'smtp_debug' => $ack->SMTPDebug
        ]);
    }
    
    return $success;
}

function generateResetEmailBody($username, $token) {
    $body = "<h2 style='color: #333;'>Password Reset</h2>"
        . "<p>Dear $username,</p>"
        . "<p>You have requested to reset your password.</p>"
        . "<p>Following is your password reset token:</p>"
        . "<p>$token</p>"
        . "<p>Click the link below to reset your password:</p>"
        . "<p>https://omniteq.in/reset-password.php?token=$token</p>"
        . "<p>Above Token valid for next 1 hour.</p>"
        . "<p></p>"
        . "<p>Thank you for using Omniteq.</p>";

    return $body;
}
?>