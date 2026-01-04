const notificationService = require("../services/notificationService");
const { getEmailTemplate } = require("../templates/emailTemplates");

/**
 * Send a templated notification (email)
 * Request body should include:
 * - templateType: one of ['welcome', 'orderConfirmation', 'orderShipped', 'passwordReset', 'paymentConfirmation', 'generic']
 * - contact: recipient email
 * - data: template data (varies by template type)
 */
const sendTemplatedNotification = async (req, res) => {
  try {
    const { templateType, contact, data = {} } = req.body;
    
    if (!templateType) {
      return res.status(400).json({ error: "templateType is required" });
    }
    
    if (!contact) {
      return res.status(400).json({ error: "contact (email) is required" });
    }
    
    // Generate email from template
    const { subject, html } = getEmailTemplate(templateType, data);
    
    // Send notification
    const notification = await notificationService.sendNotification(
      req.user.id, 
      'email', 
      contact, 
      html
    );
    
    res.status(201).json({
      success: true,
      message: "Templated notification queued successfully",
      notification,
      templateType,
      subject
    });
  } catch (error) {
    console.error("[Controller] Error sending templated notification:", error);
    res.status(500).json({ 
      error: "Failed to send templated notification", 
      details: error.message 
    });
  }
};

/**
 * Send a welcome email
 */
const sendWelcomeEmail = async (req, res) => {
  try {
    const { email, name, shopUrl } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: "email is required" });
    }
    
    const { subject, html } = getEmailTemplate('welcome', { name, shopUrl });
    
    const notification = await notificationService.sendNotification(
      req.user.id, 
      'email', 
      email, 
      html
    );
    
    res.status(201).json({
      success: true,
      message: "Welcome email queued successfully",
      notification
    });
  } catch (error) {
    console.error("[Controller] Error sending welcome email:", error);
    res.status(500).json({ 
      error: "Failed to send welcome email", 
      details: error.message 
    });
  }
};

/**
 * Send an order confirmation email
 */
const sendOrderConfirmation = async (req, res) => {
  try {
    const { email, orderId, orderDate, total } = req.body;
    
    if (!email || !orderId) {
      return res.status(400).json({ error: "email and orderId are required" });
    }
    
    const { subject, html } = getEmailTemplate('orderConfirmation', { 
      orderId, 
      orderDate, 
      total 
    });
    
    const notification = await notificationService.sendNotification(
      req.user.id, 
      'email', 
      email, 
      html
    );
    
    res.status(201).json({
      success: true,
      message: "Order confirmation email queued successfully",
      notification
    });
  } catch (error) {
    console.error("[Controller] Error sending order confirmation:", error);
    res.status(500).json({ 
      error: "Failed to send order confirmation", 
      details: error.message 
    });
  }
};

/**
 * Send a shipping notification email
 */
const sendShippingNotification = async (req, res) => {
  try {
    const { email, orderId, trackingNumber, carrier, trackingUrl, expectedDelivery } = req.body;
    
    if (!email || !orderId) {
      return res.status(400).json({ error: "email and orderId are required" });
    }
    
    const { subject, html } = getEmailTemplate('orderShipped', { 
      orderId,
      trackingNumber,
      carrier,
      trackingUrl,
      expectedDelivery
    });
    
    const notification = await notificationService.sendNotification(
      req.user.id, 
      'email', 
      email, 
      html
    );
    
    res.status(201).json({
      success: true,
      message: "Shipping notification queued successfully",
      notification
    });
  } catch (error) {
    console.error("[Controller] Error sending shipping notification:", error);
    res.status(500).json({ 
      error: "Failed to send shipping notification", 
      details: error.message 
    });
  }
};

/**
 * Send a payment confirmation email
 */
const sendPaymentConfirmation = async (req, res) => {
  try {
    const { email, orderId, amount, paymentMethod, transactionId, paymentDate } = req.body;
    
    if (!email || !orderId || !amount) {
      return res.status(400).json({ error: "email, orderId, and amount are required" });
    }
    
    const { subject, html } = getEmailTemplate('paymentConfirmation', { 
      orderId,
      amount,
      paymentMethod,
      transactionId,
      paymentDate
    });
    
    const notification = await notificationService.sendNotification(
      req.user.id, 
      'email', 
      email, 
      html
    );
    
    res.status(201).json({
      success: true,
      message: "Payment confirmation queued successfully",
      notification
    });
  } catch (error) {
    console.error("[Controller] Error sending payment confirmation:", error);
    res.status(500).json({ 
      error: "Failed to send payment confirmation", 
      details: error.message 
    });
  }
};

module.exports = {
  sendTemplatedNotification,
  sendWelcomeEmail,
  sendOrderConfirmation,
  sendShippingNotification,
  sendPaymentConfirmation
};
