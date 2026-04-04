import QRCode from "qrcode";

export interface BookingQRData {
  bookingId: string;
  eventId: string;
  eventTitle: string;
  userId: string;
  quantity: number;
  status: string;
  bookedAt: string;
}

export async function generateBookingQR(data: BookingQRData): Promise<Buffer> {
  const payload = JSON.stringify(data);
  return QRCode.toBuffer(payload, {
    type: "png",
    width: 300,
    margin: 2,
    errorCorrectionLevel: "M",
  });
}
