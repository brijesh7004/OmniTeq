<?php
require_once 'utils.php';
require_once 'send_mail.php';

$method = $_SERVER['REQUEST_METHOD'];
$conn = getConnection();

switch ($method) {
    case 'GET':
        if (isset($_GET['id'])) {
            $id = (int)$_GET['id'];
            $stmt = $conn->prepare("SELECT * FROM consultation_bookings WHERE id = ?");
            $stmt->bind_param("i", $id);
            $stmt->execute();
            $result = $stmt->get_result();

            if ($result->num_rows > 0) {
                sendResponse(200, "Success", $result->fetch_assoc());
            } else {
                sendResponse(404, "Consultation booking not found");
            }

            $stmt->close();
        } else {
			if(isset($_GET['status'])){ $status=" where status='{$_GET['status']}' "; } else { $status=""; }
			
            $pagination = getPaginationParams();
            $stmt = $conn->prepare("SELECT * FROM consultation_bookings {$status} ORDER BY created_at DESC LIMIT ?, ?");
            $stmt->bind_param("ii", $pagination['offset'], $pagination['size']);
            $stmt->execute();
            $result = $stmt->get_result();

            $data = [];
            while ($row = $result->fetch_assoc()) {
                $data[] = $row;
            }

            $countResult = $conn->query("SELECT COUNT(*) as total FROM consultation_bookings");
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
        validateRequired($data, ['name', 'email', 'phone', 'consultation_type', 'preferred_date', 'preferred_time', 'project_brief']);
        $data = sanitizeInput($data);

        $stmt = $conn->prepare("INSERT INTO consultation_bookings (
            name, email, phone, company, consultation_type, 
            preferred_date, preferred_time, timezone, 
            project_brief, questions, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')");

        $stmt->bind_param("ssssssssss",
            $data['name'], $data['email'], $data['phone'], $data['company'],
            $data['consultation_type'], $data['preferred_date'], $data['preferred_time'],
            $data['timezone'], $data['project_brief'], $data['questions']
        );

        if ($stmt->execute()) {
            try {
                $formData = ['name' => $data['name'], 'email' => $data['email'], 'company_email' => SUPPORT_EMAIL, 'type' => 'consultation'];
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

        $stmt->close();
        break;

    case 'PUT':
        if (!isset($_GET['id'])) {
            sendResponse(400, "Missing ID parameter");
        }

        $id = (int)$_GET['id'];
        $data = sanitizeInput(getRequestData());

        $allowedFields = [
            'name', 'email', 'phone', 'company', 'consultation_type',
            'preferred_date', 'preferred_time', 'timezone',
            'project_brief', 'questions', 'status'
        ];

        $updates = [];
        $params = [];
        $types = '';

        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $updates[] = "$field = ?";
                $params[] = $data[$field];
                $types .= 's';
            }
        }

        if (empty($updates)) {
            sendResponse(400, "No valid fields to update");
        }

        $types .= 'i';
        $params[] = $id;
        $sql = "UPDATE consultation_bookings SET " . implode(', ', $updates) . " WHERE id = ?";

        $stmt = $conn->prepare($sql);
        $stmt->bind_param($types, ...$params);

        if ($stmt->execute()) {
            if ($stmt->affected_rows > 0) {
                sendResponse(200, "Consultation booking updated successfully");
            } else {
                sendResponse(404, "Consultation booking not found");
            }
        } else {
            sendResponse(500, "Error updating consultation booking: " . $conn->error);
        }

        $stmt->close();
        break;

    case 'DELETE':
        if (!isset($_GET['id'])) {
            sendResponse(400, "Missing ID parameter");
        }

        $id = (int)$_GET['id'];
        $stmt = $conn->prepare("DELETE FROM consultation_bookings WHERE id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();

        if ($stmt->affected_rows > 0) {
            sendResponse(200, "Consultation booking deleted successfully");
        } else {
            sendResponse(404, "Consultation booking not found");
        }

        $stmt->close();
        break;

    default:
        sendResponse(405, "Method not allowed");
}

$conn->close();
?>
