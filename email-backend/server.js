const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors()); // Allow requests from any origin for now
app.use(express.json());

// Nodemailer Transporter
// We use environment variables to keep your credentials secure
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_EMAIL,
    pass: process.env.GMAIL_APP_PASSWORD, // Use the App Password here
  },
});

// --- Email Sending Logic ---
const sendEmail = async (res, mailOptions) => {
  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${mailOptions.to}`);
    return res.status(200).json({ success: true, message: 'Email sent successfully!' });
  } catch (error) {
    console.error('Error sending email:', error);
    // Provide a more specific error message
    return res.status(500).json({ success: false, message: 'Failed to send email.', error: error.message });
  }
};

// --- API Endpoint ---
// A single, flexible endpoint to handle all email types
app.post('/send-email', (req, res) => {
  const { type, data } = req.body;

  if (!type || !data) {
    return res.status(400).json({ success: false, message: 'Missing type or data for email request.' });
  }

  let mailOptions;

  // Determine the email content based on the 'type'
  switch (type) {
    case 'passwordReset':
      mailOptions = {
        from: `AMS:AMACC <${process.env.GMAIL_EMAIL}>`,
        to: data.email,
        subject: '🔐 PASSWORD RETRIEVAL - AMS',
        html: `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #6D1B0A;">Account Security Protocol</h2>
            <p>Hello <b>${data.name}</b>,</p>
            <p>You requested to retrieve your password for the AMS Student Portal.</p>
            <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; font-size: 18px; text-align: center; border: 1px dashed #6D1B0A;">
              Your Access Key is: <br/>
              <span style="font-family: monospace; font-weight: bold; font-size: 24px; color: #D1432A;">${data.password}</span>
            </div>
            <p style="font-size: 12px; color: #888; margin-top: 20px;">If you did not request this, please secure your account immediately.</p>
          </div>
        `,
      };
      break;

    case 'classworkNotification':
      mailOptions = {
        from: `AMS:AMACC <${process.env.GMAIL_EMAIL}>`,
        to: data.studentEmails,
        subject: `📚 NEW TASK: ${data.classwork.title} - ${data.subjectName}`,
        html: `
          <div style="font-family: sans-serif; padding: 20px;">
            <h3 style="color: #6D1B0A;">${data.subjectName} - New Assessment</h3>
            <p>A new classwork has been posted: <b>${data.classwork.title}</b></p>
            <p><b>Deadline:</b> ${new Date(data.classwork.dueDate).toLocaleString()}</p>
            <hr/>
            <p>${data.classwork.description || 'Check the portal for instructions.'}</p>
          </div>
        `,
      };
      break;

    case 'submissionNotification':
      mailOptions = {
        from: `AMS:AMACC <${process.env.GMAIL_EMAIL}>`,
        to: data.teacherEmail,
        subject: `✅ NEW SUBMISSION: ${data.studentName} - ${data.subjectName}`,
        html: `
          <div style="font-family: sans-serif; padding: 20px;">
            <h3 style="color: #6D1B0A;">Submission Alert</h3>
            <p>Student <b>${data.studentName}</b> has submitted their work for <b>${data.taskTitle}</b> in <b>${data.subjectName}</b>.</p>
            <p>Please log in to the Grading Console to evaluate the submission.</p>
          </div>
        `,
      };
      break;

    case 'enrollmentAlert':
       mailOptions = {
        from: `AMS:AMACC <${process.env.GMAIL_EMAIL}>`,
        to: data.teacherEmail,
        subject: `👤 NEW ENROLLMENT REQUEST: ${data.studentName}`,
        html: `
          <div style="font-family: sans-serif; padding: 20px;">
            <h3 style="color: #6D1B0A;">Enrollment Protocol</h3>
            <p><b>${data.studentName}</b> is requesting to join your subject: <b>${data.subjectName}</b>.</p>
            <p>Please check your Pending Enrollments to approve or decline the request.</p>
          </div>
        `,
      };
      break;

    default:
      return res.status(400).json({ success: false, message: `Unknown email type: ${type}` });
  }

  sendEmail(res, mailOptions);
});

// Start Server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Email server is running on port ${PORT}`);
});
