<?php
require_once 'config.php';

function sendEmail($to, $subject, $body, $adminEmail = null) {
    // Headers for HTML email
    $headers = 'MIME-Version: 1.0' . "\r\n";
    $headers .= 'Content-type: text/html; charset=UTF-8' . "\r\n";
    $headers .= 'From: ' . SMTP_FROM_EMAIL . "\r\n";
    $headers .= 'Reply-To: ' . SMTP_FROM_EMAIL . "\r\n";
    $headers .= 'X-Mailer: PHP/' . phpversion();

    // Send to user
    $userSuccess = mail($to, $subject, $body, $headers);

    // Send to admin if specified
    $adminSuccess = true;
    if ($adminEmail) {
        $adminSubject = 'New ' . $subject;
        $adminBody = "<h3>New submission received</h3>" . $body;
        $adminSuccess = mail($adminEmail, $adminSubject, $adminBody, $headers);
    }

    return $userSuccess && $adminSuccess;
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
