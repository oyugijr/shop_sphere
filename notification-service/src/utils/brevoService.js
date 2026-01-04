const brevoClient = require("../config/brevoConfig");

// Send an email notification
const sendEmail = async (email, subject, message) => {
  try {
    const emailFrom = process.env.EMAIL_FROM || "noreply@shopsphere.com";
    const emailFromName = process.env.EMAIL_FROM_NAME || "ShopSphere";
    
    const response = await brevoClient.post("/smtp/email", {
      sender: { name: emailFromName, email: emailFrom },
      to: [{ email }],
      subject,
      htmlContent: `<p>${message}</p>`,
    });
    
    console.log(`[Email] ✓ Email sent to ${email} - Message ID: ${response.data.messageId || 'N/A'}`);
    return response.data;
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message;
    console.error(`[Email] ✗ Failed to send email to ${email}:`, errorMsg);
    throw new Error(`Email delivery failed: ${errorMsg}`);
  }
};

// Send an SMS notification
const sendSMS = async (phone, message) => {
  try {
    const response = await brevoClient.post("/transactionalSMS/sms", {
      sender: "ShopSphere",
      recipient: phone,
      content: message,
    });
    
    console.log(`[SMS] ✓ SMS sent to ${phone} - Message ID: ${response.data.reference || 'N/A'}`);
    return response.data;
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message;
    console.error(`[SMS] ✗ Failed to send SMS to ${phone}:`, errorMsg);
    throw new Error(`SMS delivery failed: ${errorMsg}`);
  }
};

// Send a WhatsApp notification
const sendWhatsApp = async (phone, message) => {
  try {
    const response = await brevoClient.post("/transactionalWhatsApp/messages", {
      sender: "ShopSphere",
      recipient: phone,
      content: message,
    });
    
    console.log(`[WhatsApp] ✓ WhatsApp message sent to ${phone} - Message ID: ${response.data.messageId || 'N/A'}`);
    return response.data;
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message;
    console.error(`[WhatsApp] ✗ Failed to send WhatsApp to ${phone}:`, errorMsg);
    throw new Error(`WhatsApp delivery failed: ${errorMsg}`);
  }
};

module.exports = { sendEmail, sendSMS, sendWhatsApp };
