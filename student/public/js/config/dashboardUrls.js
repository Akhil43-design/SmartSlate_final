/* Centralized SmartSlate Dashboard / Application Launch URLs */

function getHost() {
    if (typeof window !== 'undefined' && window.location && window.location.hostname) {
        return window.location.hostname;
    }
    return '10.42.0.1';
}

function getProtocol() {
    if (typeof window !== 'undefined' && window.location && window.location.protocol) {
        return window.location.protocol;
    }
    return 'http:';
}

const DASHBOARD_URLS = {
    get elementary() { return `${getProtocol()}//${getHost()}:3002`; },
    get highSchool() { return `${getProtocol()}//${getHost()}:3003`; },
    get intermediate() { return `${getProtocol()}//${getHost()}:3004`; },
    get btech() { return `${getProtocol()}//${getHost()}:3005`; }
};

const MAIN_APP_URL = `${getProtocol()}//${getHost()}:3000`;

if (typeof window !== 'undefined') {
    window.DASHBOARD_URLS = DASHBOARD_URLS;
    window.MAIN_APP_URL = MAIN_APP_URL;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DASHBOARD_URLS, MAIN_APP_URL };
}
