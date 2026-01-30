// API Configuration for Server Guard Frontend
// In production, nginx proxies /api/* to the backend services

const isDevelopment = import.meta.env.DEV;

// Get API URL from environment variable (set by Render) or use defaults
const API_GATEWAY_URL = import.meta.env.VITE_API_URL 
    ? `https://${import.meta.env.VITE_API_URL}`
    : null;

// Development URLs (direct backend access)
const DEV_CONFIG = {
    API_GATEWAY: 'http://127.0.0.1:8000',
    MODEL_SERVICE: 'http://127.0.0.1:5000',
    DETECTION_ENGINE: 'http://127.0.0.1:8001',
    INGEST_SERVICE: 'http://127.0.0.1:8002',
    ALERT_MANAGER: 'http://127.0.0.1:8003',
    RESPONSE_ENGINE: 'http://127.0.0.1:8004',
};

// Production URLs (proxied through API gateway or use Render service URL)
const PROD_CONFIG = {
    API_GATEWAY: API_GATEWAY_URL || '/api',
    MODEL_SERVICE: API_GATEWAY_URL || '/api',
    DETECTION_ENGINE: API_GATEWAY_URL || '/api',
    INGEST_SERVICE: API_GATEWAY_URL || '/api',
    ALERT_MANAGER: API_GATEWAY_URL || '/api',
    RESPONSE_ENGINE: API_GATEWAY_URL || '/api',
};

export const API_CONFIG = isDevelopment ? DEV_CONFIG : PROD_CONFIG;

// Helper function to build API URLs
export const buildApiUrl = (service, path = '') => {
    const baseUrl = API_CONFIG[service] || API_CONFIG.API_GATEWAY;
    return `${baseUrl}${path}`;
};

export default API_CONFIG;
