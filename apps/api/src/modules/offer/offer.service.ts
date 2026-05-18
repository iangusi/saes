import { OfferRepository } from './offer.repository';

export class OfferService {
  private readonly repo = new OfferRepository();

  async getOffer(idPeriodo?: number) {
    const rows = await this.repo.getOffer(idPeriodo);

    return rows.map((r) => ({
      idGrupo: r.id_grupo,
      claveGrupo: r.clave_grupo,
      materia: {
        id: r.id_materia,
        clave: r.clave_materia,
        nombre: r.nombre_materia,
        creditos: r.creditos,
        semestre: r.semestre ?? undefined,
        carreras: r.carreras ? r.carreras.split(',') : [],
      },
      cupoMax: r.cupo_max,
      cupoActual: r.cupo_actual,
      cupoDisponible: r.cupo_disponible,
      estatus: r.estatus_grupo,
      profesor: `${r.nombre_profesor} ${r.apellido_paterno_profesor}`,
      horarios: r.horarios
        ? r.horarios.split(';').map((h) => {
            const [dia, inicio, fin, aula] = h.split('|');
            return { dia, inicio, fin, aula };
          })
        : [],
    }));
  }
}
