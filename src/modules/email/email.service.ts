import nodemailer from 'nodemailer';
import { Message } from './email.interface';

export const transport = nodemailer.createTransport(config.email.smtp);
/* istanbul ignore next */
if (config.env !== 'test') {
  transport
    .verify()
    .then(() => logger.info('Connected to email server'))
    .catch((e) => {
      logger.warn(
        'Unable to connect to email server. Make sure you have configured the SMTP options in .env'
      );
      logger.error(e);
    });
}

export const sendEmail = async (
  to: string,
  subject: string,
  text: string,
  html: string
): Promise<void> => {
  const msg: Message = {
    from: config.email.from,
    to,
    subject,
    text,
    html,
  };
  const response = await transport.sendMail(msg);
  console.log('Email sent:', response);
};


export const sendResetPasswordEmail = async (
  to: string,
  token: string
): Promise<void> => {
  const subject = 'Reset password';
  // replace this url with the link to the reset password page of your front-end app
  const resetPasswordUrl = `${config.clientUrl}/reset-password?token=${token}`;
  const text = `Hi,
  To reset your password, click on this link: ${resetPasswordUrl}
  If you did not request any password resets, then ignore this email.`;
  const html = `<div style="margin:30px; padding:30px; border:1px solid black; border-radius: 20px 10px;"><h4><strong>Dear user,</strong></h4>
  <p>To reset your password, click on this link: <a href="${resetPasswordUrl}" target="_blank" rel="noopener noreferrer">Reset your password</a></p>
  <p>If you did not request any password resets, please ignore this email.</p>
  <p>Thanks,</p>
  <p><strong>Team</strong></p></div>`;
  await sendEmail(to, subject, text, html);
};


export const sendVerificationEmail = async (
  to: string,
  token: string,
  name: string
): Promise<void> => {
  const subject = 'Email Verification';
  // replace this url with the link to the email verification page of your front-end app
  const verificationEmailUrl = `${config.clientUrl}/verify-email?token=${token}`;
  const text = `Hi ${name},
  To verify your email, click on this link: ${verificationEmailUrl}
  If you did not create an account, then ignore this email.`;
  const html = `<div style="margin:30px; padding:30px; border:1px solid black; border-radius: 20px 10px;"><h4><strong>Hi ${name},</strong></h4>
  <p>To verify your email, click on this link: <a href="${verificationEmailUrl}" target="_blank" rel="noopener noreferrer">Verify your email</a></p>
  <p>If you did not create an account, then ignore this email.</p></div>`;
  await sendEmail(to, subject, text, html);
};

export const sendSuccessfulRegistration = async (
  to: string,
  token: string,
  name: string
): Promise<void> => {
  const subject = 'Email Verification';
  // replace this url with the link to the email verification page of your front-end app
  const verificationEmailUrl = `${config.clientUrl}/verify-email?token=${token}`;
  const text = `Hi ${name},
  Congratulations! Your account has been created.
  You are almost there. Complete the final step by verifying your email at: ${verificationEmailUrl}
  Don't hesitate to contact us if you face any problems
  Regards,
  Team`;
  const html = `<div style="margin:30px; padding:30px; border:1px solid black; border-radius: 20px 10px;"><h4><strong>Hi ${name},</strong></h4>
  <p>Congratulations! Your account has been created.</p>
  <p>You are almost there. Complete the final step by verifying your email at: <a href="${verificationEmailUrl}" target="_blank" rel="noopener noreferrer">Verify your email</a></p>
  <p>Don't hesitate to contact us if you face any problems</p>
  <p>Regards,</p>
  <p><strong>Team</strong></p></div>`;
  await sendEmail(to, subject, text, html);
};


export const sendAccountCreated = async (
  to: string,
  name: string
): Promise<void> => {
  const subject = 'Account Created Successfully';
  // replace this url with the link to the email verification page of your front-end app
  const loginUrl = `${config.clientUrl}/auth/login`;
  const text = `Hi ${name},
  Congratulations! Your account has been created successfully.
  You can now login at: ${loginUrl}
  Don't hesitate to contact us if you face any problems
  Regards,
  Team`;
  const html = `<div style="margin:30px; padding:30px; border:1px solid black; border-radius: 20px 10px;"><h4><strong>Hi ${name},</strong></h4>
  <p>Congratulations! Your account has been created successfully.</p>
  <p>You can now login at: <a href="${loginUrl}" target="_blank" rel="noopener noreferrer">Log in</a></p>
  <p>Don't hesitate to contact us if you face any problems</p>
  <p>Regards,</p>
  <p><strong>Team</strong></p></div>`;
  await sendEmail(to, subject, text, html);
};


export const sendMeetingInvitation = async (
  to: string,
  memberName: string,
  meetingDetails: {
    name: string;
    type: string;
    date: string;
    startTime: string;
    endTime: string;
    meetingLink?: string;
    timezone: string;
    createdByName: string;
    fileUrl?: string;
    fileType?: string;
  }
): Promise<void> => {
  const subject = `Meeting Invitation: ${meetingDetails.name}`;
  const fileSection = meetingDetails.fileUrl
    ? `<p><strong>File:</strong> <a href="${meetingDetails.fileUrl}" style="color: #007bff;">${meetingDetails.fileUrl}</a></p>`
    : '<p><strong>File:</strong> Will be shared soon</p>';
  const meetingLinkSection = meetingDetails.meetingLink
    ? `<p><strong>Meeting Link:</strong> <a href="${meetingDetails.meetingLink}" style="color: #007bff;">${meetingDetails.meetingLink}</a></p>`
    : '<p><strong>Meeting Link:</strong> Will be shared soon</p>';

  const text = `Hi ${memberName},

You have been invited to a meeting.

Meeting Details:
- Name: ${meetingDetails.name}
- Type: ${meetingDetails.type}
- Date: ${meetingDetails.date}
- Time: ${meetingDetails.startTime} - ${meetingDetails.endTime} (${
    meetingDetails.timezone
  })
- Meeting Link: ${meetingDetails.meetingLink || 'Will be shared soon'}
- Organized by: ${meetingDetails.createdByName}

Please make sure to join the meeting on time.

Regards,
Team`;
  const html = `<div style="margin:30px; padding:30px; border:1px solid #e0e0e0; border-radius: 10px; font-family: Arial, sans-serif;">
  <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">Meeting Invitation</h2>
  <h4><strong>Hi ${memberName},</strong></h4>
  <p>You have been invited to a meeting.</p>

  <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
    <h3 style="color: #007bff; margin-top: 0;">Meeting Details</h3>
    <p><strong>Meeting Name:</strong> ${meetingDetails.name}</p>
    <p><strong>Type:</strong> ${meetingDetails.type}</p>
    <p><strong>Date:</strong> ${meetingDetails.date}</p>
    <p><strong>Time:</strong> ${meetingDetails.startTime} - ${meetingDetails.endTime}</p>
    <p><strong>Timezone:</strong> ${meetingDetails.timezone}</p>
    ${meetingLinkSection}
    <p><strong>Organized by:</strong> ${meetingDetails.createdByName}</p>
    ${fileSection}
  </div>
  <p style="color: #666;">Please make sure to join the meeting on time.</p>
  <p style="margin-top: 30px;">Regards,</p>
  <p><strong>Team</strong></p>

</div>`;

  await sendEmail(to, subject, text, html);
};
