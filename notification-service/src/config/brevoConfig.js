require("dotenv").config();
const axios = require("axios");

// Brevo API Base URL & Key
const BREVO_API_URL = process.env.BREVO_API_URL || "https://api.brevo.com/v3";
const BREVO_API_KEY = process.env.BREVO_API_KEY;

if (!BREVO_API_KEY) {
  console.warn("⚠️  WARNING: BREVO_API_KEY is not set. Notification sending will fail.");
}

// Axios instance for API requests with timeout and retry configuration
const brevoClient = axios.create({
  baseURL: BREVO_API_URL,
  headers: {
    "api-key": BREVO_API_KEY,
    "Content-Type": "application/json"
  },
  timeout: 30000, // 30 second timeout
});

// Add request interceptor for logging
brevoClient.interceptors.request.use(
  (config) => {
    console.log(`[Brevo] ${config.method.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error("[Brevo] Request error:", error.message);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
brevoClient.interceptors.response.use(
  (response) => {
    console.log(`[Brevo] ✓ Response received: ${response.status}`);
    return response;
  },
  (error) => {
    if (error.response) {
      console.error(`[Brevo] ✗ API Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      console.error("[Brevo] ✗ No response received from Brevo API");
    } else {
      console.error("[Brevo] ✗ Request setup error:", error.message);
    }
    return Promise.reject(error);
  }
);

module.exports = brevoClient;
