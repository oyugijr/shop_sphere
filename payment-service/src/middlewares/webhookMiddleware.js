const stripe = require('../config/stripe');

/**
 * Middleware to verify Stripe webhook signatures
 * This ensures webhooks are actually from Stripe
 */
const verifyWebhookSignature = (req, res, next) => {
  const signature = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.warn('Warning: STRIPE_WEBHOOK_SECRET not configured');
    // In development, you might want to skip verification
    if (process.env.NODE_ENV === 'production') {
      return res.status(500).json({
        error: 'Webhook secret not configured',
      });
    }
    return next();
  }

  if (!signature) {
    return res.status(400).json({
      error: 'Missing stripe-signature header',
    });
  }

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      webhookSecret
    );
    req.stripeEvent = event;
    next();
  } catch (error) {
    console.error('Webhook signature verification failed:', error.message);
    return res.status(400).json({
      error: 'Webhook signature verification failed',
      message: error.message,
    });
  }
};

module.exports = verifyWebhookSignature;
