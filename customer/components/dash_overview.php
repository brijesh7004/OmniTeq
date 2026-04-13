<!-- Overview Tab -->
<section id="tab-overview" class="dashboard-tab active">
    <div class="stats-grid-db">
        <div class="stat-card">
            <div class="stat-icon bg-primary-light text-primary">
                <i class="fas fa-microchip"></i>
            </div>
            <div class="stat-details">
                <h3>Total Devices</h3>
                <div class="stat-value-db">4</div>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon bg-success-light text-success">
                <i class="fas fa-wifi"></i>
            </div>
            <div class="stat-details">
                <h3>Online Devices</h3>
                <div class="stat-value-db">3</div>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon bg-warning-light text-warning">
                <i class="fas fa-exclamation-triangle"></i>
            </div>
            <div class="stat-details">
                <h3>Active Alerts</h3>
                <div class="stat-value-db">1</div>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon bg-info-light text-info">
                <i class="fas fa-ticket-alt"></i>
            </div>
            <div class="stat-details">
                <h3>Open Queries</h3>
                <div class="stat-value-db">2</div>
            </div>
        </div>
    </div>

    <div class="dashboard-row">
        <div class="dashboard-card widget-recent-alerts">
            <div class="card-header">
                <h3>Recent System Alerts</h3>
                <a href="#products" class="btn-text">View All</a>
            </div>
            <div class="card-body">
                <ul class="alert-list" id="dashboard-alerts">
                    <li class="p-4 text-center text-muted">Loading alerts...</li>
                </ul>
            </div>
        </div>

        <div class="dashboard-card widget-quick-actions">
            <div class="card-header">
                <h3>Quick Actions</h3>
            </div>
            <div class="card-body">
                <div class="quick-action-grid">
                    <button class="action-btn" data-modal="modal-add-device">
                        <i class="fas fa-plus-circle"></i>
                        <span>Add Device</span>
                    </button>
                    <button class="action-btn"
                        onclick="document.querySelector('[data-tab=\'queries\']').click()">
                        <i class="fas fa-headset"></i>
                        <span>Get Support</span>
                    </button>
                    <button class="action-btn"
                        onclick="document.querySelector('[data-tab=\'orders\']').click()">
                        <i class="fas fa-file-invoice"></i>
                        <span>View Invoices</span>
                    </button>
                    <button class="action-btn"
                        onclick="document.querySelector('[data-tab=\'profile\']').click()">
                        <i class="fas fa-lock"></i>
                        <span>Change Password</span>
                    </button>
                </div>
            </div>
        </div>
    </div>
</section>
