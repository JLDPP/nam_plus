import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import nodemailer from "nodemailer";
import { hostedTicketImages, renderTicketQr, ticketLogoPath } from "./ticketEmailImages.js";

// ==========================================
// FUNCIONES AUXILIARES
// ==========================================

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[char]);
}

// ==========================================
// ENVIAR TICKET ÑAM+ POR CORREO
// ==========================================

export async function sendTicketEmail({
  recipient,
  code,
  restaurantName,
  amountMXN,
  points,
  expiresAt,
}) {
  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASS,
    SMTP_FROM,
  } = process.env;

  // Validar configuración del correo
  if (
    !SMTP_HOST ||
    !Number.isInteger(Number(SMTP_PORT)) ||
    Number(SMTP_PORT) < 1 ||
    Number(SMTP_PORT) > 65535 ||
    !SMTP_USER ||
    !SMTP_PASS ||
    !SMTP_FROM
  ) {
    throw Object.assign(new Error("Configuración SMTP incompleta o inválida."), { code: "SMTP_CONFIG" });
  }

  // ==========================================
  // CONFIGURAR NODEMAILER
  // ==========================================

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    connectionTimeout: 5_000,
    greetingTimeout: 5_000,
    socketTimeout: 8_000,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  // ==========================================
  // GENERAR CÓDIGO QR
  // ==========================================

  let hostedImages;
  try {
    hostedImages = hostedTicketImages(code, expiresAt);
  } catch (cause) {
    throw Object.assign(new Error("Configuración de imágenes del correo inválida.", { cause }), {
      code: "EMAIL_IMAGE_CONFIG",
    });
  }
  let logoSource = hostedImages?.logo;
  let qrSource = hostedImages?.qr;
  const attachments = [];

  if (!hostedImages) {
    const id = randomUUID();
    const logoCid = `logo.${id}@nam-plus.local`;
    const qrCid = `qr.${id}@nam-plus.local`;
    const [logoBuffer, qrBuffer] = await Promise.all([
      readFile(ticketLogoPath),
      renderTicketQr(code),
    ]);

    logoSource = `cid:${logoCid}`;
    qrSource = `cid:${qrCid}`;
    attachments.push(
      { filename: "nam-plus-logo.jpg", content: logoBuffer, contentType: "image/jpeg", contentDisposition: "inline", cid: logoCid },
      { filename: "ticket-qr.png", content: qrBuffer, contentType: "image/png", contentDisposition: "inline", cid: qrCid },
    );
  }

  const restaurant = escapeHTML(restaurantName);
  const safeCode = escapeHTML(code);
  const amount = Number(amountMXN).toFixed(2);
  const safePoints = Number(points);

  const expiration = new Date(expiresAt)
    .toLocaleDateString("es-MX", {
      timeZone: "America/Mexico_City",
    });

  // ==========================================
  // DISEÑO HTML DEL CORREO
  // ==========================================

  const html = `
<!DOCTYPE html>
<html lang="es">

<head>
  <meta charset="UTF-8">
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1"
  >
  <title>Tu ticket Ñam+</title>
</head>

<body style="
  margin:0;
  padding:25px 12px;
  background-color:#FFF7E5;
  font-family:Arial,Helvetica,sans-serif;
  color:#202020;
">

  <table
    role="presentation"
    align="center"
    cellpadding="0"
    cellspacing="0"
    width="100%"
    style="
      max-width:560px;
      background-color:#FFFFFF;
      border-collapse:separate;
      border-spacing:0;
      border-radius:16px;
      overflow:hidden;
    "
  >

    <!-- ================================= -->
    <!-- ENCABEZADO ÑAM+ -->
    <!-- ================================= -->

    <tr>
      <td
        align="center"
        style="
          background-color:#202020;
          padding:32px 20px;
        "
      >

        <img
          src="${escapeHTML(logoSource)}"
          alt="Ñam+"
          width="112"
          height="112"
          style="display:block;width:112px;height:112px;margin:0 auto;border:0;border-radius:56px;color:#FFFFFF;"
        />

        <p style="
          color:#FFFFFF;
          font-size:14px;
          margin:12px 0 0;
        ">
          ¡Cada compra tiene recompensa!
        </p>

      </td>
    </tr>

    <!-- ================================= -->
    <!-- MENSAJE DE BIENVENIDA -->
    <!-- ================================= -->

    <tr>
      <td
        align="center"
        style="padding:30px 25px 15px;"
      >

        <h1 style="
          font-size:25px;
          color:#202020;
          margin:0 0 12px;
        ">
          ¡Gracias por tu compra!
        </h1>

        <p style="
          font-size:15px;
          color:#777777;
          line-height:24px;
          margin:0;
        ">
          Tu compra en
          <strong style="color:#202020;">
            ${restaurant}
          </strong>
          te ha dado una recompensa.
        </p>

      </td>
    </tr>

    <!-- ================================= -->
    <!-- PUNTOS GANADOS -->
    <!-- ================================= -->

    <tr>
      <td style="padding:15px 25px;">

        <table
          role="presentation"
          width="100%"
          cellpadding="0"
          cellspacing="0"
          style="
            background-color:#FFF7E5;
            border-radius:12px;
          "
        >

          <tr>
            <td
              align="center"
              style="padding:25px 10px;"
            >

              <p style="
                color:#777777;
                font-size:14px;
                margin:0 0 8px;
              ">
                ¡Has ganado!
              </p>

              <div style="
                color:#2E7D32;
                font-size:36px;
                font-weight:bold;
              ">
                +${safePoints} puntos
              </div>

              <p style="
                color:#679D37;
                font-size:13px;
                margin:10px 0 0;
              ">
                Acumúlalos en tu cuenta Ñam+
              </p>

            </td>
          </tr>

        </table>

      </td>
    </tr>

    <!-- ================================= -->
    <!-- TICKET QR -->
    <!-- ================================= -->

    <tr>
      <td
        align="center"
        style="padding:20px 25px 10px;"
      >

        <h2 style="
          color:#202020;
          font-size:21px;
          margin:0 0 12px;
        ">
          Tu ticket digital
        </h2>

        <p style="
          color:#777777;
          font-size:14px;
          line-height:22px;
        ">
          Escanea este código QR desde Ñam+
          para acumular tus puntos.
        </p>

        <img
          src="${escapeHTML(qrSource)}"
          alt="Código QR para acumular puntos en Ñam+"
          width="250"
          height="250"
          style="
            display:block;
            width:250px;
            height:auto;
            max-width:100%;
            margin:20px auto;
          "
        />

        <p style="
          font-size:13px;
          color:#777777;
          line-height:20px;
        ">
          Si tu correo oculta la imagen, ingresa
          el código manual de abajo en Ñam+.
        </p>

      </td>
    </tr>

    <!-- ================================= -->
    <!-- CÓDIGO MANUAL -->
    <!-- ================================= -->

    <tr>
      <td
        align="center"
        style="padding:15px 25px 25px;"
      >

        <p style="
          font-size:15px;
          color:#202020;
          font-weight:bold;
          margin:0 0 10px;
        ">
          ¿No puedes escanearlo?
        </p>

        <p style="
          font-size:13px;
          color:#777777;
          margin:0 0 15px;
        ">
          Ingresa este código manual:
        </p>

        <div style="
          background-color:#F5F5F5;
          border:1px dashed #FFC233;
          border-radius:10px;
          padding:17px 12px;
          overflow-wrap:anywhere;
          word-break:break-word;
          font-size:14px;
          font-weight:bold;
          color:#202020;
          letter-spacing:1px;
        ">
          ${safeCode}
        </div>

      </td>
    </tr>

    <!-- ================================= -->
    <!-- DETALLES DE LA COMPRA -->
    <!-- ================================= -->

    <tr>
      <td style="padding:5px 25px 25px;">

        <table
          role="presentation"
          width="100%"
          cellpadding="0"
          cellspacing="0"
          style="
            border-top:1px solid #EEEEEE;
            font-size:14px;
          "
        >

          <tr>
            <td style="
              padding:20px 0 10px;
              color:#777777;
            ">
              Importe de compra
            </td>

            <td
              align="right"
              style="
                padding:20px 0 10px;
                font-weight:bold;
                color:#202020;
              "
            >
              $${amount} MXN
            </td>
          </tr>

          <tr>
            <td style="
              padding:10px 0;
              color:#777777;
            ">
              Puntos obtenidos
            </td>

            <td
              align="right"
              style="
                padding:10px 0;
                font-weight:bold;
                color:#2E7D32;
              "
            >
              +${safePoints}
            </td>
          </tr>

          <tr>
            <td style="
              padding:10px 0;
              color:#777777;
            ">
              Válido hasta
            </td>

            <td
              align="right"
              style="
                padding:10px 0;
                font-weight:bold;
                color:#202020;
              "
            >
              ${expiration}
            </td>
          </tr>

        </table>

      </td>
    </tr>

    <!-- ================================= -->
    <!-- AVISO IMPORTANTE -->
    <!-- ================================= -->

    <tr>
      <td
        align="center"
        style="padding:5px 30px 30px;"
      >

        <p style="
          color:#777777;
          font-size:12px;
          line-height:20px;
        ">
          Este ticket es único y solo
          puede canjearse una vez.
          Conserva este correo hasta
          acumular tus puntos.
        </p>

      </td>
    </tr>

    <!-- ================================= -->
    <!-- PIE DE PÁGINA -->
    <!-- ================================= -->

    <tr>
      <td
        align="center"
        style="
          background-color:#FF5722;
          padding:22px 15px;
        "
      >

        <p style="
          color:#FFFFFF;
          font-size:16px;
          font-weight:bold;
          margin:0;
        ">
          ¡Disfruta, acumula y gana!
        </p>

        <p style="
          color:#FFFFFF;
          font-size:12px;
          margin:10px 0 0;
        ">
          Ñam+ — Recompensamos tus compras.
        </p>

      </td>
    </tr>

  </table>

</body>
</html>
`;

  // ==========================================
  // ENVIAR CORREO
  // ==========================================

  const info = await transporter.sendMail({
    from: SMTP_FROM,
    to: recipient,
    subject: "Ñam+ | ¡Tu compra te dio puntos!",
    html,
    text: [
      "¡Gracias por tu compra en Ñam+!",
      `Restaurante: ${restaurantName}`,
      `Importe: $${amount} MXN`,
      `Puntos ganados: ${safePoints}`,
      `Código manual: ${code}`,
      `Válido hasta: ${expiration}`,
      "Este ticket solo puede utilizarse una vez.",
    ].join("\n"),
    attachments,
  });

  console.log(
    "Ticket Ñam+ aceptado por servidor de correo:",
    info.messageId
  );

  return info;
}
