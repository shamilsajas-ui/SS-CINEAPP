import QRCode from "qrcode";

export async function generateQrCodeDataUrl(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      errorCorrectionLevel: "H",
      margin: 1,
      color: {
        dark: "#0c101a",
        light: "#ffffff",
      },
      width: 280,
    });
  } catch (err) {
    console.error("Failed to generate QR code data URL:", err);
    throw err;
  }
}

export async function generateQrCodeSvg(text: string): Promise<string> {
  try {
    return await QRCode.toString(text, {
      type: "svg",
      errorCorrectionLevel: "H",
      margin: 1,
      color: {
        dark: "#0c101a",
        light: "#ffffff",
      },
    });
  } catch (err) {
    console.error("Failed to generate QR code SVG:", err);
    throw err;
  }
}
