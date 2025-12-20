const paypal = require('@paypal/paypal-server-sdk');

class PayPalClient {
  constructor() {
    this.clientId = process.env.PAYPAL_CLIENT_ID;
    this.clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    this.environment = process.env.PAYPAL_ENVIRONMENT || 'sandbox';

    // Validate required configuration
    if (process.env.NODE_ENV !== 'test') {
      if (!this.clientId || !this.clientSecret) {
        throw new Error('PayPal credentials (PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET) are required');
      }
    }

    // Initialize PayPal client
    if (process.env.NODE_ENV !== 'test' || typeof jest === 'undefined') {
      this.client = new paypal.Client({
        clientCredentialsAuthCredentials: {
          oAuthClientId: this.clientId,
          oAuthClientSecret: this.clientSecret,
        },
        environment: this.environment === 'production' 
          ? paypal.Environment.Production 
          : paypal.Environment.Sandbox,
      });
    }
  }

  /**
   * Create PayPal order
   * @param {number} amount - Amount in base currency (e.g., 99.99 for $99.99)
   * @param {string} currency - Currency code (e.g., 'USD')
   * @param {object} metadata - Additional metadata
   */
  async createOrder(amount, currency = 'USD', metadata = {}) {
    try {
      const request = {
        body: {
          intent: 'CAPTURE',
          purchaseUnits: [
            {
              amount: {
                currencyCode: currency.toUpperCase(),
                value: amount.toFixed(2),
              },
              description: metadata.description || 'ShopSphere Order',
              customId: metadata.orderId || '',
              invoiceId: metadata.invoiceId || '',
            },
          ],
          applicationContext: {
            returnUrl: metadata.returnUrl || `${process.env.PAYPAL_RETURN_URL || 'http://localhost:3000'}/payment/success`,
            cancelUrl: metadata.cancelUrl || `${process.env.PAYPAL_CANCEL_URL || 'http://localhost:3000'}/payment/cancel`,
            brandName: 'ShopSphere',
            landingPage: 'BILLING',
            userAction: 'PAY_NOW',
          },
        },
      };

      const ordersController = this.client.ordersController;
      const response = await ordersController.ordersCreate(request);

      return response.result;
    } catch (error) {
      console.error('Error creating PayPal order:', error);
      throw new Error(error.message || 'Failed to create PayPal order');
    }
  }

  /**
   * Capture PayPal order payment
   * @param {string} orderId - PayPal order ID
   */
  async captureOrder(orderId) {
    try {
      const request = {
        id: orderId,
      };

      const ordersController = this.client.ordersController;
      const response = await ordersController.ordersCapture(request);

      return response.result;
    } catch (error) {
      console.error('Error capturing PayPal order:', error);
      throw new Error(error.message || 'Failed to capture PayPal payment');
    }
  }

  /**
   * Get PayPal order details
   * @param {string} orderId - PayPal order ID
   */
  async getOrderDetails(orderId) {
    try {
      const request = {
        id: orderId,
      };

      const ordersController = this.client.ordersController;
      const response = await ordersController.ordersGet(request);

      return response.result;
    } catch (error) {
      console.error('Error getting PayPal order details:', error);
      throw new Error('Failed to get PayPal order details');
    }
  }

  /**
   * Refund captured payment
   * @param {string} captureId - PayPal capture ID
   * @param {number} amount - Amount to refund (optional, defaults to full refund)
   * @param {string} currency - Currency code
   */
  async refundPayment(captureId, amount = null, currency = 'USD') {
    try {
      const request = {
        captureId: captureId,
        body: {},
      };

      // If amount specified, add it to request
      if (amount !== null) {
        request.body.amount = {
          currencyCode: currency.toUpperCase(),
          value: amount.toFixed(2),
        };
      }

      const paymentsController = this.client.paymentsController;
      const response = await paymentsController.capturesRefund(request);

      return response.result;
    } catch (error) {
      console.error('Error refunding PayPal payment:', error);
      throw new Error(error.message || 'Failed to process PayPal refund');
    }
  }

  /**
   * Get capture details
   * @param {string} captureId - PayPal capture ID
   */
  async getCaptureDetails(captureId) {
    try {
      const request = {
        captureId: captureId,
      };

      const paymentsController = this.client.paymentsController;
      const response = await paymentsController.capturesGet(request);

      return response.result;
    } catch (error) {
      console.error('Error getting capture details:', error);
      throw new Error('Failed to get capture details');
    }
  }
}

// Export singleton instance for testing or create new instance
let paypalClient;

if (process.env.NODE_ENV === 'test' && typeof jest !== 'undefined') {
  // Export mock for testing
  paypalClient = {
    createOrder: jest.fn(),
    captureOrder: jest.fn(),
    getOrderDetails: jest.fn(),
    refundPayment: jest.fn(),
    getCaptureDetails: jest.fn(),
  };
} else {
  try {
    paypalClient = new PayPalClient();
  } catch (error) {
    // In development without PayPal credentials, log warning
    if (process.env.NODE_ENV !== 'production') {
      console.warn('PayPal client initialization failed:', error.message);
      console.warn('PayPal payments will not be available');
    } else {
      throw error;
    }
  }
}

module.exports = paypalClient;
