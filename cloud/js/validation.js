/**
 * OmniTeq Cloud - Data Integrity & Anti-Fake Validation Engine v2.2
 * Enforces strict input validation and blocks fake, dummy, or malformed data.
 */

(function(window) {
    'use strict';

    const DUMMY_PATTERNS = [
        /^test$/i, /^fake$/i, /^asdf/i, /^qwerty/i, /^foo$/i, /^bar$/i, /^baz$/i,
        /^dummy/i, /^sample/i, /^temp$/i, /^null$/i, /^undefined$/i, /^abc/i,
        /^1234/i, /^0000/i, /^xxxx/i, /^zzzz/i, /testdevice/i, /testproject/i, /testsensor/i
    ];

    const FAKE_EMAIL_DOMAINS = [
        'test.com', 'fake.com', 'example.com', 'dummy.com', 'temp.com',
        'asdf.com', 'trashmail.com', 'mailinator.com', 'dispostable.com', 'invalid.com'
    ];

    const FAKE_MACS = [
        '00:00:00:00:00:00', 'FF:FF:FF:FF:FF:FF', '12:34:56:78:90:AB',
        'AA:AA:AA:AA:AA:AA', '00-00-00-00-00-00', '000000000000', 'FFFFFFFFFFFF'
    ];

    class OmniTeqValidator {
        /**
         * Checks if a string is a dummy/fake placeholder word
         */
        static isDummyValue(value) {
            if (!value || typeof value !== 'string') return true;
            const clean = value.trim();
            if (clean.length === 0) return true;
            return DUMMY_PATTERNS.some(pattern => pattern.test(clean));
        }

        /**
         * Validate Text input (names, descriptions, codes)
         */
        static validateText(value, fieldLabel = 'Field', minLength = 3) {
            if (!value || typeof value !== 'string') {
                return { valid: false, error: `${fieldLabel} is required.` };
            }
            const clean = value.trim();
            if (clean.length < minLength) {
                return { valid: false, error: `${fieldLabel} must be at least ${minLength} characters.` };
            }
            if (this.isDummyValue(clean)) {
                return { valid: false, error: `${fieldLabel} cannot be dummy or test text ("${clean}"). Please enter real descriptive data.` };
            }
            return { valid: true, value: clean };
        }

        /**
         * Validate Email Addresses
         */
        static validateEmail(email) {
            if (!email || typeof email !== 'string') {
                return { valid: false, error: 'Email address is required.' };
            }
            const clean = email.trim().toLowerCase();
            const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            if (!emailRegex.test(clean)) {
                return { valid: false, error: 'Please enter a valid email address (e.g. name@company.com).' };
            }
            const domain = clean.split('@')[1];
            if (FAKE_EMAIL_DOMAINS.includes(domain)) {
                return { valid: false, error: `Email domain "${domain}" is not permitted. Please use a real organizational email address.` };
            }
            return { valid: true, value: clean };
        }

        /**
         * Validate MAC / Hardware EUI-64 Addresses
         */
        static validateMAC(mac) {
            if (!mac || typeof mac !== 'string') {
                return { valid: false, error: 'Hardware EUI / MAC address is required.' };
            }
            const clean = mac.trim().toUpperCase();
            const macRegex = /^([0-9A-F]{2}[:-]){5}([0-9A-F]{2})$|^[0-9A-F]{12}$|^([0-9A-F]{2}[:-]){7}([0-9A-F]{2})$|^[0-9A-F]{16}$/i;
            
            if (!macRegex.test(clean)) {
                return { valid: false, error: 'Invalid Hardware EUI / MAC format. Must be hex format like "00:1A:2B:3C:4D:5E" or 16-hex EUI-64.' };
            }
            if (FAKE_MACS.includes(clean)) {
                return { valid: false, error: `Hardware EUI "${clean}" is a known default placeholder. Please enter a real device MAC/EUI.` };
            }
            return { valid: true, value: clean };
        }

        /**
         * Generate a standard canonical UUIDv4 (8-4-4-4-12)
         */
        static generateUUIDv4() {
            if (typeof crypto !== 'undefined' && crypto.randomUUID) {
                return crypto.randomUUID();
            }
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        }

        /**
         * Validate UUID (8-4-4-4-12 format) for Device ID, Physical ID, or Variable ID
         */
        static validateUUID(value, fieldLabel = 'Device ID', required = false) {
            if (!value || typeof value !== 'string') {
                if (!required) return { valid: true, value: '' };
                return { valid: false, error: `${fieldLabel} is required.` };
            }
            const clean = value.trim();
            if (clean === '') {
                if (!required) return { valid: true, value: '' };
                return { valid: false, error: `${fieldLabel} is required.` };
            }
            // Standard UUID 8-4-4-4-12 hex format (optionally prefixed with dev_, var_, or sen_)
            const uuidRegex = /^(?:(?:dev|var|sen|prj|usr)_)?[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
            if (!uuidRegex.test(clean)) {
                return { 
                    valid: false, 
                    error: `${fieldLabel} must be a valid 8-4-4-4-12 UUID (e.g. 123e4567-e89b-12d3-a456-426614174000).` 
                };
            }
            return { valid: true, value: clean };
        }

        /**
         * Validate JSON Payloads
         */
        static validateJSON(jsonStr, fieldLabel = 'Payload') {
            if (!jsonStr || typeof jsonStr !== 'string') {
                return { valid: false, error: `${fieldLabel} is required.` };
            }
            const clean = jsonStr.trim();
            if (clean === '' || clean === '{}' || clean === '[]') {
                return { valid: false, error: `${fieldLabel} cannot be empty. Must contain valid key-value pairs.` };
            }
            try {
                const parsed = JSON.parse(clean);
                if (typeof parsed !== 'object' || parsed === null) {
                    return { valid: false, error: `${fieldLabel} must be a valid JSON object.` };
                }
                return { valid: true, value: parsed, raw: clean };
            } catch (e) {
                return { valid: false, error: `${fieldLabel} contains invalid JSON syntax: ${e.message}` };
            }
        }

        /**
         * Validate Webhook URLs
         */
        static validateURL(url, fieldLabel = 'URL') {
            if (!url || typeof url !== 'string') {
                return { valid: false, error: `${fieldLabel} is required.` };
            }
            const clean = url.trim();
            if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
                return { valid: false, error: `${fieldLabel} must start with http:// or https://` };
            }
            try {
                const parsed = new URL(clean);
                if (parsed.hostname.length < 3 || this.isDummyValue(parsed.hostname)) {
                    return { valid: false, error: `Invalid target hostname in ${fieldLabel}. Please provide a real endpoint URL.` };
                }
                return { valid: true, value: clean };
            } catch (e) {
                return { valid: false, error: `Invalid ${fieldLabel} format.` };
            }
        }

        /**
         * Validate Min / Max Range bounds
         */
        static validateNumericBounds(minVal, maxVal, fieldLabel = 'Threshold Range') {
            const min = parseFloat(minVal);
            const max = parseFloat(maxVal);

            if (isNaN(min) || !isFinite(min)) {
                return { valid: false, error: `Minimum threshold for ${fieldLabel} must be a valid number.` };
            }
            if (isNaN(max) || !isFinite(max)) {
                return { valid: false, error: `Maximum threshold for ${fieldLabel} must be a valid number.` };
            }
            if (min >= max) {
                return { valid: false, error: `Minimum threshold (${min}) must be strictly less than maximum threshold (${max}).` };
            }
            return { valid: true, min, max };
        }

        /**
         * Validate Telemetry Ingestion Input
         */
        static validateTelemetry(payload) {
            if (!payload || typeof payload !== 'object') {
                return { valid: false, error: 'Telemetry payload must be an object.' };
            }
            if (!payload.device_id && !payload.mac) {
                return { valid: false, error: 'Telemetry requires a valid Target Device ID or MAC Address.' };
            }
            if (!payload.variable && !payload.sensor_name) {
                return { valid: false, error: 'Telemetry requires a valid Variable or Sensor Name.' };
            }
            const val = parseFloat(payload.value);
            if (isNaN(val) || !isFinite(val)) {
                return { valid: false, error: 'Telemetry value must be a real finite number (NaN and null are rejected).' };
            }
            if (val < -273.15 || val > 1000000) {
                return { valid: false, error: `Telemetry value (${val}) is outside physically plausible bounds.` };
            }
            return { valid: true, payload: { ...payload, value: val } };
        }

        /**
         * Visual Feedback: Highlight input field with error glow & message
         */
        static markFieldError(inputElement, errorMessage) {
            if (!inputElement) return;
            inputElement.classList.add('input-error');
            
            let errorMsgEl = inputElement.parentElement.querySelector('.field-error-msg');
            if (!errorMsgEl) {
                errorMsgEl = document.createElement('div');
                errorMsgEl.className = 'field-error-msg';
                inputElement.parentElement.appendChild(errorMsgEl);
            }
            errorMsgEl.textContent = errorMessage;
            errorMsgEl.style.display = 'block';

            inputElement.focus();
        }

        /**
         * Visual Feedback: Clear error state on input
         */
        static clearFieldError(inputElement) {
            if (!inputElement) return;
            inputElement.classList.remove('input-error');
            const errorMsgEl = inputElement.parentElement.querySelector('.field-error-msg');
            if (errorMsgEl) {
                errorMsgEl.style.display = 'none';
                errorMsgEl.textContent = '';
            }
        }

        /**
         * Attach real-time input clean up listener
         */
        static bindLiveValidation(formElement) {
            if (!formElement) return;
            const inputs = formElement.querySelectorAll('input, select, textarea');
            inputs.forEach(input => {
                input.addEventListener('input', () => this.clearFieldError(input));
                input.addEventListener('change', () => this.clearFieldError(input));
            });
        }
    }

    window.OmniTeqValidator = OmniTeqValidator;
})(window);
