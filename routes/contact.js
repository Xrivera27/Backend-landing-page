const express    = require('express');
const nodemailer = require('nodemailer');
const router     = express.Router();

// ── Transporter SMTP ──
const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST,
  port:   parseInt(process.env.SMTP_PORT) || 465,
  secure: true,
  auth: {
    type: 'LOGIN',
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false
  }
});

// ── POST /api/contact ──
router.post('/', async (req, res) => {
  const {
    name,
    first_name, last_name,
    email,
    phone,
    insurance_type,
    message,
    source // 'hero' o 'contact'
  } = req.body;

  // Nombre completo (hero manda "name", contact manda "first_name + last_name")
  const fullName = name || `${first_name || ''} ${last_name || ''}`.trim();

  // Validación básica
  if (!fullName || !email) {
    return res.status(400).json({ success: false, message: 'Nombre y email son requeridos.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ success: false, message: 'Email inválido.' });
  }

  try {
    // ── Email a ASEROSA ──
    await transporter.sendMail({
      from:    `"ASEROSA Website" <${process.env.SMTP_USER}>`,
      to:      process.env.RECIPIENT_EMAIL || 'info@aserosainsurance.com',
      replyTo: email,
      subject: `Nueva solicitud de cotización – ${insurance_type || 'General'}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #f5f5f5; border-radius: 8px;">
          <div style="background: #1a2f4e; padding: 20px 24px; border-radius: 8px 8px 0 0;">
            <h1 style="color: #ffffff; margin: 0; font-size: 22px;">Nueva Solicitud de Cotización</h1>
            <p style="color: #2db84b; margin: 4px 0 0; font-size: 13px;">ASEROSA Insurance Brokers – Roatán</p>
          </div>
          <div style="background: #ffffff; padding: 24px; border-radius: 0 0 8px 8px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #6b7a8d; font-size: 13px; width: 140px;">Nombre</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #1a2f4e; font-weight: 600;">${fullName}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #6b7a8d; font-size: 13px;">Email</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #1a2f4e; font-weight: 600;"><a href="mailto:${email}" style="color: #2db84b;">${email}</a></td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #6b7a8d; font-size: 13px;">Teléfono</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #1a2f4e; font-weight: 600;">${phone || '—'}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #6b7a8d; font-size: 13px;">Tipo de seguro</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee;">
                  <span style="background: #2db84b; color: #fff; padding: 3px 12px; border-radius: 20px; font-size: 13px; font-weight: 600;">${insurance_type || 'No especificado'}</span>
                </td>
              </tr>
              ${message ? `
              <tr>
                <td style="padding: 10px 0; color: #6b7a8d; font-size: 13px; vertical-align: top;">Mensaje</td>
                <td style="padding: 10px 0; color: #1a2f4e;">${message}</td>
              </tr>` : ''}
            </table>
            <div style="margin-top: 24px; padding: 12px 16px; background: #f5f5f5; border-radius: 6px; font-size: 12px; color: #6b7a8d;">
              Formulario: <strong>${source === 'hero' ? 'Quick Quote (Hero)' : 'Contacto'}</strong> &nbsp;·&nbsp; ${new Date().toLocaleString('es-HN', { timeZone: 'America/Tegucigalpa' })}
            </div>
          </div>
        </div>
      `,
    });

    // ── Email de confirmación al cliente ──
    await transporter.sendMail({
      from:    `"ASEROSA Insurance Brokers" <${process.env.SMTP_USER}>`,
      to:      email,
      subject: 'Recibimos tu solicitud – ASEROSA Insurance Brokers',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #f5f5f5; border-radius: 8px;">
          <div style="background: #1a2f4e; padding: 20px 24px; border-radius: 8px 8px 0 0; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 22px;">ASEROSA</h1>
            <p style="color: #2db84b; margin: 4px 0 0; font-size: 13px;">Insurance Brokers – Roatán, Bay Islands</p>
          </div>
          <div style="background: #ffffff; padding: 32px 24px; border-radius: 0 0 8px 8px; text-align: center;">
            <div style="width: 56px; height: 56px; background: rgba(45,184,75,0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
              <span style="font-size: 28px;">✓</span>
            </div>
            <h2 style="color: #1a2f4e; margin: 0 0 8px;">¡Solicitud Recibida!</h2>
            <p style="color: #6b7a8d; margin: 0 0 24px;">Hola ${fullName.split(' ')[0]}, hemos recibido tu solicitud de cotización para <strong>${insurance_type || 'seguro'}</strong>.</p>
            <p style="color: #6b7a8d; margin: 0 0 24px;">Uno de nuestros asesores se pondrá en contacto contigo a la brevedad.</p>
            <div style="background: #f5f5f5; border-radius: 8px; padding: 16px; margin-top: 24px; font-size: 13px; color: #6b7a8d;">
              <strong style="color: #1a2f4e;">ASEROSA – Asesores de Seguros de Roatán S.A.</strong><br>
              French Harbour, Roatán, Bay Islands, Honduras<br>
              📞 +504 2455-5216 &nbsp;·&nbsp; ✉ info@aserosainsurance.com
            </div>
          </div>
        </div>
      `,
    });

    return res.json({ success: true, message: 'Solicitud enviada correctamente.' });

  } catch (error) {
    console.error('Mail error:', error);
    return res.status(500).json({ success: false, message: 'Error al enviar el mensaje. Intenta de nuevo.' });
  }
});

module.exports = router;