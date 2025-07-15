require('dotenv').config();
const nodemailer = require("nodemailer");

// Test email configuration
async function testEmail() {
  console.log("Testing email configuration...");
  
  // Show environment variables (without password)
  console.log("Email config:");
  console.log("SMTP_HOST:", process.env.SMTP_HOST);
  console.log("SMTP_PORT:", process.env.SMTP_PORT);
  console.log("SMTP_USER:", process.env.SMTP_USER);
  console.log("SMTP_FROM:", process.env.SMTP_FROM);
  console.log("SMTP_SECURE:", process.env.SMTP_SECURE);
  console.log("Password set:", !!process.env.SMTP_PASS);
  console.log("");

  // Configure email transport
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  try {
    // Test connection
    console.log("Testing SMTP connection...");
    await transporter.verify();
    console.log("✅ SMTP connection successful!");

    // Send test email
    console.log("Sending test email...");
    const info = await transporter.sendMail({
      from: `"🐔 C&P Poultry Test" <${process.env.SMTP_FROM}>`,
      to: process.env.SMTP_USER, // Send to yourself
      subject: "🧪 Email Test - " + new Date().toLocaleString(),
      html: `
        <h1>Email Test Successful! 🎉</h1>
        <p>This is a test email from your C&P Poultry Marketplace.</p>
        <p>Time: ${new Date().toLocaleString()}</p>
        <p>If you received this, your email configuration is working correctly!</p>
      `,
    });

    console.log("✅ Test email sent successfully!");
    console.log("Message ID:", info.messageId);
    
  } catch (error) {
    console.error("❌ Email test failed:", error);
    
    if (error.code === 'EAUTH') {
      console.error("Authentication failed. Please check:");
      console.error("1. Gmail app password is correct (no spaces)");
      console.error("2. 2-factor authentication is enabled");
      console.error("3. App password was generated correctly");
    }
  }
}

testEmail();
