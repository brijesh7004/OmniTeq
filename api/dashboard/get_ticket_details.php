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

$userId = $_SESSION['user_id'];
$ticketId = $_GET['id'] ?? null;

if (!$ticketId) {
    echo json_encode(['status' => 'error', 'message' => 'Ticket ID missing']);
    exit;
}

$conn = getConnection();
$stmt = $conn->prepare("SELECT id, ticket_number, category, subject, description, status, created_at FROM support_tickets WHERE id = ? AND user_id = ?");
$stmt->bind_param("ii", $ticketId, $userId);
$stmt->execute();
$ticket = $stmt->get_result()->fetch_assoc();

if (!$ticket) {
    echo json_encode(['status' => 'error', 'message' => 'Ticket not found']);
    exit;
}

// Get messages
$msgs = [];
$stmtMsg = $conn->prepare("SELECT m.message, m.is_admin_reply, m.created_at, u.full_name FROM ticket_messages m LEFT JOIN users u ON m.sender_id = u.id WHERE m.ticket_id = ? ORDER BY m.created_at ASC");
$stmtMsg->bind_param("i", $ticketId);
$stmtMsg->execute();
$resMsg = $stmtMsg->get_result();
while($m = $resMsg->fetch_assoc()) {
    $msgs[] = $m;
}

echo json_encode([
    'status' => 'success', 
    'ticket' => $ticket,
    'messages' => $msgs
]);

$stmt->close();
$stmtMsg->close();
$conn->close();
