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
}
