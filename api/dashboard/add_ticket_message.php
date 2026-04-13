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
$userId = $_SESSION['user_id'];
$ticketId = $data['ticket_id'] ?? null;
$message = $data['message'] ?? '';

if (!$ticketId || empty($message)) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid data']);
    exit;
}

$conn = getConnection();

// Verify ticket belongs to user
$check = $conn->prepare("SELECT id FROM support_tickets WHERE id = ? AND user_id = ?");
$check->bind_param("ii", $ticketId, $userId);
$check->execute();
if ($check->get_result()->num_rows === 0) {
    echo json_encode(['status' => 'error', 'message' => 'Access denied']);
    exit;
}
$check->close();

$stmt = $conn->prepare("INSERT INTO ticket_messages (ticket_id, sender_id, message, is_admin_reply) VALUES (?, ?, ?, 0)");
$stmt->bind_param("iis", $ticketId, $userId, $message);

if ($stmt->execute()) {
    // Update ticket updated_at
    $conn->query("UPDATE support_tickets SET updated_at = NOW() WHERE id = $ticketId");
    echo json_encode(['status' => 'success']);
} else {
    echo json_encode(['status' => 'error', 'message' => 'Database error']);
}

$stmt->close();
$conn->close();
