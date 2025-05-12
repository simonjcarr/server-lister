import nodemailer from 'nodemailer';
import { type SendMailOptions } from 'nodemailer';

// Email configuration interface
export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  } | null;
  from: {
    email: string;
    name: string;
  };
}

// Email data interface for sending emails
export interface EmailData {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: {
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }[];
}

// Load email configuration from environment variables
export const getEmailConfig = (): EmailConfig => {
  // Check required environment variables
  if (!process.env.SMTP_HOST) {
    throw new Error('SMTP_HOST is not defined in environment variables');
  }
  if (!process.env.SMTP_PORT) {
    throw new Error('SMTP_PORT is not defined in environment variables');
  }
  if (!process.env.SMTP_FROM_EMAIL) {
    throw new Error('SMTP_FROM_EMAIL is not defined in environment variables');
  }

  const config: EmailConfig = {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10),
    secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
    auth: null,
    from: {
      email: process.env.SMTP_FROM_EMAIL,
      name: process.env.SMTP_FROM_NAME || 'Server Lister',
    },
  };

  // Add auth credentials only if both username and password are provided
  if (process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
    config.auth = {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    };
  }

  return config;
};

// Create the email transporter
// Type for nodemailer transport configuration
interface TransportConfig {
  host: string;
  port: number;
  secure: boolean;
  auth?: {
    user: string;
    pass: string;
  };
}

const createTransporter = (config: EmailConfig) => {
  const transportConfig: TransportConfig = {
    host: config.host,
    port: config.port,
    secure: config.secure,
  };

  // Only add auth if credentials are provided
  if (config.auth) {
    transportConfig.auth = {
      user: config.auth.user,
      pass: config.auth.pass,
    };
  }

  return nodemailer.createTransport(transportConfig);
};

// Send an email
export const sendEmail = async (emailData: EmailData): Promise<boolean> => {
  try {
    const config = getEmailConfig();
    const transporter = createTransporter(config);

    const mailOptions: SendMailOptions = {
      from: `${config.from.name} <${config.from.email}>`,
      to: emailData.to,
      subject: emailData.subject,
      text: emailData.text,
      html: emailData.html,
      cc: emailData.cc,
      bcc: emailData.bcc,
      attachments: emailData.attachments,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};
