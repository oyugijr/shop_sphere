require("dotenv").config();
const axios = require("axios");

// Bravo API Base URL & Key
const BREVO_API_URL = process.env.BREVO_API_URL ||  "https://api.brevo.com/v3";
const BREVO_API_KEY = process.env.BREVO_API_KEY;

// Axios instance for API requests
const brevoClient = axios.create({
    baseURL: BREVO_API_URL,
    headers: {
        "api-key": BREVO_API_KEY,
        "Content-Type": "application/json"
    },
});

module.exports = brevoClient;