<?php
require_once 'config.php';

function debug_to_file($message) {
    $debug_file = __DIR__ . '/email_debug.log';
    $timestamp = date('Y-m-d H:i:s');
    file_put_contents($debug_file, "[$timestamp] $message\n", FILE_APPEND);
}

function sendEmail($to, $subject, $body, $adminEmail = null) {
    try {
        debug_to_file("Starting email send process");
        debug_to_file("Using PHP mail() function");
        debug_to_file("PHP Version: " . phpversion());

        // Enable verbose error reporting
        error_reporting(E_ALL);
        ini_set('display_errors', 1);
        ini_set('log_errors', 1);
        ini_set('error_log', __DIR__ . '/smtp_errors.log');

        // Get mail server configuration
        $sendmail_path = ini_get('sendmail_path');
        $smtp_host = ini_get('SMTP');
        $smtp_port = ini_get('smtp_port');
        debug_to_file("Mail Server Config - Sendmail: $sendmail_path, SMTP: $smtp_host:$smtp_port");

        // Headers for HTML email
        $headers = [];
        $headers[] = 'MIME-Version: 1.0';
        $headers[] = 'Content-type: text/html; charset=UTF-8';
        $headers[] = 'From: ' . SMTP_FROM_NAME . ' <' . SMTP_FROM_EMAIL . '>';
        $headers[] = 'Reply-To: ' . SMTP_FROM_EMAIL;
        $headers[] = 'Return-Path: ' . SMTP_FROM_EMAIL;
        $headers[] = 'X-Mailer: PHP/' . phpversion();
        $headers[] = 'X-Priority: 1';
        
        // Convert headers array to string
        $headers_str = implode("\r\n", $headers) . "\r\n";

        debug_to_file("Sending email to user: $to");


        // Add additional parameters for better delivery
        $additional_params = '-f' . SMTP_FROM_EMAIL;
        
        // Send email to user with debug info
        debug_to_file("Attempting to send email with headers:\n" . $headers_str);
        $userSuccess = mail($to, $subject, $body, $headers_str, $additional_params);
        
        if ($userSuccess) {
            debug_to_file("Email sent successfully to user: $to");
            // Check mail log for actual delivery status
            $mail_log = '/var/log/mail.log';
            if (file_exists($mail_log) && is_readable($mail_log)) {
                $log_content = shell_exec("tail -n 20 $mail_log");
                debug_to_file("Mail server log:\n$log_content");
            }
        } else {
            $error = error_get_last();
            throw new Exception("Failed to send email to user: " . ($error ? $error['message'] : 'Unknown error'));
        }

        // Send to admin if specified
        if ($adminEmail) {
            debug_to_file("Sending email to admin: $adminEmail");
            $adminSubject = "New " . $subject;
            $adminBody = "<h3>New submission received</h3>" . $body;
            
            debug_to_file("Attempting to send admin email with headers:\n" . $headers_str);
            $adminSuccess = mail($adminEmail, $adminSubject, $adminBody, $headers_str, $additional_params);
            
            if ($adminSuccess) {
                debug_to_file("Email sent successfully to admin");
                // Check mail log for actual delivery status
                $mail_log = '/var/log/mail.log';
                if (file_exists($mail_log) && is_readable($mail_log)) {
                    $log_content = shell_exec("tail -n 20 $mail_log");
                    debug_to_file("Admin mail server log:\n$log_content");
                }
            } else {
                $error = error_get_last();
                throw new Exception("Failed to send email to admin: " . ($error ? $error['message'] : 'Unknown error'));
            }
        }

        debug_to_file("Email process completed successfully");
        return true;
    } catch (Exception $e) {
        $error = isset($userMail) ? $userMail->ErrorInfo : $e->getMessage();
        debug_to_file("ERROR: Email sending failed: $error");
        error_log("Email sending failed: $error");
        throw new Exception("Failed to send email: $error");
    }
}

function generateEmailBody($data, $type) {
    $body = "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>"
          . "<h2 style='color: #333;'>Thank you for contacting OmniTeq</h2>"
          . "<p>We have received your {$type} request. Here are the details:</p>"
          . "<table style='width: 100%; border-collapse: collapse; margin: 20px 0;'>"
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
