import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.EMAIL_FROM ?? 'noreply@aguara.io'

// ─── Welcome ──────────────────────────────────────────────────────────────────
export async function sendWelcomeEmail(to: string, name: string) {
  return resend.emails.send({
    from: `Aguara <${FROM}>`,
    to,
    subject: '¡Bienvenido a Aguara!',
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#111">
        <h1 style="font-size:22px;margin-bottom:8px">Hola, ${name} 👋</h1>
        <p style="color:#555">Tu cuenta en <strong>Aguara Business Control Tower</strong> ya está activa.</p>
        <p style="color:#555">Conectá tu primera tienda y empezá a ver tus métricas en tiempo real.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}"
           style="display:inline-block;margin-top:16px;padding:10px 20px;background:#1d6bf3;color:#fff;border-radius:6px;text-decoration:none;font-weight:600">
          Ir al dashboard →
        </a>
        <p style="margin-top:32px;font-size:12px;color:#999">Aguara · aguara.io</p>
      </div>
    `,
  })
}

// ─── Password Reset ────────────────────────────────────────────────────────────
// Supabase handles the reset link — use this for custom branded wrapper if needed
export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  return resend.emails.send({
    from: `Aguara <${FROM}>`,
    to,
    subject: 'Restablecer contraseña — Aguara',
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#111">
        <h1 style="font-size:20px">Restablecer contraseña</h1>
        <p style="color:#555">Recibimos una solicitud para restablecer tu contraseña.</p>
        <a href="${resetUrl}"
           style="display:inline-block;margin-top:16px;padding:10px 20px;background:#1d6bf3;color:#fff;border-radius:6px;text-decoration:none;font-weight:600">
          Cambiar contraseña →
        </a>
        <p style="margin-top:16px;font-size:13px;color:#999">
          Si no solicitaste esto, podés ignorar este email.
        </p>
        <p style="margin-top:32px;font-size:12px;color:#999">Aguara · aguara.io</p>
      </div>
    `,
  })
}

// ─── Alert Notification ───────────────────────────────────────────────────────
export async function sendAlertEmail(to: string, alertTitle: string, alertBody: string) {
  return resend.emails.send({
    from: `Aguara Alertas <${FROM}>`,
    to,
    subject: `Alerta: ${alertTitle}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#111">
        <h1 style="font-size:18px;color:#e53e3e">⚠️ ${alertTitle}</h1>
        <p style="color:#555">${alertBody}</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/alertas"
           style="display:inline-block;margin-top:16px;padding:10px 20px;background:#1d6bf3;color:#fff;border-radius:6px;text-decoration:none;font-weight:600">
          Ver alertas →
        </a>
        <p style="margin-top:32px;font-size:12px;color:#999">Aguara · aguara.io</p>
      </div>
    `,
  })
}
