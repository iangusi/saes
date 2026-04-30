import { Router } from 'express';
import { getOffer } from './offer.controller';
import { authMiddleware } from '../../common/middlewares/auth.middleware';

export const offerRoutes = Router();

offerRoutes.get('/', authMiddleware, getOffer);
