/**
 * OmniTeq Cloud - JavaScript API Client v2.0
 *
 * Every method in this client performs a real HTTP request against the OmniTeq
 * gateway. There is no offline/local-simulation path: accounts, projects,
 * devices, telemetry and commands are persisted server-side, so clearing
 * browser storage does not lose data.
 *
 * Mapped to the REST, Webhook, and Ingest endpoints defined in
 * IoT Cloud Platform API Quick Reference v2.0
 */

class OmniTeqAPI {
    constructor() {
        // ENDPOINTS: js/config.js is the single source of truth — there is
        // deliberately NO fallback copy of the gateway URL here, because a second
        // copy would silently keep talking to an old host after the config
        // changes. If config.js is missing, fail loudly instead.
        const cfg = window.OMNITEQ_CONFIG;
        if (!cfg || !cfg.resolve) {
            const msg = '[OmniTeq] js/config.js was not loaded. Add <script src="js/config.js"></script> BEFORE js/api.js on this page.';
            console.error(msg);
            throw new Error(msg);
        }
        const defaults = cfg.resolve();

        // Purge state written by older builds that shipped a local mock engine.
        // Leaving these behind could make a stale build answer requests locally.
        ['omniteq_use_mock_api', 'omniteq_mock_db', 'omniteq_mock_db_v1',
         'omniteq_mock_db_v2', 'omniteq_mock_db_v3', 'omniteq_mock_logged_in_user_id',
         'omniteq_api_host'].forEach(k => localStorage.removeItem(k));

        // Also drop any saved endpoint pointing at a superseded host, so a value
        // persisted by an earlier build cannot keep this client on a dead host.
        const isLegacy = (u) => cfg.isLegacyOrigin(u);
        if (isLegacy(localStorage.getItem('omniteq_api_baseUrl'))) localStorage.removeItem('omniteq_api_baseUrl');
        if (isLegacy(localStorage.getItem('omniteq_api_wsUrl'))) localStorage.removeItem('omniteq_api_wsUrl');

        this.baseUrl = defaults.apiBaseUrl;
        this.wsUrl = defaults.wsUrl;

        this.token = localStorage.getItem('access_token');
        this.refreshToken = localStorage.getItem('refresh_token');
        this.ws = null;
        this.isRefreshing = false;
        this.refreshQueue = [];

        // Set when a request cannot reach the gateway, so pages can tell the user
        // the difference between "server said no" and "server is unreachable".
        this.lastConnectionError = null;

        // Highest query window the account's plan allows, in days. The gateway
        // rejects a telemetry window that reaches or exceeds this value.
        this.queryRangeDays = 7;

        console.log(`[OmniTeq API] Gateway: ${this.baseUrl}`);
    }

    /**
     * Dynamically update target API server host IP and port
     */
    setServerHost(hostIp, port = 3000) {
        const cleanHost = hostIp.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
        const hostWithPort = cleanHost.includes(':') ? cleanHost : `${cleanHost}:${port}`;
        const newBaseUrl = `http://${hostWithPort}/api/v1`;
        const newWsUrl = `ws://${hostWithPort}/ws`;
        
        this.baseUrl = newBaseUrl;
        this.wsUrl = newWsUrl;
        localStorage.setItem('omniteq_api_baseUrl', newBaseUrl);
        localStorage.setItem('omniteq_api_wsUrl', newWsUrl);
        console.log(`[OmniTeq API] Target Server Host updated to: ${newBaseUrl}`);
    }

    /**
     * Resolves an ISO-8601 [from, to] window for telemetry queries.
     *
     * Two gateway behaviours are handled here:
     *  1. Both bounds are required, and any window that reaches or exceeds the
     *     account plan's query_range_days is rejected with 400, so the span is
     *     clamped to the plan limit.
     *  2. The gateway clock can run slightly ahead of the browser clock, so a
     *     `to` of "now" would exclude readings written moments earlier. The
     *     default window is therefore shifted forward by a small margin
     *     (the span itself stays inside the plan limit).
     */
    _resolveRange(from, to) {
        const SKEW_MARGIN_MS = 2 * 60 * 1000;

        // Stay strictly below the plan limit. The gateway rejects a window that
        // reaches OR exceeds query_range_days, and it is checked at day resolution,
        // so a tenth-of-a-second overshoot would still fail. Keep a real margin.
        const allowedDays = Math.max(Number(this.queryRangeDays) || 7, 1);
        const maxSpanMs = allowedDays * 24 * 60 * 60 * 1000 - 10 * 60 * 1000;

        let toDate = to ? new Date(to) : new Date(Date.now() + SKEW_MARGIN_MS);
        if (isNaN(toDate.getTime())) toDate = new Date(Date.now() + SKEW_MARGIN_MS);

        let spanMs = 24 * 60 * 60 * 1000;
        if (from) {
            const parsedFrom = new Date(from);
            if (!isNaN(parsedFrom.getTime())) spanMs = toDate.getTime() - parsedFrom.getTime();
        }
        if (!(spanMs > 0)) spanMs = 24 * 60 * 60 * 1000;
        if (spanMs > maxSpanMs) spanMs = maxSpanMs;

        const fromDate = new Date(toDate.getTime() - spanMs);
        return { from: fromDate.toISOString(), to: toDate.toISOString() };
    }

    /**
     * Fallback message for a failed request whose response carries no usable
     * `error.message`. The gateway does return the documented envelope
     * ({ success:false, error:{ code, message } }), so this only applies when a
     * body is absent, non-JSON, or a proxy in front of the gateway dropped it.
     */
    _describeStatus(status) {
        switch (status) {
            case 400: return 'The server rejected the request (invalid or unsupported fields).';
            case 401: return 'Your session is no longer valid. Please sign in again.';
            case 403: return 'Your current plan or role does not permit this action.';
            case 404: return 'The requested item no longer exists.';
            case 409: return 'An item with these details already exists.';
            case 413: return 'The request payload is too large.';
            case 429: return 'Too many requests. Please wait a moment and retry.';
            case 500: return 'The server encountered an internal error. Please retry shortly.';
            case 502:
            case 503:
            case 504: return 'The server is temporarily unavailable. Please retry shortly.';
            default: return `Request failed (HTTP ${status}).`;
        }
    }

    /**
     * Core fetch wrapper that handles authorization, error schemas and refresh tokens
     */
    async _fetch(endpoint, options = {}) {
        // `absolute: true` lets a caller pass a URL outside the /api/v1 prefix (e.g. /health).
        const url = options.absolute ? `${this.baseUrl.replace(/\/api\/v1\/?$/, '')}${endpoint}` : `${this.baseUrl}${endpoint}`;

        // Clear any stale connection error before a fresh attempt.
        this.lastConnectionError = null;

        const headers = {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        };

        if (this.token && !options.noAuth) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        const config = {
            ...options,
            headers
        };

        if (config.body && typeof config.body === 'object') {
            config.body = JSON.stringify(config.body);
        }

        try {
            let response = await fetch(url, config);

            // Handle 401 Unauthorized (expired JWT) only for JWT-authenticated calls.
            // Device-credential routes (noAuth: /ingest/*) return 401 DEVICE_UNAUTHORIZED
            // and must never trigger a token refresh or a forced logout.
            if (response.status === 401 && !options.noAuth && !options.isRefreshRequest && this.refreshToken) {
                response = await this._handleTokenRefresh(url, config);
            }

            // Handle File Downloads (e.g. CSV/JSON Telemetry Exports)
            if (options.isBlob) {
                if (!response.ok) {
                    const errData = await response.json().catch(() => ({ error: 'Export failed' }));
                    throw errData;
                }
                return await response.blob();
            }

            const data = await response.json().catch(() => null);

            if (!response.ok) {
                throw {
                    status: response.status,
                    data: data,
                    error: data?.error || { code: `HTTP_${response.status}`, message: this._describeStatus(response.status) },
                    message: data?.error?.message || data?.error || this._describeStatus(response.status)
                };
            }

            return data;
        } catch (error) {
            // A thrown TypeError from fetch means the request never reached the
            // gateway (server down, wrong host, DNS, CORS preflight). Tag it so
            // the UI can say so instead of showing a misleading API error.
            if (error instanceof TypeError || (error && error.name === 'TypeError')) {
                const connError = {
                    status: 0,
                    offline: true,
                    error: { code: 'NETWORK_UNREACHABLE', message: `Cannot reach the OmniTeq gateway at ${this.baseUrl}. Check that the server is running and reachable.` },
                    message: `Cannot reach the OmniTeq gateway at ${this.baseUrl}`,
                    data: null
                };
                this.lastConnectionError = connError;
                console.error(`[OmniTeq API] Unreachable: ${url}`, error && error.message);
                throw connError;
            }
            console.error(`API Error [${options.method || 'GET'} ${endpoint}]:`, error);
            throw error;
        }
    }

    /**
     * Handle Token Refresh Queue
     */
    async _handleTokenRefresh(originalUrl, originalConfig) {
        if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
                this.refreshQueue.push({ resolve, reject, url: originalUrl, config: originalConfig });
            });
        }

        this.isRefreshing = true;

        try {
            const refreshRes = await fetch(`${this.baseUrl}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh_token: this.refreshToken })
            });

            if (!refreshRes.ok) {
                this._logoutLocal();
                throw new Error('Refresh token invalid');
            }

            const refreshData = await refreshRes.json().catch(() => null);
            const newAccessToken = refreshData && refreshData.data && refreshData.data.access_token;
            if (!newAccessToken) {
                this._logoutLocal();
                throw new Error('Refresh response did not contain an access token');
            }
            this._saveTokens(newAccessToken, this.refreshToken);

            originalConfig.headers['Authorization'] = `Bearer ${this.token}`;
            const retryRes = await fetch(originalUrl, originalConfig);

            this.refreshQueue.forEach(req => {
                req.config.headers['Authorization'] = `Bearer ${this.token}`;
                fetch(req.url, req.config).then(req.resolve).catch(req.reject);
            });
            
            return retryRes;
        } catch (error) {
            this.refreshQueue.forEach(req => req.reject(error));
            throw error;
        } finally {
            this.isRefreshing = false;
            this.refreshQueue = [];
        }
    }

    _saveTokens(accessToken, refreshToken) {
        this.token = accessToken;
        if (accessToken) localStorage.setItem('access_token', accessToken);
        else localStorage.removeItem('access_token');
        
        if (refreshToken) {
            this.refreshToken = refreshToken;
            localStorage.setItem('refresh_token', refreshToken);
        } else {
            this.refreshToken = null;
            localStorage.removeItem('refresh_token');
        }
    }

    _logoutLocal() {
        this._saveTokens(null, null);
        if (typeof window !== 'undefined' && window.location) {
            window.location.href = 'login.html';
        }
    }

    // ==========================================
    // API NAMESPACES (v3.0 - REST + Ingest + Live SSE)
    // ==========================================

    // 1. Health
    // The gateway exposes liveness at the server root (/health), NOT under /api/v1,
    // and returns a bare { status, timestamp, version } without the usual envelope.
    health = {
        check: () => this._fetch('/health', { noAuth: true, absolute: true }).then(res => {
            if (res && res.success === undefined && res.status !== undefined) {
                const healthy = res.status === 'ok' || res.status === 'healthy';
                return { success: healthy, data: { ...res, status: healthy ? 'healthy' : res.status } };
            }
            return res;
        })
    };

    // 2. Authentication
    auth = {
        register: (data) => this._fetch('/auth/register', { method: 'POST', body: data, noAuth: true }),
        login: (email, password) => this._fetch('/auth/login', { method: 'POST', body: { email, password }, noAuth: true }).then(res => {
            if (res.success && res.data) {
                this._saveTokens(res.data.access_token, res.data.refresh_token);
            }
            return res;
        }),
        me: () => this._fetch('/auth/me'),
        refresh: (refreshToken) => this._fetch('/auth/refresh', { method: 'POST', body: { refresh_token: refreshToken }, noAuth: true, isRefreshRequest: true }),
        logout: () => this._fetch('/auth/logout', { method: 'POST', body: { refresh_token: this.refreshToken } }).finally(() => this._logoutLocal()),
        verifyEmail: (token) => this._fetch(`/auth/verify-email?token=${encodeURIComponent(token)}`, { noAuth: true }),
        resendVerification: (email) => this._fetch('/auth/resend-verification', { method: 'POST', body: { email }, noAuth: true }),
        forgotPassword: (email) => this._fetch('/auth/forgot-password', { method: 'POST', body: { email }, noAuth: true }),
        validateResetPassword: (token) => this._fetch(`/auth/reset-password/validate?token=${encodeURIComponent(token)}`, { noAuth: true }),
        resetPassword: (token, newPassword) => this._fetch('/auth/reset-password', { method: 'POST', body: { token, new_password: newPassword }, noAuth: true })
    };

    // 3. Plans & Billing
    plans = {
        // The gateway returns `code`; older payloads used `plan_code`.
        list: () => this._fetch('/plans', { noAuth: true }).then(res => {
            if (res && res.success && Array.isArray(res.data)) {
                res.data = res.data.map(p => ({
                    ...p,
                    plan_code: p.code !== undefined ? p.code : p.plan_code,
                    device_limit: p.included_devices !== undefined ? p.included_devices : p.device_limit
                }));
            }
            return res;
        })
    };

    account = {
        getPlan: () => this._fetch('/account/plan').then(res => {
            this._normalizePlan(res);
            return res;
        }),
        updatePlan: (planCode) => this._fetch('/account/plan', { method: 'PUT', body: { plan_code: planCode } }).then(async res => {
            this._normalizePlan(res);
            // The PUT response only echoes plan_code, so re-read the plan to pick
            // up the new entitlements and query window.
            if (res && res.success) {
                try {
                    const fresh = await this._fetch('/account/plan');
                    this._normalizePlan(fresh);
                } catch (e) {
                    console.warn('[OmniTeq API] Plan refresh after update failed:', e && e.message);
                }
            }
            return res;
        }),

        // Pricing cards use presentation keys; the entitlement model uses plan_code.
        // Single source of truth for the mapping used by signup and settings.
        uiToApiPlan: {
            'free': 'free',
            'basic': 'basic',
            'moderate': 'standard',
            'payg-standard': 'standard',
            'payg-enterprise': 'professional'
        },
        apiToUiPlan: {
            'free': 'free',
            'basic': 'basic',
            'standard': 'moderate',
            'professional': 'payg-enterprise',
            'enterprise': 'payg-enterprise'
        }
    };

    /**
     * The gateway nests entitlements as { plan, subscription, usage } while the
     * pages read flat fields. Flatten in one place and remember the plan's
     * query_range_days so telemetry windows stay legal.
     */
    _normalizePlan(res) {
        if (!res || !res.success || !res.data) return res;
        const d = res.data;
        const plan = d.plan || {};
        const usage = d.usage || {};

        if (plan.query_range_days) this.queryRangeDays = Number(plan.query_range_days) || this.queryRangeDays;

        const devicesUsage = usage.devices || {};
        const telemetryUsage = usage.telemetry_messages || {};
        const commandUsage = usage.command_dispatch || {};

        res.data = {
            ...d,
            // Plan identity
            plan_code: plan.code !== undefined ? plan.code : d.plan_code,
            plan_name: plan.name !== undefined ? plan.name : d.plan_name,
            monthly_price_inr: plan.monthly_price_inr !== undefined ? plan.monthly_price_inr : d.monthly_cost_inr,
            // Entitlements
            device_limit: plan.included_devices !== undefined ? plan.included_devices : d.device_limit,
            sensors_per_device_limit: plan.sensors_per_device !== undefined ? plan.sensors_per_device : d.sensors_per_device_limit,
            variables_per_sensor_limit: plan.variables_per_sensor !== undefined ? plan.variables_per_sensor : d.variables_per_sensor_limit,
            query_range_days: plan.query_range_days !== undefined ? plan.query_range_days : d.query_range_days,
            data_retention_days: plan.data_retention_days !== undefined ? plan.data_retention_days : d.data_retention_days,
            command_dispatch_monthly_limit: plan.command_dispatch_per_month !== undefined ? plan.command_dispatch_per_month : d.command_dispatch_monthly_limit,
            rule_engine_enabled: plan.rule_engine_enabled !== undefined ? plan.rule_engine_enabled : d.rule_engine_enabled,
            webhooks_enabled: plan.webhooks_enabled !== undefined ? plan.webhooks_enabled : d.webhooks_enabled,
            export_enabled: plan.export_csv !== undefined ? plan.export_csv : d.export_enabled,
            // Consumption
            current_devices_count: devicesUsage.used !== undefined ? devicesUsage.used : d.current_devices_count,
            telemetry_used: telemetryUsage.used !== undefined ? telemetryUsage.used : d.telemetry_used,
            telemetry_limit: telemetryUsage.limit !== undefined ? telemetryUsage.limit : d.telemetry_limit,
            command_dispatch_used: commandUsage.used !== undefined ? commandUsage.used : d.command_dispatch_used,
            team_members_limit: plan.team_members_limit !== undefined ? plan.team_members_limit : d.team_members_limit
        };
        return res;
    }

    // 4. Team / Organization
    team = {
        createInvite: (email, role = 'member') => this._fetch('/team/invitations', { method: 'POST', body: { email, role } }),
        listInvites: () => this._fetch('/team/invitations'),
        deleteInvite: (id) => this._fetch(`/team/invitations/${id}`, { method: 'DELETE' }),
        acceptInvite: (token) => this._fetch(`/team/invitations/${token}/accept`, { method: 'POST' }),
        // The gateway answers { owner, members }, but callers expect a flat array.
        listMembers: () => this._fetch('/team/members').then(res => {
            if (res && res.success && res.data && !Array.isArray(res.data)) {
                const owner = res.data.owner ? [res.data.owner] : [];
                const members = Array.isArray(res.data.members) ? res.data.members : [];
                res.data = owner.concat(members);
            }
            return res;
        }),
        updateMember: (memberId, role) => this._fetch(`/team/members/${memberId}`, { method: 'PUT', body: { role } }),
        removeMember: (memberId) => this._fetch(`/team/members/${memberId}`, { method: 'DELETE' })
    };

    // 5. Projects
    projects = {
        list: () => this._fetch('/projects'),
        create: (data) => this._fetch('/projects', { method: 'POST', body: data }),
        get: (projectId) => this._fetch(`/projects/${projectId}`),
        update: (projectId, data) => this._fetch(`/projects/${projectId}`, { method: 'PUT', body: data }),
        delete: (projectId) => this._fetch(`/projects/${projectId}`, { method: 'DELETE' }),

        /**
         * Deletes a project, working around the same gateway cascade defect that
         * affects device deletion: a project containing a device with dispatched
         * commands fails with 500. Devices are cleared first (which also clears
         * their command templates) and the delete is retried once.
         */
        deleteCascade: async (projectId) => {
            try {
                return await this.projects.delete(projectId);
            } catch (err) {
                if (!err || err.status !== 500) throw err;

                console.warn('[OmniTeq API] Project delete failed on the gateway cascade; clearing devices first.');
                try {
                    const devs = await this.devices.list(projectId);
                    if (devs && devs.success && Array.isArray(devs.data)) {
                        for (const dev of devs.data) {
                            try { await this.devices.deleteCascade(dev.id); } catch (e) { /* keep going */ }
                        }
                    }
                } catch (e) {
                    console.warn('[OmniTeq API] Could not clear project devices:', e && e.message);
                }
                return this.projects.delete(projectId);
            }
        }
    };

    // 6. Devices
    devices = {
        list: (projectId) => this._fetch(`/projects/${projectId}/devices`),
        /**
         * v3.0 adds an account-wide device list at GET /devices, which already
         * returns project_id/project_name, status and sensor_count. Prefer that
         * single request, and fall back to aggregating across projects on older
         * gateways that do not expose it yet.
         */
        listAll: async () => {
            try {
                const res = await this._fetch('/devices');
                if (res && res.success && Array.isArray(res.data)) return res;
            } catch (err) {
                // Only fall through when the route itself is missing; surface
                // real auth/server errors.
                if (!err || (err.status !== 404 && err.status !== 405)) throw err;
            }

            const projectsRes = await this.projects.list();
            if (!projectsRes || !projectsRes.success || !Array.isArray(projectsRes.data)) {
                return projectsRes;
            }
            const all = [];
            for (const project of projectsRes.data) {
                try {
                    const res = await this.devices.list(project.id);
                    if (res && res.success && Array.isArray(res.data)) {
                        res.data.forEach(dev => all.push({
                            ...dev,
                            projectId: project.id,
                            projectName: project.name
                        }));
                    }
                } catch (err) {
                    console.warn(`[OmniTeq API] Skipping project ${project.id} while listing devices:`, err && err.message);
                }
            }
            return { success: true, data: all, meta: { total: all.length } };
        },
        create: (projectId, data) => this._fetch(`/projects/${projectId}/devices`, { method: 'POST', body: data }),
        get: (deviceId) => this._fetch(`/devices/${deviceId}`),
        update: (deviceId, data) => this._fetch(`/devices/${deviceId}`, { method: 'PUT', body: data }),
        delete: (deviceId) => this._fetch(`/devices/${deviceId}`, { method: 'DELETE' }),

        /**
         * Deletes a device, working around a gateway defect.
         *
         * DELETE /devices/:deviceId returns 500 when the device has any
         * dispatched command instance, because the cascade hits
         * cmd_instance_params -> cmd_parameters (foreign key violation).
         * The documented cleanup path is DELETE /command-templates/:id, which
         * also removes that template's instances, so the delete is retried once
         * after clearing the device's command templates.
         *
         * The plain delete is always attempted first, so this costs nothing and
         * changes nothing if the gateway is fixed.
         */
        deleteCascade: async (deviceId) => {
            try {
                return await this.devices.delete(deviceId);
            } catch (err) {
                // Only fall back for the server-side cascade failure.
                if (!err || err.status !== 500) throw err;

                console.warn('[OmniTeq API] Device delete failed on the gateway cascade; clearing command templates first.');
                try {
                    const templates = await this.commands.list(deviceId);
                    if (templates && templates.success && Array.isArray(templates.data)) {
                        for (const tpl of templates.data) {
                            try { await this.commands.delete(tpl.id); } catch (e) { /* keep going */ }
                        }
                    }
                } catch (e) {
                    console.warn('[OmniTeq API] Could not clear command templates:', e && e.message);
                }
                return this.devices.delete(deviceId);
            }
        },
        status: (deviceId) => this._fetch(`/devices/${deviceId}/status`),
        connect: (deviceId) => this._fetch(`/devices/${deviceId}/connect`, { method: 'POST' }),
        disconnect: (deviceId) => this._fetch(`/devices/${deviceId}/disconnect`, { method: 'POST' }),

        /**
         * The gateway does not auto-provision telemetry plumbing on device
         * creation, so a new device has no sensor and no variable and firmware
         * would have nothing valid to publish to. Create the default sensor plus
         * one variable so the provisioning wizard can emit working credentials.
         */
        provisionDefaults: async (deviceId, opts = {}) => {
            const sensor = await this.sensors.create(deviceId, {
                name: opts.sensorName || 'Telemetry Sensor',
                unit: opts.unit || '°C',
                description: 'Auto-provisioned default sensor'
            });
            if (!sensor || !sensor.success || !sensor.data || !sensor.data.id) {
                return { success: false, stage: 'sensor', error: (sensor && sensor.error) || { message: 'Sensor creation failed' } };
            }

            const variable = await this.variables.create(sensor.data.id, {
                label: opts.label || 'temperature',
                data_type: opts.dataType || 'float'
            });
            if (!variable || !variable.success || !variable.data || !variable.data.id) {
                return { success: false, stage: 'variable', sensorId: sensor.data.id, error: (variable && variable.error) || { message: 'Variable creation failed' } };
            }

            return { success: true, sensorId: sensor.data.id, variableId: variable.data.id };
        }
    };

    // 7. Sensors
    sensors = {
        list: (deviceId) => this._fetch(`/devices/${deviceId}/sensors`),
        create: (deviceId, data) => this._fetch(`/devices/${deviceId}/sensors`, { method: 'POST', body: data }),
        get: (sensorId) => this._fetch(`/sensors/${sensorId}`),
        update: (sensorId, data) => this._fetch(`/sensors/${sensorId}`, { method: 'PUT', body: data }),
        delete: (sensorId) => this._fetch(`/sensors/${sensorId}`, { method: 'DELETE' })
    };

    // 8. Variables
    variables = {
        list: (sensorId) => this._fetch(`/sensors/${sensorId}/variables`),
        create: (sensorId, data) => this._fetch(`/sensors/${sensorId}/variables`, { method: 'POST', body: data }),
        get: (variableId) => this._fetch(`/variables/${variableId}`),
        update: (variableId, data) => this._fetch(`/variables/${variableId}`, { method: 'PUT', body: data }),
        delete: (variableId) => this._fetch(`/variables/${variableId}`, { method: 'DELETE' })
    };

    // 9. Command Templates & Dispatch
    commands = {
        list: (deviceId) => this._fetch(`/devices/${deviceId}/command-templates`),
        create: (deviceId, data) => this._fetch(`/devices/${deviceId}/command-templates`, { method: 'POST', body: data }),
        get: (templateId) => this._fetch(`/command-templates/${templateId}`),
        update: (templateId, data) => this._fetch(`/command-templates/${templateId}`, { method: 'PUT', body: data }),
        delete: (templateId) => this._fetch(`/command-templates/${templateId}`, { method: 'DELETE' })
    };

    dispatch = {
        send: (templateId, data) => this._fetch(`/command-templates/${templateId}/dispatch`, { method: 'POST', body: data }),
        getInstance: (instanceId) => this._fetch(`/command-instances/${instanceId}`),
        getHistory: (deviceId, queryParams = {}) => {
            let url = `/devices/${deviceId}/command-history`;
            const params = new URLSearchParams();
            if (queryParams.page) params.append('page', queryParams.page);
            if (queryParams.limit) params.append('limit', queryParams.limit);
            if (queryParams.status) params.append('status', queryParams.status);
            if (params.toString()) url += `?${params.toString()}`;
            return this._fetch(url);
        }
    };

    // 10. Telemetry Queries
    telemetry = {
        // from and to are required by the API. When omitted we default to the last 24 hours
        // so chart/sparkline callers stay simple.
        getHistory: (variableId, from, to, limit) => {
            let url = `/variables/${variableId}/telemetry`;
            const params = new URLSearchParams();
            const range = this._resolveRange(from, to);
            params.append('from', range.from);
            params.append('to', range.to);
            if (limit) params.append('limit', limit);
            url += `?${params.toString()}`;
            return this._fetch(url);
        },
        getLatest: (deviceId) => this._fetch(`/devices/${deviceId}/telemetry/latest`),
        latest: (deviceId) => this._fetch(`/devices/${deviceId}/telemetry/latest`),

        /**
         * Returns the `count` MOST RECENT readings for a variable, oldest-first.
         *
         * Needed because GET /variables/:id/telemetry applies `limit` to the
         * OLDEST rows inside [from, to]: asking for limit=8 returns the first eight
         * readings in the window, not the last eight. Verified against the live
         * gateway - after ingesting values 10..60, limit=4 returned 10,20,30,40
         * while the newest value was 60.
         *
         * Strategy: request as much as the API allows (5000 is its maximum) over
         * the window. If that comes back short the window is fully covered, so the
         * newest rows are already in hand and only one request was needed. Only
         * when the result is truncated does it walk forward from the newest row
         * received, keeping the final (newest) chunk.
         *
         * Use `telemetry.latest(deviceId)` instead when only the current value of
         * each variable is needed - that is a single request per device.
         */
        getRecent: async (variableId, count = 10, spanMs = 7 * 24 * 60 * 60 * 1000) => {
            const want = Math.min(Math.max(Number(count) || 10, 1), 5000);
            const CHUNK = 5000;                       // the API's maximum limit

            // Never build a window that reaches the plan's query_range_days limit:
            // the gateway rejects a range at or beyond it.
            const allowedDays = Math.max(Number(this.queryRangeDays) || 7, 1);
            const maxSpan = allowedDays * 24 * 60 * 60 * 1000 - 10 * 60 * 1000;

            const toMs = Date.now() + 2 * 60 * 1000;   // small forward margin for clock skew
            const to = new Date(toMs).toISOString();
            let fromMs = toMs - Math.min(Number(spanMs) || maxSpan, maxSpan);

            let newestChunk = [];

            for (let attempt = 0; attempt < 20; attempt++) {
                const from = new Date(fromMs).toISOString();
                const res = await this._fetch(
                    `/variables/${variableId}/telemetry?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&limit=${CHUNK}`
                );
                const rows = (res && res.success && res.data && Array.isArray(res.data.readings))
                    ? res.data.readings
                    : [];

                if (rows.length === 0) break;          // nothing left in the window
                newestChunk = rows;                    // ascending; keep the newest seen

                if (rows.length < CHUNK) break;        // window fully covered -> newest rows included

                // Truncated, so continue just after the newest row received.
                const nextFrom = new Date(rows[rows.length - 1].recorded_at).getTime() + 1;
                if (!(nextFrom > fromMs)) break;       // guard against no progress
                fromMs = nextFrom;
            }

            return newestChunk.slice(-want);
        },
        ingest: (data) => this._fetch('/ingest/telemetry', { method: 'POST', body: data, noAuth: true }),
        getAggregates: (variableId, from, to, interval) => {
            let url = `/variables/${variableId}/telemetry/aggregate`;
            const params = new URLSearchParams();
            const range = this._resolveRange(from, to);
            params.append('from', range.from);
            params.append('to', range.to);
            params.append('interval', interval || '1h');
            url += `?${params.toString()}`;
            return this._fetch(url);
        },
        export: (variableId, from, to, format = 'csv') => {
            let url = `/variables/${variableId}/telemetry/export`;
            const params = new URLSearchParams();
            if (from) params.append('from', from);
            if (to) params.append('to', to);
            if (format) params.append('format', format);
            if (params.toString()) url += `?${params.toString()}`;
            return this._fetch(url, { isBlob: true });
        }
    };

    // 11. Rules - Automation & Alerting Engine
    rules = {
        list: (deviceId) => this._fetch(`/devices/${deviceId}/rules`),
        create: (deviceId, data) => this._fetch(`/devices/${deviceId}/rules`, { method: 'POST', body: data }),
        get: (ruleId) => this._fetch(`/rules/${ruleId}`),
        update: (ruleId, data) => this._fetch(`/rules/${ruleId}`, { method: 'PUT', body: data }),
        delete: (ruleId) => this._fetch(`/rules/${ruleId}`, { method: 'DELETE' }),
        logs: (ruleId) => this._fetch(`/rules/${ruleId}/logs`)
    };

    // 12. Webhooks
    webhooks = {
        list: () => this._fetch('/webhooks'),
        create: (data) => this._fetch('/webhooks', { method: 'POST', body: data }),
        update: (id, data) => this._fetch(`/webhooks/${id}`, { method: 'PUT', body: data }),
        delete: (id) => this._fetch(`/webhooks/${id}`, { method: 'DELETE' }),
        deliveries: (id) => this._fetch(`/webhooks/${id}/deliveries`)
    };

    // 13. Alerts History
    alerts = {
        history: (page = 1, limit = 20) => this._fetch(`/alerts/history?page=${page}&limit=${limit}`)
    };

    // 14. Device Ingest (called by IoT devices or client simulation)
    // Every /ingest/* call must be authenticated with device_id + secret_key.
    ingest = {
        telemetry: (data) => this._fetch('/ingest/telemetry', { method: 'POST', body: data, noAuth: true }),
        getPendingCommands: (deviceId, secretKey) => this._fetch(`/ingest/commands/pending?device_id=${encodeURIComponent(deviceId)}&secret_key=${encodeURIComponent(secretKey)}`, { noAuth: true }),
        acknowledgeCommand: (instanceId, data) => this._fetch(`/ingest/commands/${instanceId}/ack`, { method: 'POST', body: data, noAuth: true }),
        heartbeat: (data) => this._fetch('/ingest/heartbeat', { method: 'POST', body: data, noAuth: true })
    };

    // 15. Live Dashboard (v3.0 Server-Sent Events)
    // Real-time push is delivered over SSE, not WebSocket. The JWT is first
    // exchanged for a short-lived (~60 s) stream ticket, which is passed in the
    // query string because EventSource cannot send an Authorization header.
    // Events: `snapshot` (current values), `status` (device online/offline),
    // `reading` (each new value). At most 10 streams may be open per user.
    live = {
        ticket: () => this._fetch('/live/ticket', { method: 'POST' }),

        // Absolute URL of the ready-made dashboard page served by the gateway.
        dashboardUrl: () => `${this.baseUrl.replace(/\/api\/v1\/?$/, '')}/dashboard`,

        streamSensor: (sensorId, handlers = {}) =>
            this._openLiveStream(`/live/sensors/${encodeURIComponent(sensorId)}/stream`, handlers),

        streamDevice: (deviceId, handlers = {}) =>
            this._openLiveStream(`/live/devices/${encodeURIComponent(deviceId)}/stream`, handlers),

        /**
         * Opens an EventSource against a live stream, fetching a fresh ticket
         * first. Returns { close() }.
         *
         * handlers: { onOpen, onSnapshot, onStatus, onReading, onMessage, onError }
         *
         * Because the ticket expires long before the stream ends, an error
         * (server close or dropped connection) tears the source down and
         * reconnects with a brand-new ticket rather than reusing the stale one.
         */
        _openLiveStream: (path, handlers = {}) => {
            let source = null;
            let closed = false;
            let reconnectTimer = null;

            const parse = (raw) => { try { return JSON.parse(raw); } catch (e) { return raw; } };

            const connect = async () => {
                if (closed) return;

                let ticket = null;
                try {
                    const res = await this._fetch('/live/ticket', { method: 'POST' });
                    if (res && res.success && res.data) ticket = res.data.ticket;
                } catch (err) {
                    if (handlers.onError) handlers.onError(err);
                }
                if (closed) return;
                if (!ticket) {
                    if (handlers.onError) handlers.onError({ error: { code: 'NO_STREAM_TICKET', message: 'Could not obtain a live stream ticket.' } });
                    return;
                }

                try {
                    source = new EventSource(`${this.baseUrl}${path}?ticket=${encodeURIComponent(ticket)}`);
                } catch (err) {
                    if (handlers.onError) handlers.onError(err);
                    return;
                }

                source.addEventListener('snapshot', e => handlers.onSnapshot && handlers.onSnapshot(parse(e.data)));
                source.addEventListener('status', e => handlers.onStatus && handlers.onStatus(parse(e.data)));
                source.addEventListener('reading', e => handlers.onReading && handlers.onReading(parse(e.data)));
                source.onmessage = e => handlers.onMessage && handlers.onMessage(parse(e.data));
                source.onopen = () => handlers.onOpen && handlers.onOpen();
                source.onerror = (err) => {
                    if (handlers.onError) handlers.onError(err);
                    if (closed) return;
                    if (source) { source.close(); source = null; }
                    clearTimeout(reconnectTimer);
                    reconnectTimer = setTimeout(connect, 2000);
                };
            };

            connect();
            return {
                close() {
                    closed = true;
                    clearTimeout(reconnectTimer);
                    if (source) { source.close(); source = null; }
                }
            };
        }
    };

    // ==========================================
    // Real-time updates (WebSocket, v3.0 SSE fallback, auto-reload)
    // ==========================================
    //
    // Contract: a WebSocket at <wsUrl> pushes frames shaped as
    // `telemetry.update` / `device.status` / `command.status` / `alert.created`,
    // and every page registers one handler through connectWebSocket().
    //
    // The reference v3.0 gateway serves no /ws route; it delivers real-time
    // push through Server-Sent Events instead (POST /live/ticket, then
    // GET /live/devices/:id/stream). This connector therefore tries the socket
    // first and, when it cannot open, transparently falls back to those SSE
    // streams, normalising `snapshot` / `status` / `reading` events into the
    // exact same message shapes the existing page handlers already consume.
    //
    // If no live transport can be established at all, the page is reloaded once
    // (subject to a cooldown and an attempt cap) so it re-bootstraps its data
    // instead of silently showing stale values.
    connectWebSocket(onMessage, onConnect, onDisconnect, deviceIds = null) {
        // A page may register a listener more than once; never stack transports.
        this.disconnectRealtime();

        this._realtimeReloadScheduled = false;
        this.realtime = {
            onMessage: typeof onMessage === 'function' ? onMessage : null,
            onConnect: typeof onConnect === 'function' ? onConnect : null,
            onDisconnect: typeof onDisconnect === 'function' ? onDisconnect : null,
            deviceIds: Array.isArray(deviceIds) ? deviceIds.slice() : null,
            labels: {},          // variable_id -> { label, unit }, seeded from the SSE snapshot
            streams: [],
            ws: null,
            stopped: false,
            connected: false,
            sseStarted: false,
            sseOpened: false,
            wsTimer: null,
            sseTimer: null
        };

        this._connectWs();
        return this.realtime;
    }

    /** Tear down any active WebSocket and SSE live streams. */
    disconnectRealtime() {
        const rt = this.realtime;
        if (!rt) return;
        rt.stopped = true;
        if (rt.wsTimer) clearTimeout(rt.wsTimer);
        if (rt.sseTimer) clearTimeout(rt.sseTimer);
        if (rt.ws) {
            try {
                rt.ws.onopen = rt.ws.onmessage = rt.ws.onclose = rt.ws.onerror = null;
                rt.ws.close();
            } catch (e) { /* already closed */ }
        }
        (rt.streams || []).forEach(s => { try { s.close(); } catch (e) { /* already closed */ } });
        rt.streams = [];
        this.realtime = null;
        this.ws = null;
    }

    _connectWs() {
        const rt = this.realtime;
        if (!rt || rt.stopped) return;

        let opened = false;
        try {
            const ws = new WebSocket(`${this.wsUrl}?token=${this.token || ''}`);
            rt.ws = ws;
            this.ws = ws;

            // If the socket neither opens nor errors promptly, fall back.
            rt.wsTimer = setTimeout(() => {
                if (!opened && !rt.sseStarted) this._startSseFallback('ws-timeout');
            }, 4000);

            ws.onopen = () => {
                opened = true;
                rt.connected = true;
                this.realtimeAvailable = true;
                if (rt.wsTimer) clearTimeout(rt.wsTimer);
                this._clearReloadState();
                console.log(`[OmniTeq API] Realtime connected over WebSocket: ${this.wsUrl}`);
                if (rt.deviceIds && rt.deviceIds.length && ws.readyState === 1) {
                    ws.send(JSON.stringify({ type: 'subscribe', device_ids: rt.deviceIds }));
                }
                if (rt.onConnect) rt.onConnect({ transport: 'websocket' });
            };

            ws.onmessage = (event) => {
                let data;
                try { data = JSON.parse(event.data); } catch (e) { return; }
                if (rt.onMessage) rt.onMessage(data);
            };

            ws.onclose = () => {
                if (rt.stopped) return;
                this.realtimeAvailable = false;
                if (!opened) {
                    // Never opened: the gateway likely has no /ws route.
                    this._startSseFallback('ws-close');
                } else {
                    // Had been working, now dropped: recover over SSE if possible.
                    rt.connected = false;
                    if (rt.onDisconnect) rt.onDisconnect({ transport: 'websocket', reason: 'closed' });
                    this._startSseFallback('ws-dropped');
                }
            };

            ws.onerror = () => {
                if (rt.stopped) return;
                this.realtimeAvailable = false;
                if (!opened) this._startSseFallback('ws-error');
            };
        } catch (e) {
            this._startSseFallback('ws-exception');
        }
    }

    /**
     * Fall back to the v3.0 Server-Sent Events live streams. Resolves the device
     * set (caller-provided, otherwise the account-wide GET /devices list), then
     * opens one stream per device - the gateway allows at most 10 per user.
     */
    async _startSseFallback(reason) {
        const rt = this.realtime;
        if (!rt || rt.stopped || rt.sseStarted) return;
        rt.sseStarted = true;

        if (rt.wsTimer) clearTimeout(rt.wsTimer);
        if (rt.ws) {
            try {
                rt.ws.onopen = rt.ws.onmessage = rt.ws.onclose = rt.ws.onerror = null;
                rt.ws.close();
            } catch (e) { /* already closed */ }
            rt.ws = null;
        }

        console.warn(`[OmniTeq API] WebSocket unavailable (${reason}); falling back to v3.0 SSE live streams.`);

        let ids = rt.deviceIds;
        if (!ids || !ids.length) {
            try {
                const res = await this.devices.listAll();
                ids = (res && res.success && Array.isArray(res.data))
                    ? res.data.map(d => d && d.id).filter(Boolean)
                    : [];
            } catch (e) {
                // Could not even enumerate devices: treat as a live-layer failure
                // so the page reloads and re-bootstraps instead of going stale.
                if (rt.stopped) return;
                this._scheduleAutoReload('device-list-failed');
                return;
            }
        }
        if (rt.stopped) return;

        if (!ids.length) {
            // Nothing to stream (e.g. an account with no devices): stop quietly.
            this.realtimeAvailable = false;
            if (rt.onDisconnect) rt.onDisconnect({ transport: 'none', reason: 'no-devices' });
            return;
        }

        ids.slice(0, 10).forEach((id) => {
            if (rt.stopped) return;
            const stream = this.live.streamDevice(id, {
                onOpen: () => {
                    if (rt.stopped) return;
                    rt.connected = true;
                    rt.sseOpened = true;
                    this.realtimeAvailable = true;
                    if (rt.sseTimer) clearTimeout(rt.sseTimer);
                    this._clearReloadState();
                    if (rt.onConnect) rt.onConnect({ transport: 'sse', deviceId: id });
                },
                onSnapshot: (snap) => {
                    if (!snap || !snap.device) return;
                    if (Array.isArray(snap.variables)) {
                        snap.variables.forEach(v => {
                            if (v && v.variable_id) rt.labels[v.variable_id] = { label: v.label, unit: v.unit };
                        });
                    }
                    if (rt.onMessage) {
                        rt.onMessage({
                            type: 'device.status',
                            device_id: snap.device.id,
                            status: snap.device.status,
                            last_seen_at: snap.device.last_seen_at
                        });
                    }
                },
                onStatus: (msg) => {
                    if (!msg || !rt.onMessage) return;
                    rt.onMessage({ type: 'device.status', device_id: msg.device_id, status: msg.status, last_seen_at: msg.at });
                },
                onReading: (msg) => {
                    if (!msg || !rt.onMessage) return;
                    const meta = rt.labels[msg.variable_id] || {};
                    rt.onMessage({
                        type: 'telemetry.update',
                        device_id: msg.device_id,
                        sensor_id: msg.sensor_id,
                        variable_id: msg.variable_id,
                        data_type: msg.data_type,
                        value: msg.value,
                        recorded_at: msg.recorded_at,
                        label: meta.label,
                        unit: meta.unit
                    });
                }
            });
            rt.streams.push(stream);
        });

        // If no stream ever opens, the live layer is unusable: reload to retry.
        if (rt.sseTimer) clearTimeout(rt.sseTimer);
        rt.sseTimer = setTimeout(() => {
            if (!rt.stopped && !rt.sseOpened) {
                if (rt.onDisconnect) rt.onDisconnect({ transport: 'none', reason: 'sse-timeout' });
                this._scheduleAutoReload('sse-timeout');
            }
        }, 8000);
    }

    /** Forget the auto-reload counter once a live transport actually works. */
    _clearReloadState() {
        try { sessionStorage.removeItem('omniteq_realtime_reload'); } catch (e) { /* ignore */ }
    }

    /**
     * Reloads the page when live updates cannot connect, so it re-bootstraps.
     * Guarded by a 60s cooldown and a 3-attempt cap (tracked in sessionStorage)
     * so a gateway without realtime support cannot trap the console in a loop.
     */
    _scheduleAutoReload(reason) {
        // Only meaningful on authenticated console pages.
        if (!this.token) return;
        if (this._realtimeReloadScheduled) return;
        if (typeof window === 'undefined' || !window.location || typeof window.location.reload !== 'function') return;
        this._realtimeReloadScheduled = true;

        const KEY = 'omniteq_realtime_reload';
        let state = { at: 0, count: 0 };
        try { state = JSON.parse(sessionStorage.getItem(KEY) || 'null') || state; } catch (e) { /* ignore */ }

        const now = Date.now();
        if (now - (Number(state.at) || 0) < 60000) {
            console.warn('[OmniTeq API] Live updates still unavailable; auto-reload on cooldown.');
            return;
        }
        if ((Number(state.count) || 0) >= 3) {
            console.warn('[OmniTeq API] Live updates unavailable; auto-reload stopped after 3 attempts.');
            return;
        }
        state.count = (Number(state.count) || 0) + 1;
        state.at = now;
        try { sessionStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }

        console.warn(`[OmniTeq API] Live updates could not connect (${reason}); reloading to retry (attempt ${state.count}/3).`);
        if (typeof window.showToast === 'function') {
            try { window.showToast('Live updates unavailable - reloading...', 'warning'); } catch (e) { /* ignore */ }
        }
        setTimeout(() => { try { window.location.reload(); } catch (e) { /* ignore */ } }, 1500);
    }
}

// Instantiate global API client
window.api = new OmniTeqAPI();
