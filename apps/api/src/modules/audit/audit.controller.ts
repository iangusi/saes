import { Request, Response } from 'express';
import { AuditRepository } from './audit.repository';
import { sendSuccess } from '../../common/utils/response';

const repo = new AuditRepository();

export async function getBitacora(req: Request, res: Response): Promise<void> {
  const limit = Math.min(parseInt(String(req.query.limit ?? '50')), 200);
  const offset = parseInt(String(req.query.offset ?? '0'));
  const modulo = req.query.modulo ? String(req.query.modulo) : undefined;

  const rows = await repo.findAll(limit, offset, modulo);
  sendSuccess(res, rows, 'Bitácora obtenida');
}
