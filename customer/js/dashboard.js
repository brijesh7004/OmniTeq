/**
 * OmniTeq Dashboard JavaScript (Refactored)
 * Handles Tab Switching, Mobile Sidebar, and Theme Toggle
 * Updated for /customer/ directory structure
 */

document.addEventListener('DOMContentLoaded', () => {
    // #region Auth Guard (admin/employee/customer dashboard)
    const getExpectedRoleFromPage = () => {
        const file = (window.location.pathname || '').split('/').pop();
        if (file === 'admin.html') return 'admin';
        if (file === 'employee.html') return 'employee';
        return 'customer';
    };

    const expectedRole = getExpectedRoleFromPage();
    const performRedirect = (role) => {
        if (role === 'admin') window.location.href = '../admin.html';
        else if (role === 'employee') window.location.href = '../employee.html';
        else window.location.href = 'dashboard.php';
    };

    fetch('../api/auth/me.php', { credentials: 'same-origin' })
        .then(async (resp) => {
            const payload = await resp.json().catch(() => null);
            if (!resp.ok || !payload || payload.status !== 'success') {
                window.location.href = '../login.html';
                return null;
            }

            const role = payload.user?.role || 'customer';
            if (role !== expectedRole) performRedirect(role);

            const userNameEl = document.getElementById('header-user-name');
            if (userNameEl && payload.user?.full_name) {
                userNameEl.textContent = payload.user.full_name;
            }
            return null;
        })
        .catch(() => {
            window.location.href = '../login.html';
        });


    // #endregion

    // #region Data Loading Logic

    const formatTimeAgo = (dateStr) => {
        if (!dateStr) return 'Never';
        const date = new Date(dateStr);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);
        if (seconds < 60) return 'just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        return date.toLocaleDateString();
    };

    const loadOverview = async () => {
        try {
            const resp = await fetch('../api/dashboard/get_overview.php', { credentials: 'same-origin' });
            const data = await resp.json();
            if (data.status === 'success') {
                const stats = document.querySelectorAll('.stat-value-db');
                if (stats[0]) stats[0].textContent = data.stats.total_devices;
                if (stats[1]) stats[1].textContent = data.stats.online_devices;
                if (stats[2]) stats[2].textContent = data.stats.active_alerts;
                if (stats[3]) stats[3].textContent = data.stats.open_queries;

                const alertList = document.getElementById('dashboard-alerts');
                if (alertList) {
                    if (data.alerts && data.alerts.length > 0) {
                        alertList.innerHTML = data.alerts.map(alert => `
                            <li class="alert-item ${alert.type || 'info'}">
                                <div class="alert-icon"><i class="fas fa-${alert.type === 'warning' ? 'exclamation-circle' : (alert.type === 'danger' ? 'fire-alt' : (alert.type === 'success' ? 'check-circle' : 'info-circle'))}"></i></div>
                                <div class="alert-info">
                                    <h4>${alert.title || 'System Alert'}</h4>
                                    <p>${alert.message || 'No description available'}</p>
                                </div>
                                <div class="alert-time">${formatTimeAgo(alert.created_at)}</div>
                            </li>
                        `).join('');
                    } else {
                        alertList.innerHTML = '<li class="p-4 text-center text-muted"><i class="fas fa-bell-slash mb-2 d-block" style="font-size: 1.5rem; opacity: 0.5;"></i> No recent system alerts</li>';
                    }
                }
            } else {
                throw new Error(data.message || 'Failed to load dashboard data');
            }
        } catch (err) {
            console.error('Error loading overview:', err);
            const alertList = document.getElementById('dashboard-alerts');
            if (alertList) {
                alertList.innerHTML = '<li class="p-4 text-center text-danger"><i class="fas fa-exclamation-triangle mb-2 d-block" style="font-size: 1.5rem; opacity: 0.5;"></i> Failed to load alerts</li>';
            }
        }
    };

    const loadDevices = async () => {
        try {
            const resp = await fetch('../api/dashboard/get_devices.php', { credentials: 'same-origin' });
            const data = await resp.json();
            console.log('[OmniTeq] Loaded devices:', data.devices.length, data.devices);
            const grid = document.querySelector('#tab-products .devices-grid');
            if (grid && data.status === 'success') {
                if (!data.devices || data.devices.length === 0) {
                    grid.innerHTML = '<div class="text-center p-5 w-100"><i class="fas fa-microchip mb-3 d-block text-muted" style="font-size: 2.5rem; opacity:0.3;"></i> <h3>No devices found. Pair your first device to get started!</h3></div>';
                    return;
                }
                grid.innerHTML = data.devices.map(d => `
                    <div class="device-card status-${d.status}">
                        <div class="device-header">
                            <div class="device-icon">
                                <i class="fas fa-${d.product_name.toLowerCase().includes('alarm') ? 'bell' : (d.product_name.toLowerCase().includes('charger') ? 'plug' : 'toggle-on')}"></i>
                            </div>
                            <div class="device-status">${d.status.charAt(0).toUpperCase() + d.status.slice(1)}</div>
                        </div>
                        <div class="device-info">
                            <h4>${d.nickname || d.product_name}</h4>
                            <p>${d.product_name}</p>
                            <div class="device-meta">
                                <span><i class="fas fa-barcode"></i> ${d.serial_number}</span>
                                <span><i class="far fa-clock"></i> Added ${formatTimeAgo(d.created_at)}</span>
                            </div>
                        </div>
                        <div class="device-actions">
                            <button class="btn-outline btn-sm">Settings</button>
                            <button class="btn-outline btn-sm ${d.status === 'offline' ? 'text-muted' : 'text-danger'}" ${d.status === 'offline' ? 'disabled' : ''}>
                                <i class="fas fa-power-off"></i>
                            </button>
                        </div>
                    </div>
                `).join('');
            }
        } catch (err) { console.error('Error loading devices:', err); }
    };

    const loadOrders = async () => {
        try {
            const resp = await fetch('../api/dashboard/get_orders.php', { credentials: 'same-origin' });
            const data = await resp.json();
            const listBody = document.getElementById('orders-list-body');
            if (listBody && data.status === 'success') {
                if (data.orders.length === 0) {
                    listBody.innerHTML = '<tr><td colspan="6" class="p-4 text-center text-muted">No orders found.</td></tr>';
                    return;
                }
                listBody.innerHTML = data.orders.map(o => `
                    <tr>
                        <td>#${o.order_number}</td>
                        <td>${new Date(o.order_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                        <td>${o.product_name}</td>
                        <td><span class="badge badge-${o.status === 'paid' || o.status === 'delivered' ? 'success' : (o.status === 'cancelled' ? 'danger' : 'warning')}">${o.status.charAt(0).toUpperCase() + o.status.slice(1)}</span></td>
                        <td>$${parseFloat(o.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td><button class="btn-text btn-sm btn-view-invoice" data-order-id="${o.id}">View Invoice</button></td>
                    </tr>
                `).join('');

                // Add listeners to new buttons
                listBody.querySelectorAll('.btn-view-invoice').forEach(btn => {
                    btn.onclick = () => viewInvoice(btn.dataset.orderId);
                });
            }
        } catch (err) { console.error('Error loading orders:', err); }
    };

    const viewInvoice = async (orderId) => {
        try {
            const resp = await fetch(`../api/dashboard/get_order_details.php?id=${orderId}`, { credentials: 'same-origin' });
            const data = await resp.json();
            if (data.status === 'success') {
                const order = data.order;
                document.getElementById('invoice-number').textContent = `#${order.order_number}`;
                document.getElementById('invoice-billing-info').innerHTML = `${order.billing_name}<br>${order.billing_address.replace(/\n/g, '<br>')}<br>${order.billing_email}`;
                document.getElementById('invoice-order-date').innerHTML = `${new Date(order.order_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}<br><br><strong>Status:</strong> <span class="badge badge-${order.status === 'paid' ? 'success' : 'warning'}" id="invoice-status">${order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>`;

                let itemsHtml = '';
                if (parseFloat(order.amount_product) > 0) {
                    itemsHtml += `<tr><td>${order.product_name}</td><td>${order.quantity}</td><td>$${parseFloat(order.amount_product).toFixed(2)}</td><td>$${(order.quantity * order.amount_product).toFixed(2)}</td></tr>`;
                }
                if (parseFloat(order.amount_installation) > 0) {
                    itemsHtml += `<tr><td>Installation Service</td><td>1</td><td>$${parseFloat(order.amount_installation).toFixed(2)}</td><td>$${parseFloat(order.amount_installation).toFixed(2)}</td></tr>`;
                }
                if (parseFloat(order.amount_extra) > 0) {
                    itemsHtml += `<tr><td>Additional Services/Parts</td><td>1</td><td>$${parseFloat(order.amount_extra).toFixed(2)}</td><td>$${parseFloat(order.amount_extra).toFixed(2)}</td></tr>`;
                }
                if (parseFloat(order.amount_delivery) > 0) {
                    itemsHtml += `<tr><td>Delivery Charges</td><td>1</td><td>$${parseFloat(order.amount_delivery).toFixed(2)}</td><td>$${parseFloat(order.amount_delivery).toFixed(2)}</td></tr>`;
                }

                document.getElementById('invoice-items-body').innerHTML = itemsHtml;
                document.getElementById('invoice-total').textContent = `$${parseFloat(order.amount).toFixed(2)}`;

                // Show modal
                const modal = document.getElementById('modal-view-invoice');
                if (modal) modal.classList.add('active');
            }
        } catch (err) { console.error('Error viewing invoice:', err); }
    };


    const loadTickets = async () => {
        try {
            const endpoints = [
                { url: '../api/contact.php', type: 'Contact', key: 'items' },
                { url: '../api/dashboard/get_tickets.php', type: 'Ticket', key: 'tickets' },
                { url: '../api/consultation.php', type: 'Consultation', key: 'items' },
                { url: '../api/quote.php', type: 'Quote', key: 'items' }
            ];

            const results = await Promise.all(endpoints.map(e =>
                fetch(e.url, { credentials: 'same-origin' }).then(r => r.json().catch(() => ({ status: 'error' })))
            ));

            let allQueries = [];
            results.forEach((res, idx) => {
                const isSuccess = res.status === 'success' || res.status === 200;
                if (isSuccess) {
                    const type = endpoints[idx].type;
                    const dataKey = endpoints[idx].key;
                    const payload = res.data || res;
                    const items = payload[dataKey] || [];

                    items.forEach(item => {
                        allQueries.push({
                            id: item.id,
                            type: type,
                            subject: item.subject || item.consultation_type || item.project_type || 'General Inquiry',
                            status: item.status || 'Submitted',
                            date: item.created_at,
                            ref: item.ticket_number || `#${type.substring(0, 1)}${item.id.toString().padStart(4, '0')}`,
                            raw: item
                        });
                    });
                }
            });

            // Sort by date descending
            allQueries.sort((a, b) => new Date(b.date) - new Date(a.date));

            const list = document.querySelector('.ticket-list');
            if (list) {
                if (allQueries.length === 0) {
                    list.innerHTML = '<p class="text-center p-4">No queries or requests found.</p>';
                    return;
                }
                list.innerHTML = allQueries.map(q => {
                    const statusClass = q.status === 'open' || q.status === 'pending' ? 'warning' : (q.status === 'resolved' || q.status === 'completed' ? 'success' : 'info');
                    const typeLabel = q.type === 'Contact' ? 'Contact' : q.type === 'Consultation' ? 'Consultation' : q.type === 'Quote' ? 'Quotation' : 'Query';
                    return `
                    <div class="ticket-item ${q.raw.is_read === 0 ? 'unread' : ''}">
                        <div class="ticket-status-group">
                            <span class="badge badge-${statusClass}">${q.status.charAt(0).toUpperCase() + q.status.slice(1)}</span>
                            <span class="ticket-type-badge">${typeLabel}</span>
                        </div>
                        <div>   </div>
                        <div class="ticket-details">
                            <h4>${q.subject}</h4>
                            <p class="ticket-meta">${q.ref} • ${new Date(q.date).toLocaleDateString()}</p>
                        </div>
                        <a href="#" class="btn-text view-query-btn" data-type="${q.type}" data-id="${q.id}">View</a>
                    </div>`;
                }).join('');


                // Add click listeners
                document.querySelectorAll('.view-query-btn').forEach(btn => {
                    btn.onclick = (e) => {
                        e.preventDefault();
                        const type = btn.getAttribute('data-type');
                        const id = btn.getAttribute('data-id');
                        if (type === 'Ticket') openTicketDetails(id);
                        else openQueryDetails(type, id);
                    };
                });
            }
        } catch (err) { console.error('Error loading queries:', err); }
    };

    // --- Open Query Details (Contact / Consultation / Quote) ---
    window.openQueryDetails = async (type, id) => {
        const modal = document.getElementById('modal-view-query');
        const body = document.getElementById('query-modal-body');
        const title = document.getElementById('query-modal-title');
        if (!modal) return;

        // Show modal with loader
        modal.classList.add('active');
        body.innerHTML = `<div class="text-center p-4"><i class="fas fa-spinner fa-spin fa-2x text-primary"></i><p class="mt-2">Loading details…</p></div>`;

        const endpointMap = { Contact: 'contact', Consultation: 'consultation', Quote: 'quote' };
        const iconMap = { Contact: 'fa-envelope', Consultation: 'fa-calendar-check', Quote: 'fa-file-invoice-dollar' };
        const endpoint = endpointMap[type] || 'contact';

        try {
            const res = await fetch(`../api/${endpoint}.php?id=${id}`);
            const json = await res.json();
            if (json.status !== 200) throw new Error(json.message || 'Not found');

            const d = json.data;
            const statusClass = d.status === 'pending' ? 'warning' : (d.status === 'completed' || d.status === 'resolved' ? 'success' : 'info');
            const statusLabel = (d.status || 'submitted').charAt(0).toUpperCase() + (d.status || 'submitted').slice(1);

            title.innerHTML = `<i class="fas ${iconMap[type]} text-primary"></i> ${type} Details`;

            let fieldsHtml = '';
            if (type === 'Contact') {
                fieldsHtml = `
                    <div class="query-detail-row"><span>Name</span><strong>${d.name || '—'}</strong></div>
                    <div class="query-detail-row"><span>Email</span><strong>${d.email || '—'}</strong></div>
                    <div class="query-detail-row"><span>Mobile</span><strong>${d.mobile || '—'}</strong></div>
                    <div class="query-detail-row"><span>Subject</span><strong>${d.subject || '—'}</strong></div>
                    <div class="query-detail-row full"><span>Message</span><p>${d.message || '—'}</p></div>`;
            } else if (type === 'Consultation') {
                fieldsHtml = `
                    <div class="query-detail-row"><span>Name</span><strong>${d.name || '—'}</strong></div>
                    <div class="query-detail-row"><span>Email</span><strong>${d.email || '—'}</strong></div>
                    <div class="query-detail-row"><span>Mobile</span><strong>${d.mobile || '—'}</strong></div>
                    <div class="query-detail-row"><span>Company</span><strong>${d.company || '—'}</strong></div>
                    <div class="query-detail-row"><span>Service</span><strong>${d.consultation_type || '—'}</strong></div>
                    <div class="query-detail-row"><span>Preferred Date</span><strong>${d.preferred_date + " (" + d.preferred_time + ")" || '—'}</strong></div>
                    <div class="query-detail-row full"><span>Project Brief</span><p>${d.project_brief || '—'}</p></div>
                    <div class="query-detail-row full"><span>Additional Questions</span><p>${d.questions || '—'}</p></div>`;
            } else if (type === 'Quote') {
                fieldsHtml = `
                    <div class="query-detail-row"><span>Name</span><strong>${d.name || '—'}</strong></div>
                    <div class="query-detail-row"><span>Email</span><strong>${d.email || '—'}</strong></div>
                    <div class="query-detail-row"><span>Mobile</span><strong>${d.mobile || '—'}</strong></div>
                    <div class="query-detail-row"><span>Company</span><strong>${d.company || '—'}</strong></div>
                    <div class="query-detail-row"><span>Project Type</span><strong>${d.project_type || '—'}</strong></div>
                    <div class="query-detail-row"><span>Budget</span><strong>${d.budget_range || '—'}</strong></div>
                    <div class="query-detail-row full"><span>Requirements</span><p>${d.project_details || d.message || '—'}</p></div>`;
            }

            body.innerHTML = `
                <div class="query-detail-header">
                    <div>
                        <span class="badge badge-${statusClass}">${statusLabel}</span>
                        <span class="ticket-type-badge ml-2">${type}</span>
                    </div>
                    <small class="text-muted">Submitted: ${new Date(d.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</small>
                </div>
                <div class="query-detail-grid">${fieldsHtml}</div>`;

        } catch (err) {
            body.innerHTML = `<div class="text-center p-4"><i class="fas fa-exclamation-triangle text-warning fa-2x"></i><p class="mt-2">Failed to load details. Please try again.</p></div>`;
        }
    };

    // Profile Inner Tab Switching

    // Profile Inner Tab Switching
    const initProfileTabs = () => {
        const profileLinks = document.querySelectorAll('.profile-side-nav .profile-side-link');
        const profilePanes = document.querySelectorAll('.profile-main-content .profile-pane');

        profileLinks.forEach(link => {
            link.addEventListener('click', () => {
                const target = link.getAttribute('data-profile-tab');
                profileLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                profilePanes.forEach(pane => {
                    pane.classList.remove('active');
                    if (pane.id === `pane-${target}`) pane.classList.add('active');
                });
            });
        });
    };
    initProfileTabs();

    const loadProfile = async () => {
        try {
            const resp = await fetch('../api/dashboard/get_profile_json.php', { credentials: 'same-origin' });
            const data = await resp.json();
            if (data.status === 'success') {
                const u = data.user;

                // Update Name across all elements
                const headerName = document.getElementById('header-user-name');
                const displayName = document.getElementById('profile-display-name') || document.querySelector('.profile-text-main h1');
                const nameInput = document.getElementById('profile-full-name');
                const emailInput = document.getElementById('profile-email');
                const phoneInput = document.getElementById('profile-phone');

                if (headerName) headerName.textContent = u.full_name;
                if (displayName) displayName.textContent = u.full_name;
                if (nameInput) nameInput.value = u.full_name;
                if (emailInput) emailInput.value = u.email;
                if (phoneInput) phoneInput.value = u.mobile || '';

                // Update Avatar
                const largeAvatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(u.full_name)}&background=0066cc&color=fff&size=200`;
                const smallAvatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(u.full_name)}&background=0066cc&color=fff&size=100`;

                const mainAvatarImg = document.getElementById('profile-main-avatar') || document.querySelector('.profile-avatar-wrapper img');
                const headerAvatarImg = document.getElementById('header-avatar');

                if (mainAvatarImg) mainAvatarImg.src = largeAvatarUrl;
                if (headerAvatarImg) headerAvatarImg.src = smallAvatarUrl;

                // Update Member Since
                const memberSinceEl = document.querySelector('.static-info');
                if (memberSinceEl && u.created_at) {
                    const d = new Date(u.created_at);
                    memberSinceEl.textContent = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
                }

                if (u.preferences) {
                    const pInputs = document.querySelectorAll('.preferences-list-new input[type="checkbox"]');
                    if (pInputs[0]) pInputs[0].checked = !!u.preferences.email_notifications;
                    if (pInputs[1]) pInputs[1].checked = !!u.preferences.sms_alerts;
                    pInputs.forEach(input => { input.onchange = () => savePreferences(); });
                }
            }
        } catch (err) { console.error('Error loading profile:', err); }
    };

    const savePreferences = async () => {
        const pInputs = document.querySelectorAll('.preferences-list-new input[type="checkbox"]');
        const payload = {
            mode: 'update_preferences',
            preferences: {
                email_notifications: pInputs[0] ? pInputs[0].checked : true,
                sms_alerts: pInputs[1] ? pInputs[1].checked : true,
                theme: document.documentElement.classList.contains('dark-theme') ? 'dark' : 'light'
            }
        };
        try {
            await fetch('../api/dashboard/update_profile_json.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (window.showToast) showToast('Preferences updated', 'success');
        } catch (err) { console.error('Error saving preferences:', err); }
    };

    // Form Handlers
    const initFormHandlers = () => {
        const profileForm = document.getElementById('profile-info-form-new');
        if (profileForm) {
            profileForm.onsubmit = async (e) => {
                e.preventDefault();
                const btn = profileForm.querySelector('button[type="submit"]');
                const originalText = btn.innerHTML;
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
                btn.disabled = true;

                const payload = {
                    mode: 'update_info',
                    full_name: document.getElementById('profile-full-name').value,
                    phone: document.getElementById('profile-phone').value
                };

                try {
                    const resp = await fetch('../api/dashboard/update_profile_json.php', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    const res = await resp.json();
                    if (res.status === 'success') {
                        if (window.showToast) showToast('Profile updated successfully!', 'success');
                        loadProfile();
                    } else {
                        if (window.showToast) showToast(res.message || 'Update failed', 'error');
                    }
                } catch (err) {
                    if (window.showToast) showToast('An error occurred', 'error');
                } finally {
                    btn.innerHTML = originalText;
                    btn.disabled = false;
                }
            };
        }
    };
    initFormHandlers();

    const securityForm = document.getElementById('profile-security-form-new');
    if (securityForm) {
        securityForm.onsubmit = async (e) => {
            e.preventDefault();
            const currentPass = document.getElementById('current-password-new').value;
            const newPass = document.getElementById('new-password-new').value;
            const confirmPass = document.getElementById('confirm-password-new').value;

            if (!currentPass) {
                if (window.showToast) showToast('Please enter your current password.', 'error');
                return;
            }

            if (newPass !== confirmPass) {
                if (window.showToast) showToast('Passwords do not match!', 'error');
                return;
            }

            const btn = securityForm.querySelector('button[type="submit"]');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
            btn.disabled = true;

            try {
                const resp = await fetch('../api/dashboard/update_profile_json.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        mode: 'update_security',
                        current_password: currentPass,
                        new_password: newPass
                    })
                });
                const res = await resp.json();
                if (res.status === 'success') {
                    if (window.showToast) showToast('Password updated successfully!', 'success');
                    securityForm.reset();
                } else {
                    if (window.showToast) showToast(res.message || 'Update failed', 'error');
                }
            } catch (err) {
                if (window.showToast) showToast('An error occurred', 'error');
            } finally {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        };
    }

    const ticketForm = document.getElementById('new-ticket-actual-form');
    if (ticketForm) {
        ticketForm.onsubmit = async (e) => {
            e.preventDefault();
            const btn = ticketForm.querySelector('button[type="submit"]');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
            btn.disabled = true;

            const payload = {
                category: document.getElementById('ticket-category').value,
                subject: document.getElementById('ticket-subject').value,
                description: document.getElementById('ticket-description').value
            };

            try {
                const resp = await fetch('../api/dashboard/add_ticket.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const res = await resp.json();
                if (res.status === 'success') {
                    if (window.showToast) showToast('Query submitted successfully!', 'success');
                    ticketForm.reset();
                    document.getElementById('new-ticket-form').style.display = 'none';
                    loadTickets(); // Refresh the list
                } else {
                    if (window.showToast) showToast(res.message || 'Submission failed', 'error');
                }
            } catch (err) {
                if (window.showToast) showToast('An error occurred', 'error');
            } finally {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        };
    }

    // Initial Data Fetch
    loadOverview();
    loadDevices();
    loadOrders();
    loadTickets();
    loadProfile();

    // #endregion

    // Tab Switching Logic
    const navLinks = document.querySelectorAll('.sidebar-nav .nav-link:not(.logout-link)');
    const tabs = document.querySelectorAll('.dashboard-tab');
    const pageTitle = document.getElementById('current-page-title');

    const initialHash = window.location.hash || '#overview';
    const openTicketDetails = async (id) => {
        const modal = document.getElementById('modal-view-ticket');
        const chatBody = document.getElementById('ticket-chat-body');
        const ticketNum = document.getElementById('ticket-view-number');
        const replyBtn = document.getElementById('ticket-reply-btn');

        if (!modal || !chatBody) return;

        chatBody.innerHTML = '<div class="text-center p-4"><i class="fas fa-spinner fa-spin"></i> Loading conversation...</div>';
        modal.classList.add('active');

        try {
            const resp = await fetch(`../api/dashboard/get_ticket_details.php?id=${id}`);
            const data = await resp.json();
            if (data.status === 'success') {
                ticketNum.textContent = `Ticket #${data.ticket.ticket_number}`;
                chatBody.innerHTML = '';

                // Add the original description as the first message
                chatBody.innerHTML += `
                    <div class="chat-message received">
                        <div class="chat-bubble">
                            <p class="chat-text"><strong>Issue Description:</strong><br>${data.ticket.description}</p>
                            <span class="chat-time">${new Date(data.ticket.created_at).toLocaleString()}</span>
                        </div>
                    </div>
                `;

                data.messages.forEach(m => {
                    const isSelf = !m.is_admin_reply;
                    chatBody.innerHTML += `
                        <div class="chat-message ${isSelf ? 'received' : 'sent'}">
                            ${!isSelf ? '<img src="../images/logo/favicon.svg" alt="Support" style="background:#0066cc; padding:4px; border-radius:50%; width: 35px; height: 35px;">' : ''}
                            <div class="chat-bubble">
                                <p class="chat-text">${m.message}</p>
                                <span class="chat-time">${new Date(m.created_at).toLocaleString()}</span>
                            </div>
                        </div>
                    `;
                });

                // Store current ticket ID for reply
                replyBtn.setAttribute('data-current-id', id);
                chatBody.scrollTop = chatBody.scrollHeight;
            }
        } catch (err) { console.error('Error loading ticket:', err); }
    };

    const replyBtn = document.getElementById('ticket-reply-btn');
    if (replyBtn) {
        replyBtn.onclick = async () => {
            const ticketId = replyBtn.getAttribute('data-current-id');
            const textEl = document.getElementById('ticket-reply-text');
            const message = textEl.value.trim();

            if (!message || !ticketId) return;

            replyBtn.disabled = true;
            try {
                const resp = await fetch('../api/dashboard/add_ticket_message.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ticket_id: ticketId, message: message })
                });
                const data = await resp.json();
                if (data.status === 'success') {
                    textEl.value = '';
                    openTicketDetails(ticketId); // Refresh chat
                }
            } catch (err) { console.error('Error sending reply:', err); }
            finally { replyBtn.disabled = false; }
        };
    }

    const initialLink = document.querySelector(`.nav-link[href="${initialHash}"]`);
    if (initialLink) activateTab(initialLink);

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href.startsWith('#')) {
                activateTab(link);
                if (window.innerWidth <= 991) {
                    const sb = document.getElementById('sidebar');
                    if (sb) sb.classList.remove('active');
                }
                const tid = link.getAttribute('data-tab');
                if (tid === 'overview') loadOverview();
                else if (tid === 'products') loadDevices();
                else if (tid === 'orders') loadOrders();
                else if (tid === 'queries') loadTickets();
                else if (tid === 'profile') loadProfile();
            }
        });
    });

    function activateTab(link) {
        navLinks.forEach(l => l.classList.remove('active'));
        tabs.forEach(t => t.classList.remove('active'));
        link.classList.add('active');
        const targetId = `tab-${link.getAttribute('data-tab')}`;
        const targetTab = document.getElementById(targetId);
        if (targetTab) targetTab.classList.add('active');
        const span = link.querySelector('span');
        if (span) pageTitle.textContent = span.textContent;
    }

    // Sidebar Mobile
    const sidebar = document.getElementById('sidebar');
    const toggle = document.getElementById('sidebar-toggle');
    const close = document.getElementById('mobile-close');
    if (toggle && sidebar) toggle.onclick = () => sidebar.classList.add('active');
    if (close && sidebar) close.onclick = () => sidebar.classList.remove('active');

    document.onclick = (e) => {
        if (window.innerWidth <= 991 && sidebar?.classList.contains('active')) {
            if (!sidebar.contains(e.target) && !toggle.contains(e.target)) {
                sidebar.classList.remove('active');
            }
        }
    };

    // Theme
    const tbtn = document.getElementById('dashboard-theme-toggle');
    if (tbtn) {
        tbtn.onclick = () => {
            document.documentElement.classList.toggle('dark-theme');
            const theme = document.documentElement.classList.contains('dark-theme') ? 'dark' : 'light';
            localStorage.setItem('theme', theme);
            const logo = document.getElementById('sidebar-logo');
            if (logo) logo.src = theme === 'dark' ? '../images/logo/logo-white.svg' : '../images/logo/logo.svg';
        };
    }

    function bindModals() {
        const btns = document.querySelectorAll('[data-modal]');
        const closeBtns = document.querySelectorAll('.modal-close, .modal-cancel');
        const overlays = document.querySelectorAll('.modal-overlay');

        btns.forEach(b => {
            b.onclick = (e) => {
                e.preventDefault();
                const m = document.getElementById(b.getAttribute('data-modal'));
                if (m) m.classList.add('active');
            };
        });
        closeBtns.forEach(b => {
            b.onclick = (e) => {
                e.preventDefault();
                const o = b.closest('.modal-overlay');
                if (o) o.classList.remove('active');
            };
        });
        overlays.forEach(o => {
            o.onclick = (e) => { if (e.target === o) o.classList.remove('active'); };
        });
    }

    bindModals();

    // Add New Device Handler
    const btnPairDevice = document.getElementById('btn-pair-device');
    if (btnPairDevice) {
        btnPairDevice.addEventListener('click', async () => {
            const productId = document.getElementById('add-device-type').value;
            const serialNumber = document.getElementById('add-device-sn').value;
            const nickname = document.getElementById('add-device-nickname').value;

            if (!serialNumber) {
                alert('Please enter a serial number');
                return;
            }

            btnPairDevice.disabled = true;
            btnPairDevice.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Pairing...';

            try {
                const resp = await fetch('../api/dashboard/add_device.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ product_id: productId, serial_number: serialNumber, nickname: nickname })
                });
                const data = await resp.json();
                if (data.status === 'success') {
                    // Close modal
                    const modal = document.getElementById('modal-add-device');
                    if (modal) modal.classList.remove('active');

                    // Refresh devices
                    loadDevices();

                    // Reset form
                    const form = document.getElementById('form-add-device');
                    if (form) form.reset();

                    // Show success
                    if (window.showToast) window.showToast('Device added successfully!', 'success');
                    else alert('Device added successfully!');
                } else {
                    alert('Error: ' + data.message);
                }
            } catch (err) {
                console.error('Error adding device:', err);
                alert('Failed to connect to server');
            } finally {
                btnPairDevice.disabled = false;
                btnPairDevice.textContent = 'Pair Device';
            }
        });
    }
});
