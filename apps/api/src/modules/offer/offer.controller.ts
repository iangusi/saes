import { Request, Response } from 'express';
import { OfferService } from './offer.service';
import { sendSuccess } from '../../common/utils/response';

const service = new OfferService();

export async function getOffer(req: Request, res: Response): Promise<void> {
  const idPeriodo = req.query.periodo ? parseInt(String(req.query.periodo)) : undefined;
  const result = await service.getOffer(idPeriodo);
  sendSuccess(res, result);
}
