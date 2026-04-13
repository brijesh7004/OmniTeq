<!-- MODALS SECTION -->
<div class="modal-overlay" id="modal-add-device">
    <div class="modal-content">
        <div class="modal-header">
            <h3><i class="fas fa-plus-circle text-primary"></i> Add New Device</h3>
            <button class="modal-close"><i class="fas fa-times"></i></button>
        </div>
        <div class="modal-body">
            <form class="db-form" id="form-add-device">
                <div class="form-group">
                    <label>Device Type</label>
                    <select class="form-control" id="add-device-type">
                        <option value="1">Smart Wifi Alarm System</option>
                        <option value="2">Smart EV Charging Station</option>
                        <option value="3">Smart WIFI Timer Switch</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Serial Number (S/N)</label>
                    <input type="text" class="form-control" id="add-device-sn" placeholder="e.g. SN-892411">
                </div>
                <div class="form-group">
                    <label>Device Nickname</label>
                    <input type="text" class="form-control" id="add-device-nickname"
                        placeholder="e.g. Kitchen Sensor">
                </div>
                <div class="alert-item info mt-3" style="border-radius: 6px;">
                    <div class="alert-icon"><i class="fas fa-wifi"></i></div>
                    <div class="alert-info">
                        <h4 style="font-size: 0.9rem; margin-bottom: 2px;">Setup Requirement</h4>
                        <p style="font-size: 0.8rem;">Ensure your device is powered on and the status light is
                            blinking blue before adding.</p>
                    </div>
                </div>
            </form>
        </div>
        <div class="modal-footer">
            <button class="btn-outline modal-cancel">Cancel</button>
            <button class="btn-primary" id="btn-pair-device" style="opacity: 0.6; cursor: not-allowed;"
                disabled>Pair Device (Coming Soon)</button>
        </div>
    </div>
</div>

<div class="modal-overlay" id="modal-view-invoice">
    <div class="modal-content modal-lg">
        <div class="modal-header">
            <h3><i class="fas fa-file-invoice text-info"></i> Invoice <span id="invoice-number">#INV-8924</span>
            </h3>
            <button class="modal-close"><i class="fas fa-times"></i></button>
        </div>
        <div class="modal-body invoice-body">
            <div class="invoice-header-info">
                <div>
                    <h4 class="text-gray" style="margin-bottom: 5px;">Billed To:</h4>
                    <p id="invoice-billing-info">John Doe<br>123 Tech Lane, NY 10001<br>john@example.com</p>
                </div>
                <div style="text-align: right;">
                    <h4 class="text-gray" style="margin-bottom: 5px;">Order Date:</h4>
                    <p id="invoice-order-date">Mar 15, 2026<br><br><strong>Status:</strong> <span class="badge"
                            id="invoice-status">Paid</span>
                    </p>
                </div>
            </div>
            <table class="db-table mt-4" style="width: 100%;">
                <thead>
                    <tr>
                        <th>Item</th>
                        <th>Qty</th>
                        <th>Price</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody id="invoice-items-body">
                    <!-- Items will be loaded here -->
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="3" style="text-align: right; padding-top: 15px;"><strong>Total:</strong></td>
                        <td style="padding-top: 15px;"><strong id="invoice-total">$450.00</strong></td>
                    </tr>
                </tfoot>
            </table>
        </div>
        <div class="modal-footer">
            <button class="btn-outline modal-cancel">Close</button>
            <button class="btn-primary"><i class="fas fa-download"></i> Download PDF</button>
        </div>
    </div>
</div>

<div class="modal-overlay" id="modal-view-ticket">
    <div class="modal-content">
        <div class="modal-header">
            <h3 id="ticket-view-number">Ticket #TCK-3342</h3>
            <button class="modal-close"><i class="fas fa-times"></i></button>
        </div>
        <div class="modal-body ticket-chat" id="ticket-chat-body">
            <!-- Messages will be loaded here -->
        </div>
        <div class="chat-input-area mt-4">
            <textarea class="form-control" id="ticket-reply-text" rows="3"
                placeholder="Type your reply..."></textarea>
        </div>
        <div class="modal-footer">
            <button class="btn-outline modal-cancel">Close</button>
            <button class="btn-primary" id="ticket-reply-btn"><i class="fas fa-paper-plane"></i> Reply</button>
        </div>
    </div>
</div>
<!-- Query Detail View Modal (Contact / Consultation / Quote) -->
<div class="modal-overlay" id="modal-view-query">
    <div class="modal-content modal-lg">
        <div class="modal-header">
            <h3 id="query-modal-title"><i class="fas fa-file-alt text-primary"></i> Query Details</h3>
            <button class="modal-close"><i class="fas fa-times"></i></button>
        </div>
        <div class="modal-body" id="query-modal-body" style="min-height:200px;">
            <div class="text-center p-4" id="query-modal-loader">
                <i class="fas fa-spinner fa-spin fa-2x text-primary"></i>
                <p class="mt-2">Loading details…</p>
            </div>
        </div>
        <div class="modal-footer">
            <button class="btn-outline modal-cancel">Close</button>
        </div>
    </div>
</div>
