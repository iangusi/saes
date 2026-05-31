// apps/api/src/modules/chatbot/chatbot.routes.ts
import { Router } from 'express';
import { ChatbotController } from './chatbot.controller';
import { authMiddleware } from '../../common/middlewares/auth.middleware';

const router = Router();
const ctrl = new ChatbotController();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Gestión de conversaciones
router.post('/conversaciones', (req, res) => ctrl.crearConversacion(req, res));
router.get('/conversaciones', (req, res) => ctrl.listarConversaciones(req, res));
router.delete('/conversaciones/:id', (req, res) => ctrl.eliminarConversacion(req, res));
router.get('/conversaciones/:id/historial', (req, res) => ctrl.obtenerHistorial(req, res));

// Mensajes
router.post('/conversaciones/:id/mensajes', (req, res) => ctrl.enviarMensaje(req, res));

export { router as chatbotRoutes };
