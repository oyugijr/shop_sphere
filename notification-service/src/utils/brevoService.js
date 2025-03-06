const brevoClient = require("../config/brevoConfig");

// Send an email notification
const sendEmail = async (email, subject, message) => {
  try {
    const response = await brevoClient.post("/smtp/email", {
      sender: { name: "ShopSphere", email: "noreply@shopsphere.com" },
      to: [{ email }],
      subject,
      htmlContent: `<p>${message}</p>`,
    });
    return response.data;
  } catch (error) {
    console.error("Error sending email:", error.response?.data || error.message);
    throw error;
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
    return response.data;
  } catch (error) {
    console.error("Error sending SMS:", error.response?.data || error.message);
    throw error;
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
    return response.data;
  } catch (error) {
    console.error("Error sending WhatsApp:", error.response?.data || error.message);
    throw error;
  }
};

module.exports = { sendEmail, sendSMS, sendWhatsApp };
