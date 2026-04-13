<!-- Order History Tab -->
<section id="tab-orders" class="dashboard-tab">
    <div class="dashboard-card">
        <div class="card-header">
            <h3>My Orders</h3>
            <div class="search-box">
                <i class="fas fa-search"></i>
                <input type="text" placeholder="Search orders...">
            </div>
        </div>
        <div class="card-body">
            <div class="table-responsive">
                <table class="db-table" id="orders-table">
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Date</th>
                            <th>Product</th>
                            <th>Status</th>
                            <th>Amount</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody id="orders-list-body">
                        <tr>
                            <td colspan="6" class="p-4 text-center text-muted">Loading orders...</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</section>
