import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const APP_NAME = "Finanzarte";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers":
          "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const { invited_email, invited_by_name, household_name } = await req.json();

    if (!invited_email) {
      return new Response(
        JSON.stringify({ error: "invited_email is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const inviterName = invited_by_name || "Alguien";
    const houseName = household_name || "su hogar";

    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #006847; font-size: 28px; margin: 0;">💰 ${APP_NAME}</h1>
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
            presupuesto compartido, gastos divididos y metas en común.
          </p>
        </div>

        <div style="text-align: center; margin-bottom: 32px;">
          <p style="color: #64748b; font-size: 14px;">
            Descarga ${APP_NAME} y crea tu cuenta con este correo
            (<strong>${invited_email}</strong>) para aceptar la invitación.
          </p>
        </div>

        <div style="text-align: center; color: #94a3b8; font-size: 12px; border-top: 1px solid #e2e8f0; padding-top: 16px;">
          <p>Este correo fue enviado porque ${inviterName} te invitó a ${APP_NAME}.</p>
          <p>Si no conoces a esta persona, puedes ignorar este mensaje.</p>
        </div>
      </div>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `${APP_NAME} <noreply@finanzarte.app>`,
        to: [invited_email],
        subject: `${inviterName} te invitó a ${APP_NAME} 💰`,
        html: emailHtml,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Resend error:", data);
      return new Response(JSON.stringify({ error: data }), {
        status: res.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, id: data.id }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
