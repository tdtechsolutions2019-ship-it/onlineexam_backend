const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "yuktitdtech203@gmail.com" || process.env.EMAIL,
    pass: "bxqjycuqcxfzvgjd" || process.env.PASSWORD,
  },
});

async function sendLoginEmail(email, password) {
  const mailOptions = {
    from: "yuktitdtech203@gmail.com" || process.env.EMAIL,
    to: email,
    subject: "Center Login Credentials",
    html: `
      <h3>Your Center Account Created</h3>
      <p><b>Email:</b> ${email}</p>
      <p><b>Password:</b> ${password}</p>
      <p>Please login and change your password.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
}
async function sendStudentExamEmail(email, username, password) {
  const mailOptions = {
    from: "yuktitdtech203@gmail.com" || process.env.EMAIL,
    to: email,
    subject: "Center Login Credentials",
    html: `
      <h3>Your Center Account Created</h3>
      <p><b>Username:</b> ${username}</p>
      <p><b>Password:</b> ${password}</p>
      <p>Please Provide this credentials to student.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
}
module.exports = { sendLoginEmail, sendStudentExamEmail };
