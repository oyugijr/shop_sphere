const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./src/config/db');
const paymentRoutes = require('./src/routes/paymentRoutes');
const mpesaRoutes = require('./src/routes/mpesaRoutes');
const paypalRoutes = require('./src/routes/paypalRoutes');
const errorHandler = require('./src/middlewares/errorHandler');
const verifyWebhookSignature = require('./src/middlewares/webhookMiddleware');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true,
}));

// Webhook routes with raw body (must be before express.json())
app.post(
  '/api/payments/webhook',
  express.raw({ type: 'application/json' }),
  verifyWebhookSignature,
  require('./src/controllers/paymentController').handleWebhook
);

// M-Pesa callback (needs raw body for verification)
app.post(
  '/api/mpesa/callback',
  express.json(),
  require('./src/controllers/mpesaController').handleMpesaCallback
);

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'payment-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    providers: ['stripe', 'mpesa', 'paypal'],
  });
});

// API routes
app.use('/api/payments', paymentRoutes);
app.use('/api/mpesa', mpesaRoutes);
app.use('/api/paypal', paypalRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`,
  });
});

// Global error handler (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5005;
const server = app.listen(PORT, () => {
  console.log(`💳 Payment Service running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`💰 Payment Providers: Stripe, M-Pesa, PayPal`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

module.exports = app;
