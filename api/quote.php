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
            $sql = "SELECT * FROM quote_requests WHERE id = '$id'";
            $result = $conn->query($sql);
            
            if ($result->num_rows > 0) {
                sendResponse(200, "Success", $result->fetch_assoc());
            } else {
                sendResponse(404, "Quote request not found");
            }
        } else {
            // Get all entries with pagination
            $pagination = getPaginationParams();
            $sql = "SELECT * FROM quote_requests ORDER BY created_at DESC LIMIT {$pagination['offset']}, {$pagination['size']}";
            $result = $conn->query($sql);
            
            $data = [];
            while ($row = $result->fetch_assoc()) {
                $data[] = $row;
            }
            
            // Get total count
            $countResult = $conn->query("SELECT COUNT(*) as total FROM quote_requests");
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
        validateRequired($data, ['name', 'email', 'phone', 'project_type', 'project_details']);
        
        // Handle file upload if present
        $fileAttachments = [];
        if (isset($_FILES['files'])) {
            $uploadDir = '../uploads/quotes/';
            if (!file_exists($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }
            
            foreach ($_FILES['files']['tmp_name'] as $key => $tmp_name) {
                $fileName = $_FILES['files']['name'][$key];
                $fileSize = $_FILES['files']['size'][$key];
                $fileType = $_FILES['files']['type'][$key];

                if (empty($fileName) || $fileSize == 0) {
                    continue; // skip empty files
                }
                
                // Validate file type and size
                $allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                               'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                               'image/jpeg', 'image/png'];
                               
                if (!in_array($fileType, $allowedTypes)) {
                    sendResponse(400, "Invalid file type: $fileName");
                }
                
                if ($fileSize > 10 * 1024 * 1024) { // 10MB limit
                    sendResponse(400, "File too large: $fileName");
                }
                
                $uniqueName = uniqid() . '_' . $fileName;
                $filePath = $uploadDir . $uniqueName;
                
                if (move_uploaded_file($tmp_name, $filePath)) {
                    $fileAttachments[] = $filePath;
                }
            }
        }
        
        // Sanitize input
        $data = sanitizeInput($data);
        // if(!empty($fileAttachments)){
        //     $data['file_attachments'] = json_encode($fileAttachments);
        // }
        
        $data['file_attachments'] = !empty($fileAttachments) ? json_encode($fileAttachments) : null;
        
        // Insert data
        $sql = "INSERT INTO quote_requests (
                    name, email, phone, company, project_type,
                    budget_range, timeline, hear_about,
                    project_details, file_attachments, status
                ) VALUES (
                    '{$data['name']}', '{$data['email']}', '{$data['phone']}',
                    '{$data['company']}', '{$data['project_type']}',
                    '{$data['budget_range']}', '{$data['timeline']}', '{$data['hear_about']}',
                    '{$data['project_details']}', '{$data['file_attachments']}', 'pending'
                )";
        
        if ($conn->query($sql)) {
            // Generate and send email
            try {
                $formData = ['name' => $data['name'], 'email' => $data['email'], 
                            'company_email' => QUOTES_EMAIL, 'type' => 'quote'];
                $ackTitle = 'Thank you for your quote request';
                $ackEmailBody = generateEmailBody($data, 'quote', FALSE);
                $notTitle = 'New Quote Form Submission';
                $notEmailBody = generateEmailBody($data, 'quote', TRUE);                
                
                // Add file attachments to email body if present
                if (!empty($fileAttachments)) {
                    $ackEmailBody .= "<h3>Attached Files:</h3><ul>";
                    $notEmailBody .= "<h3>Attached Files:</h3><ul>";
                    foreach ($fileAttachments as $file) {
                        $fileName = basename($file);
                        $ackEmailBody .= "<li>$fileName</li>";
                        $notEmailBody .= "<li>$fileName</li>";
                    }
                    $ackEmailBody .= "</ul>";
                    $notEmailBody .= "</ul>";
                }
                sendEmails($formData, $ackTitle, $ackEmailBody, $notTitle, $notEmailBody);

                sendResponse(201, "Quote request sent successfully", ['id' => $conn->insert_id]);
            } catch (Exception $e) {
                error_log('Quote form email error: ' . $e->getMessage());
                sendResponse(500, "Quote request saved but email failed: " . $e->getMessage());
            }
        } else {
            sendResponse(500, "Error creating quote request: " . $conn->error);
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
            'name', 'email', 'phone', 'company', 'project_type',
            'budget_range', 'timeline', 'hear_about',
            'project_details', 'status'
        ];
        
        foreach ($data as $key => $value) {
            if (in_array($key, $allowedFields)) {
                $updates[] = "$key = '$value'";
            }
        }
        
        if (empty($updates)) {
            sendResponse(400, "No valid fields to update");
        }
        
        $sql = "UPDATE quote_requests SET " . implode(', ', $updates) . " WHERE id = '$id'";
        
        if ($conn->query($sql)) {
            if ($conn->affected_rows > 0) {
                sendResponse(200, "Quote request updated successfully");
            } else {
                sendResponse(404, "Quote request not found");
            }
        } else {
            sendResponse(500, "Error updating quote request: " . $conn->error);
        }
        break;

    case 'DELETE':
        if (!isset($_GET['id'])) {
            sendResponse(400, "Missing ID parameter");
        }
        
        $id = $conn->real_escape_string($_GET['id']);
        
        // Get file attachments before deleting
        $result = $conn->query("SELECT file_attachments FROM quote_requests WHERE id = '$id'");
        if ($result->num_rows > 0) {
            $files = json_decode($result->fetch_assoc()['file_attachments'], true);
            if ($files) {
                foreach ($files as $file) {
                    if (file_exists($file)) {
                        unlink($file);
                    }
                }
            }
        }
        
        $sql = "DELETE FROM quote_requests WHERE id = '$id'";
        
        if ($conn->query($sql)) {
            if ($conn->affected_rows > 0) {
                sendResponse(200, "Quote request deleted successfully");
            } else {
                sendResponse(404, "Quote request not found");
            }
        } else {
            sendResponse(500, "Error deleting quote request: " . $conn->error);
        }
        break;

    default:
        sendResponse(405, "Method not allowed");
}

$conn->close();
?>
