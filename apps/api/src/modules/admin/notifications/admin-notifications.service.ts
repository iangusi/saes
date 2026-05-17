import { AdminNotificationsRepository } from './admin-notifications.repository';
import { NotificationsService } from '../../notifications/notifications.service';
import { AuditService } from '../../audit/audit.service';
import { FiltroNotificacion, SendNotificationDto, SendResult } from './admin-notifications.types';

export class AdminNotificationsService {
  private readonly repo = new AdminNotificationsRepository();
  private readonly notif = new NotificationsService();
  private readonly audit = new AuditService();

  async getCatalogs() {
    return this.repo.getCatalogs();
  }

  async previewDestinatarios(filtros: FiltroNotificacion) {
    const usuarios = await this.repo.getDestinatarios(filtros);
    return { usuarios, total: usuarios.length };
  }

  async sendNotification(dto: SendNotificationDto, idAdmin: number, ip: string): Promise<SendResult> {
    const usuarios = await this.repo.getDestinatarios(dto.filtros);

    // Deduplicate by id_usuario
    const vistos = new Set<number>();
    const destinatarios = usuarios.filter((u) => {
      if (vistos.has(u.id_usuario)) return false;
      vistos.add(u.id_usuario);
      return true;
    });

    let enviados = 0;
    const errores: string[] = [];

    for (const dest of destinatarios) {
      try {
        await this.notif.sendAdminNotification(dest.correo_contacto, dto.asunto, dto.cuerpo);
        enviados++;
      } catch {
        errores.push(`No se pudo enviar a ${dest.correo_contacto}`);
      }
    }

    await this.audit.log({
      idUsuario: idAdmin,
      accion: 'ENVIAR_NOTIFICACION',
      modulo: 'admin/notifications',
      descripcion: `Comunicado enviado: "${dto.asunto}" a ${enviados} usuario(s) (filtro: ${dto.filtros.tipo})`,
      ipOrigen: ip,
      metadata: { enviados, errores: errores.length, filtros: dto.filtros },
    });

    return { enviados, errores };
  }
}
