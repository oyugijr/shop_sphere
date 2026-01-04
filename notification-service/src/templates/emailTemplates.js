/**
 * Email Templates for ShopSphere Notifications
 * Production-ready HTML email templates
 */

const getEmailTemplate = (type, data) => {
  const templates = {
    welcome: {
      subject: 'Welcome to ShopSphere!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9f9f9; padding: 20px; }
            .footer { background-color: #333; color: white; padding: 10px; text-align: center; font-size: 12px; }
            .button { display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to ShopSphere!</h1>
            </div>
            <div class="content">
              <h2>Hello ${data.name || 'Customer'}!</h2>
              <p>Thank you for joining ShopSphere. We're excited to have you on board.</p>
              <p>Start exploring our amazing products and enjoy shopping with us.</p>
              <p><a href="${data.shopUrl || 'https://shopsphere.com'}" class="button">Start Shopping</a></p>
            </div>
            <div class="footer">
              <p>&copy; 2024 ShopSphere. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    },
    
    orderConfirmation: {
      subject: 'Order Confirmation - Order #${orderId}',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9f9f9; padding: 20px; }
            .order-details { background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
            .footer { background-color: #333; color: white; padding: 10px; text-align: center; font-size: 12px; }
            .total { font-size: 18px; font-weight: bold; color: #2196F3; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Order Confirmed!</h1>
            </div>
            <div class="content">
              <h2>Thank you for your order!</h2>
              <p>We've received your order and will process it shortly.</p>
              <div class="order-details">
                <p><strong>Order ID:</strong> ${data.orderId || 'N/A'}</p>
                <p><strong>Order Date:</strong> ${data.orderDate || new Date().toLocaleDateString()}</p>
                <p><strong>Total:</strong> <span class="total">$${data.total || '0.00'}</span></p>
              </div>
              <p>You will receive another email when your order ships.</p>
            </div>
            <div class="footer">
              <p>&copy; 2024 ShopSphere. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    },
    
    orderShipped: {
      subject: 'Your Order Has Shipped - Order #${orderId}',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #FF9800; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9f9f9; padding: 20px; }
            .tracking { background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; text-align: center; }
            .footer { background-color: #333; color: white; padding: 10px; text-align: center; font-size: 12px; }
            .button { display: inline-block; padding: 10px 20px; background-color: #FF9800; color: white; text-decoration: none; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Your Order Has Shipped!</h1>
            </div>
            <div class="content">
              <h2>Great news!</h2>
              <p>Your order #${data.orderId || 'N/A'} is on its way.</p>
              <div class="tracking">
                <p><strong>Tracking Number:</strong> ${data.trackingNumber || 'N/A'}</p>
                <p><strong>Carrier:</strong> ${data.carrier || 'N/A'}</p>
                <p><a href="${data.trackingUrl || '#'}" class="button">Track Your Package</a></p>
              </div>
              <p>Expected delivery: ${data.expectedDelivery || 'TBD'}</p>
            </div>
            <div class="footer">
              <p>&copy; 2024 ShopSphere. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    },
    
    passwordReset: {
      subject: 'Password Reset Request',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #f44336; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9f9f9; padding: 20px; }
            .footer { background-color: #333; color: white; padding: 10px; text-align: center; font-size: 12px; }
            .button { display: inline-block; padding: 10px 20px; background-color: #f44336; color: white; text-decoration: none; border-radius: 5px; }
            .warning { background-color: #fff3cd; padding: 10px; border-left: 4px solid #ffc107; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <h2>Hello ${data.name || 'User'}!</h2>
              <p>We received a request to reset your password. Click the button below to proceed:</p>
              <p style="text-align: center;"><a href="${data.resetUrl || '#'}" class="button">Reset Password</a></p>
              <div class="warning">
                <p><strong>⚠️ Security Notice:</strong></p>
                <p>This link will expire in ${data.expiryMinutes || '15'} minutes.</p>
                <p>If you didn't request this, please ignore this email.</p>
              </div>
            </div>
            <div class="footer">
              <p>&copy; 2024 ShopSphere. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    },
    
    paymentConfirmation: {
      subject: 'Payment Confirmed - Order #${orderId}',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9f9f9; padding: 20px; }
            .payment-details { background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
            .footer { background-color: #333; color: white; padding: 10px; text-align: center; font-size: 12px; }
            .amount { font-size: 24px; font-weight: bold; color: #4CAF50; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✓ Payment Confirmed</h1>
            </div>
            <div class="content">
              <h2>Payment Successful!</h2>
              <p>We've successfully received your payment.</p>
              <div class="payment-details">
                <p><strong>Order ID:</strong> ${data.orderId || 'N/A'}</p>
                <p><strong>Amount Paid:</strong> <span class="amount">$${data.amount || '0.00'}</span></p>
                <p><strong>Payment Method:</strong> ${data.paymentMethod || 'N/A'}</p>
                <p><strong>Transaction ID:</strong> ${data.transactionId || 'N/A'}</p>
                <p><strong>Date:</strong> ${data.paymentDate || new Date().toLocaleDateString()}</p>
              </div>
              <p>Thank you for your purchase!</p>
            </div>
            <div class="footer">
              <p>&copy; 2024 ShopSphere. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    },
    
    generic: {
      subject: '${subject}',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9f9f9; padding: 20px; }
            .footer { background-color: #333; color: white; padding: 10px; text-align: center; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${data.title || 'ShopSphere Notification'}</h1>
            </div>
            <div class="content">
              ${data.message || '<p>You have a new notification from ShopSphere.</p>'}
            </div>
            <div class="footer">
              <p>&copy; 2024 ShopSphere. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    },
  };

  const template = templates[type] || templates.generic;
  
  // Simple variable replacement
  let subject = template.subject;
  let html = template.html;
  
  // Replace variables in subject and html
  Object.keys(data).forEach(key => {
    const regex = new RegExp(`\\$\\{${key}\\}`, 'g');
    subject = subject.replace(regex, data[key]);
    html = html.replace(regex, data[key]);
  });

  return { subject, html };
};

module.exports = { getEmailTemplate };
