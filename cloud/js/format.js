/* ==========================================================================
   OmniTeq Cloud — Shared sensor value/unit formatters
   --------------------------------------------------------------------------
   Single source of truth for turning raw API values + stored unit strings into
   human-readable text. Server data has historically contained a mix of
   mojibake units (a stray degree-sign prefix), bare symbols ("%", "°"),
   combined units ("°C / %RH") and raw booleans ("true"/"false"). Every page
   must call these helpers instead of formatting inline so behaviour stays
   consistent.

   Pure module: no DOM access, no side effects, safe to include anywhere.
   Public API:  formatSensorValue(value, unit, label)
                formatSensorUnit(unit, label)
                formatBooleanValue(value)
                formatSensorReading(value, unit, label)   // value + unit
   ========================================================================== */
(function () {
    'use strict';

    // Canonical unit per sensor family, matched against the sensor label first
    // and the stored unit second. Order matters (specific before generic).
    var UNIT_BY_KEYWORD = [
        [/humid/i, '%RH'],
        [/temperature|temp\b|thermo/i, '°C'],
        [/accel|vibrat|vibe/i, 'm/s²'],
        [/pressure|baro(?!temp)/i, 'hPa'],
        [/distance|ultrasonic|proximity/i, 'cm'],
        [/light|lux|lumin/i, 'lux'],
        [/air[\s-]?quality|carbon|\bco2\b|\bppm\b|\bgas\b/i, 'ppm'],
        [/current|amper|amp\b/i, 'A'],
        [/voltage|volt/i, 'V'],
        [/motion|presence|door|contact|switch|relay|boolean|digital|state|status|led|detected/i, '']
    ];

    var BOOL_TRUE = /^(1|true|on|yes|high|active|open|detected|present)$/i;
    var BOOL_FALSE = /^(0|false|off|no|low|inactive|closed|clear|absent)$/i;

    // Strip leftover "Â" byte artefacts and collapse whitespace.
    function clean(raw) {
        if (raw === null || raw === undefined) return '';
        return String(raw).replace(/\u00C2/g, '').replace(/\s+/g, ' ').trim();
    }

    function looksBoolean(unit, label) {
        var u = String(unit || '').toLowerCase();
        if (u.indexOf('bool') !== -1 || u === 'on/off' || u === 'switch' || u === 'digital') return true;
        return /motion|presence|door|contact|switch|relay|boolean|digital|state|status|led|detected/i.test(label || '');
    }

    window.formatBooleanValue = function (value) {
        if (typeof value === 'boolean') return value ? 'ON' : 'OFF';
        var v = String(value === null || value === undefined ? '' : value).trim();
        if (BOOL_FALSE.test(v)) return 'OFF';
        if (BOOL_TRUE.test(v)) return 'ON';
        return v === '' ? 'OFF' : 'ON';
    };

    window.formatSensorUnit = function (unit, label) {
        var cleaned = clean(unit);
        var labelText = String(label || '');
        var low = cleaned.toLowerCase();

        // Normalise a few spread-out spellings before anything else.
        if (low === 'c' || low === 'celsius' || low === 'degc') cleaned = '°C';
        if (low === 'f' || low === 'fahrenheit') cleaned = '°F';
        if (cleaned === 'rh' || low === '%rh') cleaned = '%RH';

        // Explicit single-symbol units.
        if (cleaned === '%') return /humid/i.test(labelText) ? '%RH' : '%';
        if (cleaned === '°') return /temperature|temp\b|thermo/i.test(labelText) ? '°C' : '°';

        var combined = cleaned.indexOf('/') !== -1;
        if (cleaned && !combined) {
            if (looksBoolean(cleaned, labelText)) return '';
            return cleaned; // already a valid unit (V, A, hPa, lux, ppm, cm, m/s², °C …)
        }

        // Empty or combined ("°C / %") unit — derive canonically from the label.
        for (var i = 0; i < UNIT_BY_KEYWORD.length; i++) {
            if (UNIT_BY_KEYWORD[i][0].test(labelText)) return UNIT_BY_KEYWORD[i][1];
        }
        return '';
    };

    window.formatSensorValue = function (value, unit, label) {
        if (value === null || value === undefined || value === '') return '—';

        if (looksBoolean(clean(unit), label)) return window.formatBooleanValue(value);

        var str = String(value).trim();
        var numeric = typeof value === 'number' ? value : Number(str);
        if (isFinite(numeric) && str !== '') {
            return Number.isInteger(numeric) ? String(numeric) : String(Math.round(numeric * 100) / 100);
        }

        // Non-numeric strings that read as booleans.
        if (BOOL_TRUE.test(str) || BOOL_FALSE.test(str)) return window.formatBooleanValue(str);

        return String(value);
    };

    window.formatSensorReading = function (value, unit, label) {
        var v = window.formatSensorValue(value, unit, label);
        var u = window.formatSensorUnit(unit, label);
        if (v === '—' || !u) return v;
        return v + ' ' + u;
    };
})();
