const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Send email verification
const sendEmailVerification = async (user, verificationToken) => {
  const transporter = createTransporter();

  const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;

  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || 'Ultimate Gym'}" <${process.env.EMAIL_FROM}>`,
    to: user.email,
    subject: 'Verify Your Email - Ultimate Gym',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #22c55e;">Welcome to Ultimate Gym!</h2>
        <p>Hi ${user.name},</p>
        <p>Thank you for registering with Ultimate Gym. Please verify your email address to complete your registration.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a>
        </div>
        <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't create an account, please ignore this email.</p>
        <br>
        <p>Best regards,<br>Ultimate Gym Team</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email verification sent to ${user.email}`);
  } catch (error) {
    console.error('Email verification error:', error);
    throw new Error('Failed to send verification email');
  }
};

// Send password reset email
const sendPasswordReset = async (user, resetToken) => {
  const transporter = createTransporter();

  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || 'Ultimate Gym'}" <${process.env.EMAIL_FROM}>`,
    to: user.email,
    subject: 'Password Reset - Ultimate Gym',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #22c55e;">Password Reset Request</h2>
        <p>Hi ${user.name},</p>
        <p>You requested a password reset for your Ultimate Gym account. Click the button below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
        </div>
        <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${resetUrl}</p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request a password reset, please ignore this email.</p>
        <br>
        <p>Best regards,<br>Ultimate Gym Team</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${user.email}`);
  } catch (error) {
    console.error('Password reset email error:', error);
    throw new Error('Failed to send password reset email');
  }
};

// Send coach approval notification
const sendCoachApproval = async (coach) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || 'Ultimate Gym'}" <${process.env.EMAIL_FROM}>`,
    to: coach.email,
    subject: 'Coach Account Approved - Ultimate Gym',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #22c55e;">Congratulations! Your Coach Account is Approved</h2>
        <p>Hi ${coach.name},</p>
        <p>Great news! Your coach account has been approved by our administrators. You can now:</p>
        <ul>
          <li>Create and manage workout plans</li>
          <li>Assign plans to clients</li>
          <li>Upload exercises and content</li>
          <li>Chat with your clients</li>
          <li>Track client progress</li>
        </ul>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.CLIENT_URL}/coach/dashboard" style="background-color: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Go to Dashboard</a>
        </div>
        <p>Welcome to the Ultimate Gym coaching team!</p>
        <br>
        <p>Best regards,<br>Ultimate Gym Team</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Coach approval email sent to ${coach.email}`);
  } catch (error) {
    console.error('Coach approval email error:', error);
    throw new Error('Failed to send coach approval email');
  }
};

// Send coach rejection notification
const sendCoachRejection = async (coach, reason) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || 'Ultimate Gym'}" <${process.env.EMAIL_FROM}>`,
    to: coach.email,
    subject: 'Coach Application Update - Ultimate Gym',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">Coach Application Update</h2>
        <p>Hi ${coach.name},</p>
        <p>Thank you for your interest in becoming a coach with Ultimate Gym. After reviewing your application, we regret to inform you that it has not been approved at this time.</p>
        ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
        <p>You can still use Ultimate Gym as a client and access all our workout plans and courses.</p>
        <p>If you have any questions or would like to reapply in the future, please contact our support team.</p>
        <br>
        <p>Best regards,<br>Ultimate Gym Team</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Coach rejection email sent to ${coach.email}`);
  } catch (error) {
    console.error('Coach rejection email error:', error);
    throw new Error('Failed to send coach rejection email');
  }
};

// Send welcome email to new users
const sendWelcomeEmail = async (user) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || 'Ultimate Gym'}" <${process.env.EMAIL_FROM}>`,
    to: user.email,
    subject: 'Welcome to Ultimate Gym!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #22c55e;">Welcome to Ultimate Gym, ${user.name}!</h2>
        <p>Thank you for joining Ultimate Gym. We're excited to help you achieve your fitness goals!</p>
        <p>Here's what you can do to get started:</p>
        <ul>
          <li>Complete your profile with your fitness goals and measurements</li>
          <li>Browse our exercise library and workout plans</li>
          <li>Enroll in courses taught by certified coaches</li>
          <li>Track your progress and get personalized recommendations</li>
        </ul>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.CLIENT_URL}/dashboard" style="background-color: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Get Started</a>
        </div>
        <p>If you have any questions, feel free to contact our support team.</p>
        <br>
        <p>Best regards,<br>Ultimate Gym Team</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Welcome email sent to ${user.email}`);
  } catch (error) {
    console.error('Welcome email error:', error);
    throw new Error('Failed to send welcome email');
  }
};

// Send course enrollment confirmation
const sendCourseEnrollmentConfirmation = async (user, course) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || 'Ultimate Gym'}" <${process.env.EMAIL_FROM}>`,
    to: user.email,
    subject: `Welcome to ${course.title} - Ultimate Gym`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #22c55e;">Course Enrollment Confirmed!</h2>
        <p>Hi ${user.name},</p>
        <p>Congratulations! You've successfully enrolled in <strong>${course.title}</strong>.</p>
        <p><strong>Course Details:</strong></p>
        <ul>
          <li><strong>Instructor:</strong> ${course.instructor.name}</li>
          <li><strong>Duration:</strong> ${course.duration} weeks</li>
          <li><strong>Sessions per week:</strong> ${course.sessionsPerWeek}</li>
        </ul>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.CLIENT_URL}/courses/${course._id}" style="background-color: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Start Course</a>
        </div>
        <p>You can access your course from your dashboard anytime.</p>
        <br>
        <p>Best regards,<br>Ultimate Gym Team</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Course enrollment email sent to ${user.email}`);
  } catch (error) {
    console.error('Course enrollment email error:', error);
    throw new Error('Failed to send course enrollment email');
  }
};

module.exports = {
  sendEmailVerification,
  sendPasswordReset,
  sendCoachApproval,
  sendCoachRejection,
  sendWelcomeEmail,
  sendCourseEnrollmentConfirmation
};