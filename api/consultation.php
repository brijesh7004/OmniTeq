<?php
require_once 'utils.php';
require_once 'send_mail.php';

$method = $_SERVER['REQUEST_METHOD'];
$conn = getConnection();

switch ($method) {
    case 'GET':
        if (isset($_GET['id'])) {
            // Get specific entry
            $id = $conn->real_escape_string($_GET['id']);
            $sql = "SELECT * FROM consultation_bookings WHERE id = '$id'";
            $result = $conn->query($sql);
            
            if ($result->num_rows > 0) {
                sendResponse(200, "Success", $result->fetch_assoc());
            } else {
                sendResponse(404, "Consultation booking not found");
            }
        } else {
            // Get all entries with pagination
            $pagination = getPaginationParams();
            $sql = "SELECT * FROM consultation_bookings ORDER BY created_at DESC LIMIT {$pagination['offset']}, {$pagination['size']}";
            $result = $conn->query($sql);
            
            $data = [];
            while ($row = $result->fetch_assoc()) {
                $data[] = $row;
            }
            
            // Get total count
            $countResult = $conn->query("SELECT COUNT(*) as total FROM consultation_bookings");
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
        validateRequired($data, ['name', 'email', 'phone', 'consultation_type', 'preferred_date', 'preferred_time', 'project_brief']);
        
        // Sanitize input
        $data = sanitizeInput($data);
        
        // Insert data
        $sql = "INSERT INTO consultation_bookings (
                    name, email, phone, company, consultation_type, 
                    preferred_date, preferred_time, timezone, 
                    project_brief, questions, status
        ) VALUES (
            '{$data['name']}', '{$data['email']}', '{$data['phone']}',
                    '{$data['company']}', '{$data['consultation_type']}',
                    '{$data['preferred_date']}', '{$data['preferred_time']}', '{$data['timezone']}',
                    '{$data['project_brief']}', '{$data['questions']}', 'pending'
        )";
        
        if ($conn->query($sql)) {
            // Generate and send email
            try {
                $formData = ['name' => $data['name'], 'email' => $data['email'], 
                            'company_email' => SUPPORT_EMAIL, 'type' => 'consultation'];
                $ackTitle = 'Thank you for your consultation request';
                $ackEmailBody = generateEmailBody($data, 'consultation', FALSE);
                $notTitle = 'New Consultation Form Submission';
                $notEmailBody = generateEmailBody($data, 'consultation', TRUE);                
                sendEmails($formData, $ackTitle, $ackEmailBody, $notTitle, $notEmailBody);

                sendResponse(201, "Consultation request sent successfully", ['id' => $conn->insert_id]);
            } catch (Exception $e) {
                error_log('Consultation form email error: ' . $e->getMessage());
                sendResponse(500, "Consultation request saved but email failed: " . $e->getMessage());
            }
        } else {
            sendResponse(500, "Error creating consultation booking: " . $conn->error);
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
        $allowedFields = [
            'name', 'email', 'phone', 'company', 'consultation_type',
            'preferred_date', 'preferred_time', 'timezone',
            'project_brief', 'questions', 'status'
        ];
        
        foreach ($data as $key => $value) {
            if (in_array($key, $allowedFields)) {
                $updates[] = "$key = '$value'";
            }
        }
        
        if (empty($updates)) {
            sendResponse(400, "No valid fields to update");
        }
        
        $sql = "UPDATE consultation_bookings SET " . implode(', ', $updates) . " WHERE id = '$id'";
        
        if ($conn->query($sql)) {
            if ($conn->affected_rows > 0) {
                sendResponse(200, "Consultation booking updated successfully");
            } else {
                sendResponse(404, "Consultation booking not found");
            }
        } else {
            sendResponse(500, "Error updating consultation booking: " . $conn->error);
        }
        break;

    case 'DELETE':
        if (!isset($_GET['id'])) {
            sendResponse(400, "Missing ID parameter");
        }
        
        $id = $conn->real_escape_string($_GET['id']);
        $sql = "DELETE FROM consultation_bookings WHERE id = '$id'";
        
        if ($conn->query($sql)) {
            if ($conn->affected_rows > 0) {
                sendResponse(200, "Consultation booking deleted successfully");
            } else {
                sendResponse(404, "Consultation booking not found");
            }
        } else {
            sendResponse(500, "Error deleting consultation booking: " . $conn->error);
        }
        break;

    default:
        sendResponse(405, "Method not allowed");
}

$conn->close();
?>
