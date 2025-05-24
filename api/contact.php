<?php
require_once 'utils.php';
// require_once 'email_helper.php';
require_once 'send_mail.php'; 

$method = $_SERVER['REQUEST_METHOD'];
$conn = getConnection();

switch ($method) {
    case 'GET':
        if (isset($_GET['id'])) {
            // Get specific entry
            $id = $conn->real_escape_string($_GET['id']);
            $sql = "SELECT * FROM contact_submissions WHERE id = '$id'";
            $result = $conn->query($sql);
            
            if ($result->num_rows > 0) {
                sendResponse(200, "Success", $result->fetch_assoc());
            } else {
                sendResponse(404, "Contact submission not found");
            }
        } else {
            // Get all entries with pagination
            $pagination = getPaginationParams();
            $sql = "SELECT * FROM contact_submissions ORDER BY created_at DESC LIMIT {$pagination['offset']}, {$pagination['size']}";
            $result = $conn->query($sql);
            
            $data = [];
            while ($row = $result->fetch_assoc()) {
                $data[] = $row;
            }
            
            // Get total count
            $countResult = $conn->query("SELECT COUNT(*) as total FROM contact_submissions");
            $totalCount = $countResult->fetch_assoc()['total'];
            
            sendResponse(200, "Success", [
                'items' => $data,
                'total' => (int)$totalCount
            ]);
        }
        break;

    case 'POST':
        $data = getRequestData();
        
        // Validate required fields
        validateRequired($data, ['name', 'email', 'phone', 'subject', 'message']);
        
        // Sanitize input
        $data = sanitizeInput($data);
        
        // Insert data
        $sql = "INSERT INTO contact_submissions (name, email, phone, subject, message) 
                VALUES ('{$data['name']}', '{$data['email']}', '{$data['phone']}', '{$data['subject']}', '{$data['message']}')";
        
        if ($conn->query($sql)) {
            // Generate and send email
            try {
                $formData = ['name' => $data['name'], 'email' => $data['email'], 
                            'company_email' => CONTACT_EMAIL, 'type' => 'contact'];
                $ackTitle = 'Thank you for contacting OmniTeq';
                $ackEmailBody = generateEmailBody($data, 'contact', FALSE);
                $notTitle = 'New Contact Form Submission';
                $notEmailBody = generateEmailBody($data, 'contact', TRUE);                
                sendEmails($formData, $ackTitle, $ackEmailBody, $notTitle, $notEmailBody);

                sendResponse(201, "Contact request sent successfully", ['id' => $conn->insert_id]);
            } catch (Exception $e) {
                error_log('Contact form email error: ' . $e->getMessage());
                sendResponse(500, "Contact request saved but email failed: " . $e->getMessage());
            }
        } else {
            sendResponse(500, "Error creating contact submission: " . $conn->error);
        }
        break;

    case 'PUT':
        if (!isset($_GET['id'])) {
            sendResponse(400, "Missing ID parameter");
        }
        
        $id = $conn->real_escape_string($_GET['id']);
        $data = getRequestData();
        $data = sanitizeInput($data);
        
        // Build update query
        $updates = [];
        foreach ($data as $key => $value) {
            if (in_array($key, ['name', 'email', 'phone', 'subject', 'message'])) {
                $updates[] = "$key = '$value'";
            }
        }
        
        if (empty($updates)) {
            sendResponse(400, "No valid fields to update");
        }
        
        $sql = "UPDATE contact_submissions SET " . implode(', ', $updates) . " WHERE id = '$id'";
        
        if ($conn->query($sql)) {
            if ($conn->affected_rows > 0) {
                sendResponse(200, "Contact submission updated successfully");
            } else {
                sendResponse(404, "Contact submission not found");
            }
        } else {
            sendResponse(500, "Error updating contact submission: " . $conn->error);
        }
        break;

    case 'DELETE':
        if (!isset($_GET['id'])) {
            sendResponse(400, "Missing ID parameter");
        }
        
        $id = $conn->real_escape_string($_GET['id']);
        $sql = "DELETE FROM contact_submissions WHERE id = '$id'";
        
        if ($conn->query($sql)) {
            if ($conn->affected_rows > 0) {
                sendResponse(200, "Contact submission deleted successfully");
            } else {
                sendResponse(404, "Contact submission not found");
            }
        } else {
            sendResponse(500, "Error deleting contact submission: " . $conn->error);
        }
        break;

    default:
        sendResponse(405, "Method not allowed");
}

$conn->close();
?>
