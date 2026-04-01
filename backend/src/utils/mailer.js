const nodemailer = require("nodemailer");

// Configuración del servidor de correos (SMTP)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.ethereal.email",
  port: process.env.SMTP_PORT || 587,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const enviarCorreo = async (destinatarios, asunto, mensajeHtml) => {
  try {
    const info = await transporter.sendMail({
      from: '"Gestión de Eventos" <notificaciones@eventos.com>',
      to: destinatarios, // Puede ser un string separado por comas: "a@a.com, b@b.com"
      subject: asunto,
      html: mensajeHtml,
    });
    console.log("📧 Correo enviado correctamente:", info.messageId);
  } catch (error) {
    console.error("❌ Error enviando correo:", error.message);
  }
};

module.exports = { enviarCorreo };