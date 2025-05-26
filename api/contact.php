<?php
require_once 'utils.php';
require_once 'send_mail.php'; 

$method = $_SERVER['REQUEST_METHOD'];
$conn = getConnection();

switch ($method) {
    case 'GET':
        if (isset($_GET['id'])) {
            $id = (int)$_GET['id'];
            $stmt = $conn->prepare("SELECT * FROM contact_submissions WHERE id = ?");
            $stmt->bind_param("i", $id);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($result->num_rows > 0) {
                sendResponse(200, "Success", $result->fetch_assoc());
            } else {
                sendResponse(404, "Contact submission not found");
            }
            $stmt->close();
        } else {
            // Pagination
            $pagination = getPaginationParams();
            $stmt = $conn->prepare("SELECT * FROM contact_submissions ORDER BY created_at DESC LIMIT ?, ?");
            $stmt->bind_param("ii", $pagination['offset'], $pagination['size']);
            $stmt->execute();
            $result = $stmt->get_result();
            
            $data = [];
            while ($row = $result->fetch_assoc()) {
                $data[] = $row;
            }

            $countResult = $conn->query("SELECT COUNT(*) as total FROM contact_submissions");
            $totalCount = $countResult->fetch_assoc()['total'];
            
            sendResponse(200, "Success", [
                'items' => $data,
                'total' => (int)$totalCount
            ]);
            $stmt->close();
        }
        break;

    case 'POST':
        $data = getRequestData();
        validateRequired($data, ['name', 'email', 'phone', 'subject', 'message']);
        $data = sanitizeInput($data);

        $stmt = $conn->prepare("INSERT INTO contact_submissions (name, email, phone, subject, message) VALUES (?, ?, ?, ?, ?)");
        $stmt->bind_param("sssss", $data['name'], $data['email'], $data['phone'], $data['subject'], $data['message']);
        
        if ($stmt->execute()) {
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
            sendResponse(500, "Error creating contact submission: " . $stmt->error);
        }
        $stmt->close();
        break;

    case 'PUT':
        if (!isset($_GET['id'])) {
            sendResponse(400, "Missing ID parameter");
        }
        $id = (int)$_GET['id'];
        $data = sanitizeInput(getRequestData());

        // Valid keys
        $allowed = ['name', 'email', 'phone', 'subject', 'message'];
        $updates = [];
        $values = [];

        foreach ($allowed as $key) {
            if (isset($data[$key])) {
                $updates[] = "$key = ?";
                $values[] = $data[$key];
            }
        }

        if (empty($updates)) {
            sendResponse(400, "No valid fields to update");
        }

        $types = str_repeat("s", count($values)) . "i"; // Add "i" for id
        $values[] = $id;

        $stmt = $conn->prepare("UPDATE contact_submissions SET " . implode(', ', $updates) . " WHERE id = ?");
        $stmt->bind_param($types, ...$values);

        if ($stmt->execute()) {
            if ($stmt->affected_rows > 0) {
                sendResponse(200, "Contact submission updated successfully");
            } else {
                sendResponse(404, "Contact submission not found");
            }
        } else {
            sendResponse(500, "Error updating contact submission: " . $stmt->error);
        }
        $stmt->close();
        break;

    case 'DELETE':
        if (!isset($_GET['id'])) {
            sendResponse(400, "Missing ID parameter");
        }
        $id = (int)$_GET['id'];
        $stmt = $conn->prepare("DELETE FROM contact_submissions WHERE id = ?");
        $stmt->bind_param("i", $id);

        if ($stmt->execute()) {
            if ($stmt->affected_rows > 0) {
                sendResponse(200, "Contact submission deleted successfully");
            } else {
                sendResponse(404, "Contact submission not found");
            }
        } else {
            sendResponse(500, "Error deleting contact submission: " . $stmt->error);
        }
        $stmt->close();
        break;

    default:
        sendResponse(405, "Method not allowed");
}

$conn->close();
?>
