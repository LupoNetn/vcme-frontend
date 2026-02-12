const isProd = import.meta.env.PROD;

export const BASE_URL = isProd 
    ? "https://vcme-backend.onrender.com" 
    : "http://localhost:5000";

export const WS_URL = isProd 
    ? "wss://vcme-backend.onrender.com" 
    : "ws://localhost:5000";
