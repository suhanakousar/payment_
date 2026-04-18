import nodemailer from 'nodemailer';

let transporterPromise: Promise<nodemailer.Transporter> | null = null;

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required mail configuration: ${name}`);
  }
  return value;
}

async function getTransporter() {
  if (!transporterPromise) {
    transporterPromise = Promise.resolve(
      nodemailer.createTransport({
        host: requireEnv('SMTP_HOST'),
        port: Number(process.env.SMTP_PORT ?? 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: requireEnv('SMTP_USER'),
          pass: requireEnv('SMTP_PASS'),
        },
      })
    );
  }

  return transporterPromise;
}

export async function sendOtpEmail({
  email,
  otp,
  businessName,
  expiresInMinutes,
}: {
  email: string;
  otp: string;
  businessName?: string;
  expiresInMinutes: number;
}) {
  const transporter = await getTransporter();
  const from = requireEnv('SMTP_FROM');
  const appName = process.env.APP_NAME ?? 'PayAgg';
  const heading = businessName ? `Verify ${businessName}` : 'Verify your account';

  await transporter.sendMail({
    from,
    to: email,
    subject: `${appName} verification code: ${otp}`,
    text: [
      `${heading}`,
      '',
      `Your ${appName} verification code is ${otp}.`,
      `It expires in ${expiresInMinutes} minutes.`,
      '',
      `If you did not request this code, you can ignore this email.`,
    ].join('\n'),
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#0f172a">
        <p style="font-size:14px;color:#475569;margin:0 0 12px">${appName}</p>
        <h1 style="font-size:24px;margin:0 0 16px">${heading}</h1>
        <p style="font-size:16px;line-height:1.6;margin:0 0 20px">
          Your verification code is:
        </p>
        <div style="font-size:32px;font-weight:700;letter-spacing:8px;background:#eef2ff;color:#4338ca;padding:16px 20px;border-radius:12px;display:inline-block;margin-bottom:20px">
          ${otp}
        </div>
        <p style="font-size:14px;line-height:1.6;color:#475569;margin:0 0 8px">
          This code expires in ${expiresInMinutes} minutes.
        </p>
        <p style="font-size:14px;line-height:1.6;color:#475569;margin:0">
          If you did not request this email, you can safely ignore it.
        </p>
      </div>
    `,
  });
}
