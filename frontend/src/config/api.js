// API Configuration for Server Guard Frontend
// In production, all API calls go directly to the unified backend service URL

const isDevelopment = import.meta.env.DEV;

// Production: use VITE_API_URL env var (set at build time on Render)
// Development: use localhost
const BACKEND_URL = import.meta.env.VITE_API_URL || '';

// Development URLs (direct backend access)
const DEV_CONFIG = {
    API_GATEWAY: 'http://127.0.0.1:8000',
    MODEL_SERVICE: 'http://127.0.0.1:8000',
    DETECTION_ENGINE: 'http://127.0.0.1:8000',
    INGEST_SERVICE: 'http://127.0.0.1:8000',
    ALERT_MANAGER: 'http://127.0.0.1:8000',
    RESPONSE_ENGINE: 'http://127.0.0.1:8000',
};

// Production URLs (unified backend)
const PROD_CONFIG = {
    API_GATEWAY: BACKEND_URL,
    MODEL_SERVICE: BACKEND_URL,
    DETECTION_ENGINE: BACKEND_URL,
    INGEST_SERVICE: BACKEND_URL,
    ALERT_MANAGER: BACKEND_URL,
    RESPONSE_ENGINE: BACKEND_URL,
};

export const API_CONFIG = isDevelopment ? DEV_CONFIG : PROD_CONFIG;

// Helper function to build API URLs
export const buildApiUrl = (service, path = '') => {
    const baseUrl = API_CONFIG[service] || API_CONFIG.API_GATEWAY;
    return `${baseUrl}${path}`;
};

export default API_CONFIG;
