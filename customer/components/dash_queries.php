<!-- Query Page Tab -->
<section id="tab-queries" class="dashboard-tab">
    <div class="dashboard-row">
        <div class="dashboard-card flex-2">
            <div class="card-header">
                <h3>My Support Tickets</h3>
                <button class="btn-primary btn-sm"
                    onclick="document.getElementById('new-ticket-form').style.display='block'"><i
                        class="fas fa-plus"></i> New Query</button>
            </div>
            <div class="card-body">
                <div class="ticket-list">
                    <div class="ticket-item unread">
                        <div class="ticket-status badge badge-warning">Open</div>
                        <div class="ticket-details">
                            <h4>Main Gate Controller showing offline despite connection</h4>
                            <p class="ticket-meta">Ticket #TCK-3342 • Opened 1 hour ago • Hardware Issue
                            </p>
                        </div>
                        <a href="#" class="btn-text" data-modal="modal-view-ticket">View</a>
                    </div>
                    <div class="ticket-item">
                        <div class="ticket-status badge badge-info">In Progress</div>
                        <div class="ticket-details">
                            <h4>Requesting API documentation for custom integration</h4>
                            <p class="ticket-meta">Ticket #TCK-3310 • Opened 2 days ago • Developer
                                Support</p>
                        </div>
                        <a href="#" class="btn-text" data-modal="modal-view-ticket">View</a>
                    </div>
                    <div class="ticket-item resolved">
                        <div class="ticket-status badge badge-success">Resolved</div>
                        <div class="ticket-details">
                            <h4>How to pair second mobile device to EV Charger?</h4>
                            <p class="ticket-meta">Ticket #TCK-3255 • Closed on Mar 18, 2026 • General
                                Inquiry</p>
                        </div>
                        <a href="#" class="btn-text" data-modal="modal-view-ticket">View</a>
                    </div>
                </div>
            </div>
        </div>

        <!-- Add New Query Form -->
        <div class="dashboard-card flex-1" id="new-ticket-form" style="display: none;">
            <div class="card-header">
                <h3>Raise New Query</h3>
            </div>
            <div class="card-body">
                <form class="db-form" id="new-ticket-actual-form">
                    <div class="form-group">
                        <label>Category</label>
                        <select class="form-control" id="ticket-category" required>
                            <option value="Technical Support">Technical Support</option>
                            <option value="Billing / Invoice">Billing / Invoice</option>
                            <option value="Product Installation">Product Installation</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Subject</label>
                        <input type="text" class="form-control" id="ticket-subject"
                            placeholder="Brief summary of issue" required>
                    </div>
                    <div class="form-group">
                        <label>Description</label>
                        <textarea class="form-control" id="ticket-description" rows="4"
                            placeholder="Provide details..." required></textarea>
                    </div>
                    <button type="submit" class="btn-primary"
                        style="width: 100%; justify-content: center;">Submit
                        Query</button>
                </form>
            </div>
        </div>
    </div>
</section>
