<?php
require_once __DIR__ . '/../auth/db.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

if (!$data) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid data']);
    exit;
}

$userId = $_SESSION['user_id'];
$category = $data['category'] ?? 'Other';
$subject = $data['subject'] ?? '';
$description = $data['description'] ?? '';

if (empty($subject) || empty($description)) {
    echo json_encode(['status' => 'error', 'message' => 'Subject and Description are required']);
    exit;
}

$conn = getConnection();

// Generate unique ticket number
$ticketNo = 'TCK-' . rand(1000, 9999);
$check = $conn->prepare("SELECT id FROM support_tickets WHERE ticket_number = ?");
$check->bind_param("s", $ticketNo);
$check->execute();
if ($check->get_result()->num_rows > 0) {
    $ticketNo = 'TCK-' . rand(10000, 99999);
}
$check->close();

$stmt = $conn->prepare("INSERT INTO support_tickets (user_id, ticket_number, category, subject, description) VALUES (?, ?, ?, ?, ?)");
$stmt->bind_param("issss", $userId, $ticketNo, $category, $subject, $description);

if ($stmt->execute()) {
    echo json_encode(['status' => 'success', 'message' => 'Ticket created successfully', 'ticket_number' => $ticketNo]);
} else {
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $conn->error]);
}

$stmt->close();
$conn->close();
