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
  attachments?: { filename: string; content: Buffer; contentType: string }[];
}): Promise<void> {
  await transporter.sendMail({
    from: process.env.SENDER_EMAIL ?? "noreply@eventbooking.com",
    to: options.to,
    subject: options.subject,
    html: options.html,
    attachments: options.attachments,
  });
}

export function buildCancellationHtml(data: {
  userName: string;
  bookingId: string;
  eventTitle: string;
  eventDate: Date;
  ticketCount: number;
}): string {
  const dateStr = data.eventDate.toLocaleString("en-US", {
    dateStyle: "long",
    timeStyle: "short",
  });
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr><td style="background:#7f1d1d;padding:18px 32px;">
          <p style="margin:0;color:#fca5a5;font-size:11px;letter-spacing:1px;">BOOKING CANCELLED</p>
          <p style="margin:4px 0 0;color:#ffffff;font-size:20px;font-weight:bold;">${data.eventTitle}</p>
        </td></tr>
        <tr><td style="padding:28px 32px;">
          <p style="margin:0 0 16px;color:#374151;font-size:15px;">Hello <strong>${data.userName}</strong>,</p>
          <p style="margin:0 0 20px;color:#6b7280;font-size:14px;">Your booking has been cancelled. The tickets are no longer valid and any reserved seats have been released.</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;font-size:13px;">
            <tr style="background:#f8fafc;"><td style="padding:10px 14px;color:#6b7280;width:40%;">Booking ID</td><td style="padding:10px 14px;color:#111827;font-family:monospace;">${data.bookingId}</td></tr>
            <tr><td style="padding:10px 14px;color:#6b7280;">Event</td><td style="padding:10px 14px;color:#111827;">${data.eventTitle}</td></tr>
            <tr style="background:#f8fafc;"><td style="padding:10px 14px;color:#6b7280;">Date</td><td style="padding:10px 14px;color:#111827;">${dateStr}</td></tr>
            <tr><td style="padding:10px 14px;color:#6b7280;">Tickets</td><td style="padding:10px 14px;color:#111827;">${data.ticketCount}</td></tr>
          </table>
        </td></tr>
        <tr><td style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e5e7eb;">
          <p style="margin:0;color:#9ca3af;font-size:11px;">If you did not request this cancellation, please contact support immediately.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
  `.trim();
}

export function buildBookingConfirmationHtml(data: {
  userName: string;
  bookingId: string;
  eventTitle: string;
  eventDate: Date;
  country: string;
  city: string;
  arena: string;
  totalPrice: number;
  ticketCount: number;
  imageUrl?: string;
}): string {
  const dateStr = data.eventDate.toLocaleString("en-US", {
    dateStyle: "long",
    timeStyle: "short",
  });
  const venue = `${data.arena}, ${data.city}, ${data.country}`;
  const baseUrl = process.env.BASE_URL ?? "http://localhost:2500";
  const imageHtml = data.imageUrl
    ? `<img src="${baseUrl}${data.imageUrl}" alt="${data.eventTitle}" style="width:100%;max-height:240px;object-fit:cover;object-position:center;display:block;border-radius:6px 6px 0 0;" />`
    : `<div style="width:100%;height:120px;background:#1e3a5f;border-radius:6px 6px 0 0;display:flex;align-items:center;justify-content:center;"><span style="color:#c9a84c;font-size:22px;font-weight:bold;font-family:Arial,sans-serif;padding:16px;">${data.eventTitle}</span></div>`;

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr><td style="padding:0;">${imageHtml}</td></tr>
        <tr><td style="background:#1e3a5f;padding:18px 32px;">
          <p style="margin:0;color:#c9a84c;font-size:11px;letter-spacing:1px;">BOOKING CONFIRMATION</p>
          <p style="margin:4px 0 0;color:#ffffff;font-size:20px;font-weight:bold;">${data.eventTitle}</p>
        </td></tr>
        <tr><td style="padding:28px 32px;">
          <p style="margin:0 0 16px;color:#374151;font-size:15px;">Hello <strong>${data.userName}</strong>,</p>
          <p style="margin:0 0 20px;color:#6b7280;font-size:14px;">Your booking is confirmed. Your PDF ticket(s) are attached to this email — present the QR code at the entrance.</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;font-size:13px;">
            <tr style="background:#f8fafc;"><td style="padding:10px 14px;color:#6b7280;width:40%;">Booking ID</td><td style="padding:10px 14px;color:#111827;font-family:monospace;">${data.bookingId}</td></tr>
            <tr><td style="padding:10px 14px;color:#6b7280;">Date</td><td style="padding:10px 14px;color:#111827;">${dateStr}</td></tr>
            <tr style="background:#f8fafc;"><td style="padding:10px 14px;color:#6b7280;">Venue</td><td style="padding:10px 14px;color:#111827;">${venue}</td></tr>
            <tr><td style="padding:10px 14px;color:#6b7280;">Tickets</td><td style="padding:10px 14px;color:#111827;">${data.ticketCount}</td></tr>
            <tr style="background:#f8fafc;"><td style="padding:10px 14px;color:#6b7280;">Total Paid</td><td style="padding:10px 14px;color:#1e3a5f;font-weight:bold;font-size:15px;">$${data.totalPrice.toFixed(2)}</td></tr>
          </table>
        </td></tr>
        <tr><td style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e5e7eb;">
          <p style="margin:0;color:#9ca3af;font-size:11px;">If you did not make this booking, please contact support immediately.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
  `.trim();
}
