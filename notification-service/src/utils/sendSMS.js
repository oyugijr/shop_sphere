// const axios = require("axios");

// const sendSMS = async (to, message) => {
//   try {
//     const response = await axios.post("https://textbelt.com/text", {
//       phone: to,
//       message: message,
//       key: "textbelt", // Free-tier key
//     });

//     if (response.data.success) {
//       console.log("✅ SMS sent successfully to", to);
//     } else {
//       console.log("❌ SMS failed:", response.data.error);
//     }
//   } catch (error) {
//     console.error("❌ Error sending SMS:", error);
//   }
// };

// module.exports = sendSMS;

const axios = require("axios");

const sendSMS = async (userId, message) => {
  await axios.post("https://www.fast2sms.com/dev/bulk", {
    message,
    language: "english",
    route: "p",
    numbers: "1234567890",
  }, 
  { 
    headers: { Authorization: process.env.FAST2SMS_API_KEY } 
  });
};

module.exports = sendSMS;
