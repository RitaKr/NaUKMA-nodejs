import path from "path";
import fs from "fs";
import PDFDocument from "pdfkit";
import sharp from "sharp";
import { generateTicketQR, TicketQRData } from "./qrcode";

export interface TicketInfo {
  ticketId: string;
  categoryName: string;
  price: number;
}

export interface PdfBookingData {
  bookingId: string;
  bookedAt: Date;
  totalPrice: number;
  userName: string;
  userEmail: string;
  event: {
    id: string;
    title: string;
    date: Date;
    country: string;
    city: string;
    arena: string;
    address: string;
    category: string;
    imageUrl?: string | null;
    lineup: { name: string; role: string }[];
  };
  tickets: TicketInfo[];
  status: string;
}

// Crop image to 2:1 ratio as a JPEG buffer using sharp
async function cropBannerImage(imageUrl: string): Promise<Buffer | null> {
  try {
    const filePath = path.join(process.cwd(), imageUrl);
    if (!fs.existsSync(filePath)) return null;
    const img = sharp(filePath);
    const meta = await img.metadata();
    if (!meta.width || !meta.height) return null;
    const targetWidth = meta.width;
    const targetHeight = Math.round(meta.width / 2);
    const cropHeight = Math.min(targetHeight, meta.height);
    return await img
      .extract({ left: 0, top: 0, width: targetWidth, height: cropHeight })
      .resize(targetWidth, targetHeight, { fit: "cover", position: "top" })
      .jpeg({ quality: 85 })
      .toBuffer();
  } catch {
    return null;
  }
}

export async function generateBookingPdf(
  data: PdfBookingData,
): Promise<Buffer> {
  const [qrBuffers, bannerBuf] = await Promise.all([
    Promise.all(
      data.tickets.map((t) => {
        const qrData: TicketQRData = {
          ticketId: t.ticketId,
          bookingId: data.bookingId,
          eventId: data.event.id,
          eventTitle: data.event.title,
          ticketCategory: t.categoryName,
          date: data.event.date.toISOString(),
          country: data.event.country,
          city: data.event.city,
          arena: data.event.arena,
          status: data.status,
        };
        return generateTicketQR(qrData);
      }),
    ),
    data.event.imageUrl
      ? cropBannerImage(data.event.imageUrl)
      : Promise.resolve(null),
  ]);

  return new Promise((resolve, reject) => {
    const margin = 45;
    const doc = new PDFDocument({ size: "A4", margin, autoFirstPage: true });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageW = doc.page.width; // 595.28
    const contentW = pageW - margin * 2;
    const accentColor = "#1e3a5f";
    const gold = "#c9a84c";

    const eventDateStr = data.event.date.toLocaleString("en-US", {
      dateStyle: "full",
      timeStyle: "short",
    });
    const venue = `${data.event.arena}, ${data.event.city}, ${data.event.country}`;

    // ── Helper: full-width horizontal rule ───────────────────────────────
    function rule(y?: number) {
      const ry = y ?? doc.y;
      doc
        .moveTo(margin, ry)
        .lineTo(pageW - margin, ry)
        .strokeColor("#e5e7eb")
        .lineWidth(0.5)
        .stroke();
      if (y === undefined) doc.moveDown(0.4);
    }

    // ── Cover page ───────────────────────────────────────────────────────
    // Banner image (2:1 crop) or solid header bar
    const bannerH = 160;
    if (bannerBuf) {
      doc.image(bannerBuf, 0, 0, { width: pageW, height: bannerH });
      // dark overlay for text legibility
      doc
        .rect(0, 0, pageW, bannerH)
        .fillOpacity(0.45)
        .fill(accentColor)
        .fillOpacity(1);
    } else {
      doc.rect(0, 0, pageW, bannerH).fill(accentColor);
    }

    // Event title over banner
    doc
      .font("Helvetica-Bold")
      .fontSize(22)
      .fillColor("#ffffff")
      .text(data.event.title, margin, 38, { width: contentW, align: "center" });
    doc
      .font("Helvetica")
      .fontSize(11)
      .fillColor(gold)
      .text(eventDateStr, margin, 72, { width: contentW, align: "center" });
    doc
      .fontSize(10)
      .fillColor("#cbd5e1")
      .text(venue, margin, 96, { width: contentW, align: "center" });

    doc.y = bannerH + 20;

    // Booking summary box
    const boxTop = doc.y;
    const boxH = 100;
    doc.rect(margin, boxTop, contentW, boxH).fillColor("#f8fafc").fill();
    doc
      .rect(margin, boxTop, contentW, boxH)
      .strokeColor("#e2e8f0")
      .lineWidth(1)
      .stroke();

    // Left column inside box
    const col1x = margin + 16;
    const col2x = margin + contentW / 2 + 8;
    const rowY1 = boxTop + 14;
    const rowY2 = boxTop + 42;
    const rowY3 = boxTop + 70;

    doc.font("Helvetica").fontSize(8).fillColor("#64748b");
    doc.text("BOOKING ID", col1x, rowY1);
    doc.text("BOOKED BY", col2x, rowY1);
    doc.font("Helvetica-Bold").fontSize(10).fillColor("#1e293b");
    doc.text(data.bookingId, col1x, rowY1 + 11, { width: contentW / 2 - 24 });
    doc.text(`${data.userName}`, col2x, rowY1 + 11, {
      width: contentW / 2 - 16,
    });

    doc.font("Helvetica").fontSize(8).fillColor("#64748b");
    doc.text("TOTAL PAID", col1x, rowY2);
    doc.text("STATUS", col2x, rowY2);
    doc.font("Helvetica-Bold").fontSize(13).fillColor(accentColor);
    doc.text(`$${data.totalPrice.toFixed(2)}`, col1x, rowY2 + 10);
    const statusColor = data.status === "ACTIVE" ? "#16a34a" : "#dc2626";
    doc
      .fontSize(11)
      .fillColor(statusColor)
      .text(data.status, col2x, rowY2 + 11);

    doc.font("Helvetica").fontSize(8).fillColor("#64748b");
    doc.text("ADDRESS", col1x, rowY3);
    doc.font("Helvetica").fontSize(9).fillColor("#374151");
    doc.text(data.event.address, col1x, rowY3 + 10, { width: contentW - 32 });

    doc.y = boxTop + boxH + 20;

    // Tickets summary
    rule();
    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .fillColor(accentColor)
      .text(`TICKETS  (${data.tickets.length} total)`, { continued: true })
      .font("Helvetica")
      .fontSize(9)
      .fillColor("#64748b")
      .text(`  —  see individual pages below`, { align: "left" });
    doc.moveDown(0.4);

    // Group tickets by category
    const grouped: Record<string, { count: number; price: number }> = {};
    for (const t of data.tickets) {
      grouped[t.categoryName] ??= { count: 0, price: t.price };
      grouped[t.categoryName].count++;
    }
    for (const [cat, info] of Object.entries(grouped)) {
      doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor("#111827")
        .text(`• ${cat}`, margin + 8, doc.y, {
          continued: true,
          width: contentW - 120,
        })
        .text(
          `${info.count} × $${info.price.toFixed(2)} = $${(info.count * info.price).toFixed(2)}`,
          { align: "right", width: contentW - 8 },
        );
    }

    // Line-up section
    if (data.event.lineup.length > 0) {
      doc.moveDown(0.6);
      rule();
      doc
        .font("Helvetica-Bold")
        .fontSize(11)
        .fillColor(accentColor)
        .text("LINE-UP");
      doc.moveDown(0.2);
      for (const entry of data.event.lineup) {
        doc
          .font("Helvetica-Bold")
          .fontSize(10)
          .fillColor("#1e293b")
          .text(entry.name, margin + 8, doc.y, { continued: true })
          .font("Helvetica")
          .fillColor("#64748b")
          .text(`  ${entry.role}`);
      }
    }

    // Footer strip
    const footerY = doc.page.height - 36;
    doc.rect(0, footerY, pageW, 36).fill(accentColor);
    const savedBottom = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;
    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor("#94a3b8")
      .text(
        "Event Booking System  \u2022  Present QR code at entrance",
        margin,
        footerY + 12,
        { width: contentW, align: "center" },
      );
    doc.page.margins.bottom = savedBottom;

    // ── One page per ticket ───────────────────────────────────────────────
    for (let i = 0; i < data.tickets.length; i++) {
      const ticket = data.tickets[i];
      const qrBuf = qrBuffers[i];

      doc.addPage();

      // ── Ticket header bar ─────────────────────────────────────────────
      const hdrH = 80;
      doc.rect(0, 0, pageW, hdrH).fill(accentColor);

      doc
        .font("Helvetica-Bold")
        .fontSize(9)
        .fillColor(gold)
        .text(`TICKET  ${i + 1} / ${data.tickets.length}`, margin, 14, {
          width: contentW,
        });
      doc
        .font("Helvetica-Bold")
        .fontSize(17)
        .fillColor("#ffffff")
        .text(data.event.title, margin, 26, { width: contentW });
      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor("#94a3b8")
        .text(eventDateStr, margin, 52, { width: contentW });

      doc.y = hdrH + 18;

      // ── Two-column info grid ──────────────────────────────────────────
      const gridCol2 = margin + contentW / 2 + 10;

      function infoBlock(
        label: string,
        value: string,
        x: number,
        y: number,
        w: number,
      ) {
        doc
          .font("Helvetica")
          .fontSize(7.5)
          .fillColor("#6b7280")
          .text(label, x, y);
        doc
          .font("Helvetica-Bold")
          .fontSize(11)
          .fillColor("#111827")
          .text(value, x, y + 10, { width: w });
      }

      let gy = doc.y;
      infoBlock(
        "TICKET CATEGORY",
        ticket.categoryName,
        margin,
        gy,
        contentW / 2 - 10,
      );
      infoBlock(
        "TICKET ID",
        ticket.ticketId.slice(0, 18) + "…",
        gridCol2,
        gy,
        contentW / 2 - 10,
      );

      doc.y = gy + 36;
      gy = doc.y;
      infoBlock(
        "PRICE",
        `$${ticket.price.toFixed(2)}`,
        margin,
        gy,
        contentW / 2 - 10,
      );
      infoBlock("STATUS", data.status, gridCol2, gy, contentW / 2 - 10);

      doc.y = gy + 36;
      gy = doc.y;
      infoBlock("VENUE", venue, margin, gy, contentW / 2 - 10);
      infoBlock("BOOKED BY", data.userName, gridCol2, gy, contentW / 2 - 10);

      doc.y = gy + 36;

      // ── Dashed separator ─────────────────────────────────────────────
      const dashY = doc.y + 8;
      let dx = margin;
      while (dx < pageW - margin) {
        doc
          .moveTo(dx, dashY)
          .lineTo(Math.min(dx + 6, pageW - margin), dashY)
          .strokeColor("#d1d5db")
          .lineWidth(0.8)
          .stroke();
        dx += 10;
      }
      // Notch circles at sides
      doc.circle(margin - 18, dashY, 14).fill("#ffffff");
      doc.circle(pageW - margin + 18, dashY, 14).fill("#ffffff");
      doc.y = dashY + 20;

      // ── QR code centred ──────────────────────────────────────────────
      const qrSize = 170;
      const qrX = margin + (contentW - qrSize) / 2;
      const qrY = doc.y;
      doc.image(qrBuf, qrX, qrY, { width: qrSize, height: qrSize });
      doc.y = qrY + qrSize + 10;

      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor("#9ca3af")
        .text("Scan this QR code at the event entrance", { align: "center" });

      // ── Footer strip ─────────────────────────────────────────────────
      const tFooterY = doc.page.height - 36;
      doc.rect(0, tFooterY, pageW, 36).fill(accentColor);
      const savedBottom2 = doc.page.margins.bottom;
      doc.page.margins.bottom = 0;
      doc
        .font("Helvetica")
        .fontSize(7.5)
        .fillColor("#94a3b8")
        .text(
          "Event Booking System  \u2022  Present this ticket at the entrance",
          margin,
          tFooterY + 12,
          { width: contentW, align: "center" },
        );
      doc.page.margins.bottom = savedBottom2;
    }

    doc.end();
  });
}
