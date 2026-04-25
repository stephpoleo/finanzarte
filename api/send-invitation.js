module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) {
    return res.status(500).json({ error: 'RESEND_API_KEY not configured' });
  }

  const { invited_email, invited_by_name, household_name } = req.body || {};

  if (!invited_email) {
    return res.status(400).json({ error: 'invited_email is required' });
  }

  const inviterName = invited_by_name || 'Alguien';
  const houseName = household_name || 'su hogar';
  const APP_NAME = 'Finanzarte';

  const emailHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="color: #006847; font-size: 28px; margin: 0;">${APP_NAME}</h1>
        <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Tu app de finanzas personales</p>
      </div>
      <div style="background: linear-gradient(135deg, #4f6df5, #a855f7); border-radius: 16px; padding: 32px 24px; color: white; text-align: center; margin-bottom: 24px;">
        <p style="font-size: 18px; margin: 0 0 8px;">
          <strong>${inviterName}</strong> te ha invitado a
        </p>
        <p style="font-size: 22px; font-weight: bold; margin: 0;">
          ${houseName}
        </p>
      </div>
      <div style="background: #f8fafc; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
        <p style="color: #334155; font-size: 15px; line-height: 1.6; margin: 0;">
          Con <strong>${APP_NAME}</strong> pueden llevar juntos sus finanzas en pareja:
          presupuesto compartido, gastos divididos y metas en comun.
        </p>
      </div>
      <div style="text-align: center; margin-bottom: 32px;">
        <p style="color: #64748b; font-size: 14px;">
          Descarga ${APP_NAME} y crea tu cuenta con este correo
          (<strong>${invited_email}</strong>) para aceptar la invitacion.
        </p>
      </div>
      <div style="text-align: center; color: #94a3b8; font-size: 12px; border-top: 1px solid #e2e8f0; padding-top: 16px;">
        <p>Este correo fue enviado porque ${inviterName} te invito a ${APP_NAME}.</p>
        <p>Si no conoces a esta persona, puedes ignorar este mensaje.</p>
      </div>
    </div>
  `;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `${APP_NAME} <onboarding@resend.dev>`,
        to: [invited_email],
        subject: `${inviterName} te invito a ${APP_NAME}`,
        html: emailHtml,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Resend error:', data);
      return res.status(response.status).json({ error: data });
    }

    return res.status(200).json({ success: true, id: data.id });
  } catch (err) {
    console.error('Send invitation error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
