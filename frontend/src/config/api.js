// API Configuration for Server Guard Frontend
// Supports both local development and Render deployment

const isDevelopment = import.meta.env.DEV;

// Get API URL from environment variable (set by Render) or use defaults
// VITE_API_URL will be set to the API gateway host (e.g., server-guard-api-gateway.onrender.com)
const RENDER_API_HOST = import.meta.env.VITE_API_URL;

// Build the full API Gateway URL for Render deployment
const getApiGatewayUrl = () => {
    if (RENDER_API_HOST) {
        // Render provides just the hostname, we need to add https://
        const host = RENDER_API_HOST.startsWith('http') 
            ? RENDER_API_HOST 
            : `https://${RENDER_API_HOST}`;
        return host;
    }
    // Fallback: use relative URL for static site proxy
    return '';
};

// Development URLs (direct backend access)
const DEV_CONFIG = {
    API_GATEWAY: 'http://127.0.0.1:3001',
    MODEL_SERVICE: 'http://127.0.0.1:5000',
    DETECTION_ENGINE: 'http://127.0.0.1:8002',
    INGEST_SERVICE: 'http://127.0.0.1:8001',
    ALERT_MANAGER: 'http://127.0.0.1:8003',
    RESPONSE_ENGINE: 'http://127.0.0.1:8004',
    // Socket.IO URL for real-time updates
    SOCKET_URL: 'http://127.0.0.1:3001',
};

// Production URLs - all traffic goes through API Gateway on Render
const API_GATEWAY = getApiGatewayUrl();
const PROD_CONFIG = {
    API_GATEWAY: API_GATEWAY,
    MODEL_SERVICE: API_GATEWAY,
    DETECTION_ENGINE: API_GATEWAY,
    INGEST_SERVICE: API_GATEWAY,
    ALERT_MANAGER: API_GATEWAY,
    RESPONSE_ENGINE: API_GATEWAY,
    // Socket.IO URL - same as API Gateway for Render
    SOCKET_URL: API_GATEWAY,
};

export const API_CONFIG = isDevelopment ? DEV_CONFIG : PROD_CONFIG;

// Helper function to build API URLs
export const buildApiUrl = (service, path = '') => {
    const baseUrl = API_CONFIG[service] || API_CONFIG.API_GATEWAY;
    return `${baseUrl}${path}`;
};

// Get Socket.IO connection URL
export const getSocketUrl = () => {
    return API_CONFIG.SOCKET_URL || API_CONFIG.API_GATEWAY;
};

export default API_CONFIG;
