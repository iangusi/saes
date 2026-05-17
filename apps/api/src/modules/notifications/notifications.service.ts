import nodemailer from 'nodemailer';
import { env } from '../../config/env';

export class NotificationsService {
  private readonly transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: parseInt(env.SMTP_PORT),
    secure: false,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });

  async sendPasswordReset(to: string, nombre: string, token: string): Promise<void> {
    const url = `${env.FRONTEND_URL}/reset-password?token=${token}`;

    await this.transporter.sendMail({
      from: env.SMTP_FROM,
      to,
      subject: 'Recuperación de contraseña – SAES 2.0',
      html: `
        <p>Hola ${nombre},</p>
        <p>Recibiste este correo porque solicitaste restablecer tu contraseña.</p>
        <p>
          <a href="${url}" style="background:#003087;color:#fff;padding:10px 20px;
             text-decoration:none;border-radius:4px;">Restablecer contraseña</a>
        </p>
        <p>Este enlace expira en <strong>1 hora</strong>.</p>
        <p>Si no solicitaste esto, ignora este correo.</p>
      `,
    });
  }

  async sendAdminNotification(to: string, asunto: string, cuerpo: string): Promise<void> {
    await this.transporter.sendMail({
      from: env.SMTP_FROM,
      to,
      subject: `${asunto} – SAES 2.0`,
      html: `<p>${cuerpo}</p>`,
    });
  }

  async sendEnrollmentConfirmation(
    to: string,
    nombre: string,
    materias: string[]
  ): Promise<void> {
    const lista = materias.map((m) => `<li>${m}</li>`).join('');
    await this.transporter.sendMail({
      from: env.SMTP_FROM,
      to,
      subject: 'Confirmación de reinscripción – SAES 2.0',
      html: `
        <p>Hola ${nombre},</p>
        <p>Tu reinscripción fue procesada con éxito. Materias inscritas:</p>
        <ul>${lista}</ul>
      `,
    });
  }

  async sendWelcomeWithPassword(
    to: string,
    nombre: string,
    identificador: string,
    password: string
  ): Promise<void> {
    await this.transporter.sendMail({
      from: env.SMTP_FROM,
      to,
      subject: 'Bienvenido al SAES 2.0 – Tus credenciales de acceso',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden;">
          <div style="background:#6D1130;padding:20px 24px;">
            <h2 style="color:#fff;margin:0;">SAES 2.0 – Credenciales de acceso</h2>
          </div>
          <div style="padding:24px;">
            <p>Hola <strong>${nombre}</strong>,</p>
            <p>Tu cuenta ha sido creada en el sistema SAES 2.0. A continuación tus credenciales de acceso:</p>
            <table style="width:100%;border-collapse:collapse;margin:16px 0;">
              <tr style="background:#f5f5f5;">
                <td style="padding:10px 14px;font-weight:bold;border:1px solid #ddd;">Identificador</td>
                <td style="padding:10px 14px;border:1px solid #ddd;font-family:monospace;">${identificador}</td>
              </tr>
              <tr>
                <td style="padding:10px 14px;font-weight:bold;border:1px solid #ddd;">Contraseña temporal</td>
                <td style="padding:10px 14px;border:1px solid #ddd;font-family:monospace;">${password}</td>
              </tr>
            </table>
            <p style="color:#c0392b;font-size:13px;"><strong>Importante:</strong> Cambia tu contraseña en tu primer inicio de sesión desde el apartado de datos personales.</p>
            <p style="color:#888;font-size:12px;">Si no reconoces esta cuenta, ignora este correo o contacta a control escolar.</p>
          </div>
        </div>
      `,
    });
  }

  async sendAppointmentNotification(
    to: string,
    nombre: string,
    fecha: string,
    horaInicio: string,
    horaFin: string
  ): Promise<void> {
    await this.transporter.sendMail({
      from: env.SMTP_FROM,
      to,
      subject: 'Tu cita de reinscripción – SAES 2.0',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden;">
          <div style="background:#6D1130;padding:20px 24px;">
            <h2 style="color:#fff;margin:0;">SAES 2.0 – Cita de Reinscripción</h2>
          </div>
          <div style="padding:24px;">
            <p>Hola <strong>${nombre}</strong>,</p>
            <p>Se te ha asignado una cita para el proceso de reinscripción del próximo semestre.</p>
            <table style="width:100%;border-collapse:collapse;margin:16px 0;">
              <tr style="background:#f5f5f5;">
                <td style="padding:10px 14px;font-weight:bold;border:1px solid #ddd;">Fecha</td>
                <td style="padding:10px 14px;border:1px solid #ddd;">${fecha}</td>
              </tr>
              <tr>
                <td style="padding:10px 14px;font-weight:bold;border:1px solid #ddd;">Hora de inicio</td>
                <td style="padding:10px 14px;border:1px solid #ddd;">${horaInicio}</td>
              </tr>
              <tr style="background:#f5f5f5;">
                <td style="padding:10px 14px;font-weight:bold;border:1px solid #ddd;">Hora de fin</td>
                <td style="padding:10px 14px;border:1px solid #ddd;">${horaFin}</td>
              </tr>
            </table>
            <p>Ingresa al sistema SAES 2.0 dentro de tu horario asignado para realizar tu reinscripción.</p>
            <p style="color:#888;font-size:12px;">Si tienes dudas, acude a la ventanilla de control escolar.</p>
          </div>
        </div>
      `,
    });
  }
}
