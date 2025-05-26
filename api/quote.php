<?php
require_once 'utils.php';
require_once 'send_mail.php';

$method = $_SERVER['REQUEST_METHOD'];
$conn = getConnection();

switch ($method) {
    case 'GET':
        if (isset($_GET['id'])) {
            $id = (int)$_GET['id'];
            $stmt = $conn->prepare("SELECT * FROM quote_requests WHERE id = ?");
            $stmt->bind_param("i", $id);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($result->num_rows > 0) {
                sendResponse(200, "Success", $result->fetch_assoc());
            } else {
                sendResponse(404, "Quote request not found");
            }
        } else {
			if(isset($_GET['status'])){ $status=" where status='{$_GET['status']}' "; } else { $status=""; }
			
            $pagination = getPaginationParams();
            $stmt = $conn->prepare("SELECT * FROM quote_requests {$status} ORDER BY created_at DESC LIMIT ?, ?");
            $stmt->bind_param("ii", $pagination['offset'], $pagination['size']);
            $stmt->execute();
            $result = $stmt->get_result();

            $data = [];
            while ($row = $result->fetch_assoc()) {
                $data[] = $row;
            }

            $totalResult = $conn->query("SELECT COUNT(*) as total FROM quote_requests");
            $totalCount = $totalResult->fetch_assoc()['total'];

            sendResponse(200, "Success", [
                'items' => $data,
                'total' => (int)$totalCount
            ]);
        }
        break;

    case 'POST':
        $data = getRequestData();
        validateRequired($data, ['name', 'email', 'phone', 'project_type', 'project_details']);

        $fileAttachments = [];
        if (isset($_FILES['files'])) {
            $uploadDir = '../uploads/quotes/';
            if (!file_exists($uploadDir)) mkdir($uploadDir, 0777, true);
            
            foreach ($_FILES['files']['tmp_name'] as $key => $tmp_name) {
                $fileName = $_FILES['files']['name'][$key];
                $fileSize = $_FILES['files']['size'][$key];
                $fileType = $_FILES['files']['type'][$key];

                if (empty($fileName) || $fileSize == 0) continue;

                $allowedTypes = [
                    'application/pdf', 'application/msword', 
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'application/vnd.ms-powerpoint',
                    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                    'image/jpeg', 'image/png'
                ];

                if (!in_array($fileType, $allowedTypes)) {
                    sendResponse(400, "Invalid file type: $fileName");
                }

                if ($fileSize > 10 * 1024 * 1024) {
                    sendResponse(400, "File too large: $fileName");
                }

                $uniqueName = uniqid() . '_' . $fileName;
                $filePath = $uploadDir . $uniqueName;

                if (move_uploaded_file($tmp_name, $filePath)) {
                    $fileAttachments[] = $filePath;
                }
            }
        }

        $data = sanitizeInput($data);
        $attachments = !empty($fileAttachments) ? json_encode($fileAttachments) : null;

        $stmt = $conn->prepare("
            INSERT INTO quote_requests (
                name, email, phone, company, project_type,
                budget_range, timeline, hear_about,
                project_details, file_attachments, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
        ");

        $stmt->bind_param(
            "ssssssssss",
            $data['name'], $data['email'], $data['phone'], $data['company'],
            $data['project_type'], $data['budget_range'], $data['timeline'],
            $data['hear_about'], $data['project_details'], $attachments
        );

        if ($stmt->execute()) {
            try {
                $formData = ['name' => $data['name'], 'email' => $data['email'], 
                             'company_email' => QUOTES_EMAIL, 'type' => 'quote'];
                $ackTitle = 'Thank you for your quote request';
                $ackEmailBody = generateEmailBody($data, 'quote', FALSE);
                $notTitle = 'New Quote Form Submission';
                $notEmailBody = generateEmailBody($data, 'quote', TRUE);                

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
                sendResponse(201, "Quote request sent successfully", ['id' => $stmt->insert_id]);
            } catch (Exception $e) {
                error_log('Quote form email error: ' . $e->getMessage());
                sendResponse(500, "Quote request saved but email failed: " . $e->getMessage());
            }
        } else {
            sendResponse(500, "Error creating quote request: " . $stmt->error);
        }
        break;

    case 'PUT':
        if (!isset($_GET['id'])) {
            sendResponse(400, "Missing ID parameter");
        }

        $id = (int)$_GET['id'];
        $data = sanitizeInput(getRequestData());

        $allowedFields = [
            'name', 'email', 'phone', 'company', 'project_type',
            'budget_range', 'timeline', 'hear_about',
            'project_details', 'status'
        ];

        $updates = [];
        $params = [];
        $types = '';

        foreach ($data as $key => $value) {
            if (in_array($key, $allowedFields)) {
                $updates[] = "$key = ?";
                $params[] = $value;
                $types .= 's';
            }
        }

        if (empty($updates)) {
            sendResponse(400, "No valid fields to update");
        }

        $types .= 'i';
        $params[] = $id;

        $stmt = $conn->prepare("UPDATE quote_requests SET " . implode(', ', $updates) . " WHERE id = ?");
        $stmt->bind_param($types, ...$params);

        if ($stmt->execute()) {
            if ($stmt->affected_rows > 0) {
                sendResponse(200, "Quote request updated successfully");
            } else {
                sendResponse(404, "Quote request not found");
            }
        } else {
            sendResponse(500, "Error updating quote request: " . $stmt->error);
        }
        break;

    case 'DELETE':
        if (!isset($_GET['id'])) {
            sendResponse(400, "Missing ID parameter");
        }

        $id = (int)$_GET['id'];

        $stmt = $conn->prepare("SELECT file_attachments FROM quote_requests WHERE id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        
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

        $stmt = $conn->prepare("DELETE FROM quote_requests WHERE id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();

        if ($stmt->affected_rows > 0) {
            sendResponse(200, "Quote request deleted successfully");
        } else {
            sendResponse(404, "Quote request not found");
        }
        break;

    default:
        sendResponse(405, "Method not allowed");
}

$conn->close();
?>
