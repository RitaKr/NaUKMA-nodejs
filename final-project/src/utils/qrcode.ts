import QRCode from "qrcode";

export interface TicketQRData {
  ticketId: string;
  bookingId: string;
  eventId: string;
  eventTitle: string;
  ticketCategory: string;
  date: string;
  country: string;
  city: string;
  arena: string;
  status: string;
}

export async function generateTicketQR(data: TicketQRData): Promise<Buffer> {
  return QRCode.toBuffer(JSON.stringify(data), {
    type: "png",
    width: 200,
    margin: 1,
    errorCorrectionLevel: "M",
  });
}
