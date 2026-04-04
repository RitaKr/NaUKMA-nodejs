import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: false,
  auth: {
    user: process.env.SMTP_AUTH_USER,
    pass: process.env.SMTP_AUTH_PASS,
  },
});

export async function sendMail(options: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  await transporter.sendMail({
    from: process.env.SENDER_EMAIL ?? "noreply@eventbooking.com",
    to: options.to,
    subject: options.subject,
    html: options.html,
  });
}

export function buildBookingConfirmationHtml(data: {
  userName: string;
  bookingId: string;
  eventTitle: string;
  eventDate: Date;
  eventLocation: string;
  quantity: number;
  totalPrice: number;
  baseUrl: string;
}): string {
  const dateStr = data.eventDate.toLocaleString("en-US", {
    dateStyle: "long",
    timeStyle: "short",
  });
  const qrUrl = `${data.baseUrl}/bookings/${data.bookingId}/qr`;

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; color: #333;">
  <h2 style="color: #2563eb;">Booking Confirmation</h2>
  <p>Hello <strong>${data.userName}</strong>,</p>
  <p>Your booking has been confirmed! Here are the details:</p>

  <table style="width:100%; border-collapse: collapse; margin: 16px 0;">
    <tr style="background:#f3f4f6;"><td style="padding:8px;"><strong>Booking ID</strong></td><td style="padding:8px;">${data.bookingId}</td></tr>
    <tr><td style="padding:8px;"><strong>Event</strong></td><td style="padding:8px;">${data.eventTitle}</td></tr>
    <tr style="background:#f3f4f6;"><td style="padding:8px;"><strong>Date</strong></td><td style="padding:8px;">${dateStr}</td></tr>
    <tr><td style="padding:8px;"><strong>Location</strong></td><td style="padding:8px;">${data.eventLocation}</td></tr>
    <tr style="background:#f3f4f6;"><td style="padding:8px;"><strong>Tickets</strong></td><td style="padding:8px;">${data.quantity}</td></tr>
    <tr><td style="padding:8px;"><strong>Total Price</strong></td><td style="padding:8px;">$${data.totalPrice.toFixed(2)}</td></tr>
  </table>

  <p>Your QR code for event entry is available at:</p>
  <p><a href="${qrUrl}" style="color:#2563eb;">${qrUrl}</a></p>
  <p style="color:#6b7280; font-size:12px;">If you did not make this booking, please contact support immediately.</p>
</body>
</html>
  `.trim();
}
