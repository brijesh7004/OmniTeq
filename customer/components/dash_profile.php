<!-- Profile Settings Tab -->
<section id="tab-profile" class="dashboard-tab">
    <!-- Profile Header Banner -->
    <div class="profile-header-new">
        <div class="profile-banner"></div>
        <div class="profile-info-main">
            <div class="profile-avatar-wrapper">
                <img src="https://placehold.co/120x120/0066cc/FFFFFF?text=JD" id="profile-main-avatar"
                    alt="User Avatar">
                <button class="avatar-edit-btn" title="Change Avatar"><i
                        class="fas fa-camera"></i></button>
            </div>
            <div class="profile-text-main">
                <h1 id="profile-display-name">John Doe</h1>
                <p id="profile-display-role"><i class="fas fa-shield-alt"></i> OmniTeq Customer</p>
            </div>
        </div>
    </div>

    <div class="profile-container-new">
        <!-- Profile Side Navigation -->
        <aside class="profile-side-nav">
            <button class="profile-side-link active" data-profile-tab="general">
                <i class="fas fa-user-circle"></i> <span>General Info</span>
            </button>
            <button class="profile-side-link" data-profile-tab="security">
                <i class="fas fa-lock"></i> <span>Security</span>
            </button>
            <!-- <button class="profile-side-link" data-profile-tab="activity"> */
                <i class="fas fa-history"></i> <span>Recent Activity</span>
            </button> -->
            <button class="profile-side-link" data-profile-tab="preferences">
                <i class="fas fa-sliders-h"></i> <span>Preferences</span>
            </button>
        </aside>

        <!-- Profile Main Content Area -->
        <div class="profile-main-content">
            <!-- General Tab -->
            <div class="profile-pane active" id="pane-general">
                <div class="pane-header">
                    <h3>Personal Information</h3>
                    <p>Update your personal details and how we can reach you.</p>
                </div>
                <form class="db-form" id="profile-info-form-new">
                    <div class="form-grid">
                        <div class="form-group">
                            <label for="profile-full-name">Full Name</label>
                            <input type="text" class="form-control" id="profile-full-name"
                                value="John Doe" required>
                        </div>
                        <div class="form-group">
                            <label for="profile-email">Email Address</label>
                            <input type="email" class="form-control" id="profile-email"
                                value="john@example.com" disabled>
                            <small class="text-muted">Email cannot be changed.</small>
                        </div>
                        <div class="form-group">
                            <label for="profile-phone">Phone Number</label>
                            <input type="tel" class="form-control" id="profile-phone"
                                value="+91 98765 43210">
                        </div>
                        <div class="form-group">
                            <label>Member Since</label>
                            <p class="static-info">January 15, 2026</p>
                        </div>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn-primary">Update Profile</button>
                    </div>
                </form>
            </div>

            <!-- Security Tab -->
            <div class="profile-pane" id="pane-security">
                <div class="pane-header">
                    <h3>Security Center</h3>
                    <p>Protect your account with a strong password and security settings.</p>
                </div>

                <div class="security-card-new">
                    <div class="security-card-header">
                        <i class="fas fa-key"></i>
                        <h4>Change Password</h4>
                    </div>
                    <form class="db-form" id="profile-security-form-new">
                        <div class="form-group">
                            <label for="current-password-new">Current Password</label>
                            <div class="input-group-custom">
                                <i class="fas fa-lock"></i>
                                <input type="password" class="form-control" id="current-password-new"
                                    placeholder="Enter current password">
                            </div>
                        </div>
                        <div class="form-grid">
                            <div class="form-group">
                                <label for="new-password-new">New Password</label>
                                <div class="input-group-custom">
                                    <i class="fas fa-shield-alt"></i>
                                    <input type="password" class="form-control" id="new-password-new"
                                        placeholder="Min. 8 characters">
                                </div>
                            </div>
                            <div class="form-group">
                                <label for="confirm-password-new">Confirm Password</label>
                                <div class="input-group-custom">
                                    <i class="fas fa-check-circle"></i>
                                    <input type="password" class="form-control"
                                        id="confirm-password-new" placeholder="Repeat new password">
                                </div>
                            </div>
                        </div>
                        <div class="form-actions"
                            style="margin-top: 10px; border-top: none; padding-top: 0;">
                            <button type="submit" class="btn-primary"
                                style="width: 100%; justify-content: center;">
                                <i class="fas fa-save" style="margin-right: 8px;"></i> Save New Password
                            </button>
                        </div>
                    </form>
                </div>

                <div class="security-card-new">
                    <div class="security-card-header">
                        <i class="fas fa-shield-virus"></i>
                        <h4>Account Health</h4>
                    </div>
                    <div class="security-info-grid">
                        <div class="security-status-item">
                            <i class="fas fa-check-circle active"></i>
                            <strong>Password Strength</strong>
                            <span>Secure</span>
                        </div>
                        <div class="security-status-item">
                            <i class="fas fa-exclamation-triangle inactive"></i>
                            <strong>2FA Status</strong>
                            <span>Disabled</span>
                        </div>
                        <div class="security-status-item">
                            <i class="fas fa-history active"></i>
                            <strong>Last Login</strong>
                            <span>Today</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Activity Tab -->
            <div class="profile-pane" id="pane-activity">
                <div class="pane-header">
                    <h3>Recent Login Activity</h3>
                    <p>Check the last few times your account was accessed.</p>
                </div>
                <div class="activity-timeline">
                    <div class="activity-item">
                        <div class="activity-icon"><i class="fas fa-sign-in-alt"></i></div>
                        <div class="activity-details">
                            <p class="activity-text">Successful Login from <strong>Chrome
                                    (Windows)</strong></p>
                            <span class="activity-time">Today at 10:45 AM (192.168.1.1)</span>
                        </div>
                    </div>
                    <div class="activity-item">
                        <div class="activity-icon"><i class="fas fa-mobile-alt"></i></div>
                        <div class="activity-details">
                            <p class="activity-text">Mobile Access from <strong>OmniTeq App
                                    (iOS)</strong></p>
                            <span class="activity-time">Yesterday at 08:22 PM (172.16.0.1)</span>
                        </div>
                    </div>
                    <div class="activity-item">
                        <div class="activity-icon warning"><i class="fas fa-exclamation-triangle"></i>
                        </div>
                        <div class="activity-details">
                            <p class="activity-text">Password Changed Successfully</p>
                            <span class="activity-time">March 15, 2026 at 02:30 PM</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Preferences Tab -->
            <div class="profile-pane" id="pane-preferences">
                <div class="pane-header">
                    <h3>Account Preferences</h3>
                    <p>Customize your dashboard experience and notification settings.</p>
                </div>
                <div class="preferences-list-new">
                    <div class="pref-item">
                        <div class="pref-info">
                            <h5>Email Notifications</h5>
                            <p>Receive order updates, security alerts, and newsletters.</p>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" checked>
                            <span class="slider round"></span>
                        </label>
                    </div>
                    <div class="pref-item">
                        <div class="pref-info">
                            <h5>SMS Critical Alerts</h5>
                            <p>Immediate alerts for device downtime or critical errors.</p>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" checked>
                            <span class="slider round"></span>
                        </label>
                    </div>
                    <div class="pref-item">
                        <div class="pref-info">
                            <h5>Marketing Communications</h5>
                            <p>News about new products and special offers.</p>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox">
                            <span class="slider round"></span>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>
