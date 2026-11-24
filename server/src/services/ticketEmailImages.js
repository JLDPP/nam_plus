import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";
import QRCode from "qrcode";

export const ticketLogoPath = fileURLToPath(new URL("../assets/nam-plus-logo.jpg", import.meta.url));

const context = "nam-plus/ticket-email-qr/v1";
const codePattern = /^NAM-[A-F0-9]{32}$/;

function imageKey() {
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET no está configurado.");
  return hkdfSync("sha256", process.env.JWT_SECRET, "", context, 32);
}

export function renderTicketQr(code) {
  return QRCode.toBuffer(code, {
    type: "png",
    width: 400,
    margin: 4,
    errorCorrectionLevel: "M",
  });
}

export function hostedTicketImages(code, expiresAt) {
  const configuredBase = process.env.TICKET_EMAIL_PUBLIC_API_URL?.trim();
  if (!configuredBase) return null;

  const base = new URL(configuredBase);
  if (base.protocol !== "https:" || base.username || base.password || base.search || base.hash) {
    throw new Error("TICKET_EMAIL_PUBLIC_API_URL debe ser una URL HTTPS pública de la API.");
  }
  base.pathname = base.pathname.replace(/\/?$/, "/");

  const expiry = new Date(expiresAt).getTime();
  if (!codePattern.test(code) || !Number.isSafeInteger(expiry)) {
    throw new Error("El ticket no es válido para generar la imagen QR.");
  }

  const nonce = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", imageKey(), nonce);
  const data = Buffer.concat([cipher.update(JSON.stringify({ code, expiry })), cipher.final()]);
  const token = Buffer.concat([nonce, cipher.getAuthTag(), data]).toString("base64url");

  return {
    logo: new URL("api/tickets/email-images/logo.jpg", base).href,
    qr: new URL(`api/tickets/email-images/qr/${token}.png`, base).href,
  };
}

export async function getTicketQrImage(req, res) {
  const { token } = req.params;
  if (!/^[A-Za-z0-9_-]{60,160}$/.test(token)) return res.sendStatus(404);

  const key = imageKey();
  let payload;
  try {
    const bytes = Buffer.from(token, "base64url");
    const decipher = createDecipheriv("aes-256-gcm", key, bytes.subarray(0, 12));
    decipher.setAuthTag(bytes.subarray(12, 28));
    const data = Buffer.concat([decipher.update(bytes.subarray(28)), decipher.final()]);
    payload = JSON.parse(data.toString("utf8"));
  } catch {
    return res.sendStatus(404);
  }

  if (!codePattern.test(payload.code) || !Number.isSafeInteger(payload.expiry) || payload.expiry <= Date.now()) {
    return res.sendStatus(404);
  }

  const image = await renderTicketQr(payload.code);
  return res.set("Cache-Control", "private, no-store").type("png").send(image);
}
