const axios = require('axios');

class MpesaClient {
  constructor() {
    this.consumerKey = process.env.MPESA_CONSUMER_KEY;
    this.consumerSecret = process.env.MPESA_CONSUMER_SECRET;
    this.shortcode = process.env.MPESA_SHORTCODE;
    this.passkey = process.env.MPESA_PASSKEY;
    this.callbackUrl = process.env.MPESA_CALLBACK_URL;
    this.environment = process.env.MPESA_ENVIRONMENT || 'sandbox';
    
    // Set base URL based on environment
    this.baseUrl = this.environment === 'production'
      ? 'https://api.safaricom.co.ke'
      : 'https://sandbox.safaricom.co.ke';

    // Validate required configuration
    if (process.env.NODE_ENV !== 'test') {
      if (!this.consumerKey || !this.consumerSecret) {
        throw new Error('M-Pesa credentials (MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET) are required');
      }
      if (!this.shortcode || !this.passkey) {
        throw new Error('M-Pesa configuration (MPESA_SHORTCODE, MPESA_PASSKEY) is required');
      }
    }

    this.accessToken = null;
    this.tokenExpiry = null;
  }

  /**
   * Generate password for M-Pesa STK Push
   */
  generatePassword(timestamp) {
    const passwordString = `${this.shortcode}${this.passkey}${timestamp}`;
    return Buffer.from(passwordString).toString('base64');
  }

  /**
   * Get OAuth access token from M-Pesa
   */
  async getAccessToken() {
    // Return cached token if still valid
    if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const auth = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');
      
      const response = await axios.get(
        `${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
        {
          headers: {
            Authorization: `Basic ${auth}`,
          },
        }
      );

      this.accessToken = response.data.access_token;
      // Token expires in 3599 seconds, cache for 3500 seconds to be safe
      this.tokenExpiry = new Date(Date.now() + 3500 * 1000);

      return this.accessToken;
    } catch (error) {
      console.error('Error getting M-Pesa access token:', error.response?.data || error.message);
      throw new Error('Failed to authenticate with M-Pesa API');
    }
  }

  /**
   * Initiate STK Push (Lipa Na M-Pesa Online)
   * @param {string} phoneNumber - Customer phone number (format: 254XXXXXXXXX)
   * @param {number} amount - Amount to charge
   * @param {string} accountReference - Account reference (order ID)
   * @param {string} transactionDesc - Transaction description
   */
  async stkPush(phoneNumber, amount, accountReference, transactionDesc = 'Payment') {
    try {
      const accessToken = await this.getAccessToken();
      const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
      const password = this.generatePassword(timestamp);

      const requestBody = {
        BusinessShortCode: this.shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: Math.round(amount),
        PartyA: phoneNumber,
        PartyB: this.shortcode,
        PhoneNumber: phoneNumber,
        CallBackURL: this.callbackUrl,
        AccountReference: accountReference,
        TransactionDesc: transactionDesc,
      };

      const response = await axios.post(
        `${this.baseUrl}/mpesa/stkpush/v1/processrequest`,
        requestBody,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error initiating M-Pesa STK Push:', error.response?.data || error.message);
      throw new Error(error.response?.data?.errorMessage || 'Failed to initiate M-Pesa payment');
    }
  }

  /**
   * Query STK Push transaction status
   * @param {string} checkoutRequestId - CheckoutRequestID from STK Push response
   */
  async stkPushQuery(checkoutRequestId) {
    try {
      const accessToken = await this.getAccessToken();
      const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
      const password = this.generatePassword(timestamp);

      const requestBody = {
        BusinessShortCode: this.shortcode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestId,
      };

      const response = await axios.post(
        `${this.baseUrl}/mpesa/stkpushquery/v1/query`,
        requestBody,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error querying M-Pesa transaction:', error.response?.data || error.message);
      throw new Error('Failed to query M-Pesa transaction status');
    }
  }

  /**
   * Register callback URLs (C2B)
   * This should be done once during setup
   */
  async registerUrls(validationUrl, confirmationUrl) {
    try {
      const accessToken = await this.getAccessToken();

      const requestBody = {
        ShortCode: this.shortcode,
        ResponseType: 'Completed',
        ConfirmationURL: confirmationUrl,
        ValidationURL: validationUrl,
      };

      const response = await axios.post(
        `${this.baseUrl}/mpesa/c2b/v1/registerurl`,
        requestBody,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error registering M-Pesa URLs:', error.response?.data || error.message);
      throw new Error('Failed to register callback URLs');
    }
  }

  /**
   * B2C Payment Request (for refunds)
   * @param {string} phoneNumber - Customer phone number
   * @param {number} amount - Amount to refund
   * @param {string} remarks - Transaction remarks
   */
  async b2cPayment(phoneNumber, amount, remarks = 'Refund') {
    try {
      const accessToken = await this.getAccessToken();
      const initiatorPassword = process.env.MPESA_INITIATOR_PASSWORD;
      const securityCredential = process.env.MPESA_SECURITY_CREDENTIAL;

      if (!securityCredential) {
        throw new Error('MPESA_SECURITY_CREDENTIAL is required for B2C transactions');
      }

      const requestBody = {
        InitiatorName: process.env.MPESA_INITIATOR_NAME || 'testapi',
        SecurityCredential: securityCredential,
        CommandID: 'BusinessPayment',
        Amount: Math.round(amount),
        PartyA: this.shortcode,
        PartyB: phoneNumber,
        Remarks: remarks,
        QueueTimeOutURL: `${this.callbackUrl}/timeout`,
        ResultURL: `${this.callbackUrl}/result`,
        Occasion: 'Refund',
      };

      const response = await axios.post(
        `${this.baseUrl}/mpesa/b2c/v1/paymentrequest`,
        requestBody,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error initiating B2C payment:', error.response?.data || error.message);
      throw new Error('Failed to process M-Pesa refund');
    }
  }
}

// Export singleton instance for testing or create new instance
let mpesaClient;

if (process.env.NODE_ENV === 'test' && typeof jest !== 'undefined') {
  // Export mock for testing
  mpesaClient = {
    stkPush: jest.fn(),
    stkPushQuery: jest.fn(),
    b2cPayment: jest.fn(),
    getAccessToken: jest.fn(),
    registerUrls: jest.fn(),
  };
} else {
  try {
    mpesaClient = new MpesaClient();
  } catch (error) {
    // In development without M-Pesa credentials, log warning
    if (process.env.NODE_ENV !== 'production') {
      console.warn('M-Pesa client initialization failed:', error.message);
      console.warn('M-Pesa payments will not be available');
    } else {
      throw error;
    }
  }
}

module.exports = mpesaClient;
