<?php
// send_mail.php - Enhanced email handling with robust error checking and logging
require_once 'config.php';
require_once 'phpmailer/src/Exception.php';
require_once 'phpmailer/src/PHPMailer.php';
require_once 'phpmailer/src/SMTP.php';

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
            error_log("DEBUG [$level]: $str");
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
        error_log("Mail Configuration - Host: {$mailer->Host}, Port: {$mailer->Port}, Username: {$mailer->Username}");
        
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

function sendEmails($formData, $ackTitle, $ackEmailBody, $notTitle, $notEmailBody) {
    // Input validation
    if (empty($formData['email']) || !validateEmail($formData['email'])) {
        return logEmailError('Validation', 'Invalid email address', ['email' => $formData['email']]);
    }

    $userName = htmlspecialchars($formData['name']);
    $userEmail = filter_var($formData['email'], FILTER_SANITIZE_EMAIL);
    $companyEmail = filter_var($formData['company_email'], FILTER_SANITIZE_EMAIL);
    $type = $formData['type'];
    
    $success = true;
    error_log("Starting email send process for user: $userEmail");
    
    // Send acknowledgment email
    $ack = new PHPMailer(true);
    try {
        if (!configureMailer($ack, $userEmail, $userName)) {
            throw new Exception('Failed to configure acknowledgment email');
        }
        
        $ack->setFrom(MAIL_FROM, MAIL_FROM_NAME);
        $ack->Subject = $ackTitle;
        $ack->Body = $ackEmailBody;
        $ack->AltBody = "Thank you for contacting Omniteq, $userName. We have received your message and will get back to you shortly.";
        
        // error_log("Attempting to send acknowledgment email to: $userEmail");
        if (!$ack->send()) {
            throw new Exception($ack->ErrorInfo);
        }
        // error_log("Successfully sent acknowledgment email to: $userEmail");
    } catch (Exception $e) {
        error_log("Failed to send acknowledgment email: " . $e->getMessage());
        $success = logEmailError('Acknowledgment', $e->getMessage(), [
            'error_info' => $ack->ErrorInfo,
            'smtp_debug' => $ack->SMTPDebug
        ]);
    }
    
    // Send notification email to admin
    $notify = new PHPMailer(true);
    try {
        if (!configureMailer($notify, $companyEmail)) {
            throw new Exception('Failed to configure notification email');
        }
        
        $notify->setFrom(MAIL_FROM, MAIL_FROM_NAME);    //$type . ' Notification'
        $notify->Subject = $notTitle;
        $notify->Body = $notEmailBody;
        
        if (!$notify->send()) {
            throw new Exception($notify->ErrorInfo);
        }
    } catch (Exception $e) {
        $success = logEmailError('Notification', $e->getMessage());
    }
    
    return $success;
}

function generateEmailBody($data, $type, $isCompany = false) {
    $body = "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>";          

    if ($isCompany) {
        $body .= "<h2 style='color: #333;'>We got new {$type} submission</h2>"
            . "<p>Here are the details:</p>";
    } else {
        $body .= "<h2 style='color: #333;'>Thank you for contacting OmniTeq</h2>"
            . "<p>We have received your {$type} request. Here are the details:</p>";
    }
    
    $body .= "<table style='width: 100%; border-collapse: collapse; margin: 20px 0;'>"
          . "<tr style='background-color: #f8f8f8;'>"
          . "<th style='padding: 12px; text-align: left; border: 1px solid #ddd;'>Field</th>"
          . "<th style='padding: 12px; text-align: left; border: 1px solid #ddd;'>Value</th>"
          . "</tr>";

    foreach ($data as $key => $value) {
        if ($key !== 'files' && !empty($value)) {
            $label = ucwords(str_replace('_', ' ', $key));
            $body .= "<tr>"
                  . "<td style='padding: 12px; border: 1px solid #ddd;'><strong>{$label}</strong></td>"
                  . "<td style='padding: 12px; border: 1px solid #ddd;'>{$value}</td>"
                  . "</tr>";
        }
    }

    $body .= "</table>"
          . "<p style='margin: 20px 0;'>We will get back to you soon.</p>"
          . "<hr style='border: 1px solid #eee; margin: 30px 0;'>"
          . "<p style='color: #666; font-size: 12px;'>This is an automated email. Please do not reply.</p>"
          . "</div>";

    return $body;
}
?>