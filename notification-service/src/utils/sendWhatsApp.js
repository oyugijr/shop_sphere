// const axios = require("axios");

// const sendWhatsAppMessage = async (to, message) => {
//   const apiUrl = `https://api.callmebot.com/whatsapp.php?phone=${to}&text=${encodeURIComponent(message)}&apikey=your_api_key`;

//   try {
//     const response = await axios.get(apiUrl);
//     console.log("✅ WhatsApp message sent to", to);
//   } catch (error) {
//     console.error("❌ Error sending WhatsApp message:", error);
//   }
// };

// module.exports = sendWhatsAppMessage;


const twilio = require("twilio");
const client = new twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

const sendWhatsApp = async (userId, message) => {
  await client.messages.create({
    body: message,
    from: "whatsapp:" + process.env.TWILIO_WHATSAPP_NUMBER,
    to: "whatsapp:+1234567890",
  });
};

module.exports = sendWhatsApp;
