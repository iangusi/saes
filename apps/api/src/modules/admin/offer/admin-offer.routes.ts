import { Router } from 'express';
import { authMiddleware, requireRole } from '../../../common/middlewares/auth.middleware';
import {
  getDepartamentos,
  getCarreras, createCarrera, updateCarrera, deleteCarrera,
  getPlanes, getPlanDetalle, createPlan, updatePlan, deletePlan,
  addMateriaAlPlan, removeMateriaDelPlan,
  getMaterias, getMateriasList, createMateria, updateMateria, deleteMateria,
  getPrerrequisitos, addPrerrequisito, removePrerrequisito,
  getAulas, getProfesores,
  getGrupos, createGrupo, updateGrupo, deleteGrupo,
  getHorarios, createHorario, updateHorario, deleteHorario,
} from './admin-offer.controller';

export const adminOfferRoutes = Router();

adminOfferRoutes.use(authMiddleware, requireRole('admin'));

// Referencia
adminOfferRoutes.get('/departamentos', getDepartamentos);
adminOfferRoutes.get('/aulas', getAulas);
adminOfferRoutes.get('/profesores', getProfesores);

// Carreras
adminOfferRoutes.get('/carreras', getCarreras);
adminOfferRoutes.post('/carreras', createCarrera);
adminOfferRoutes.put('/carreras/:id', updateCarrera);
adminOfferRoutes.delete('/carreras/:id', deleteCarrera);

// Planes de estudio
adminOfferRoutes.get('/planes', getPlanes);
adminOfferRoutes.post('/planes', createPlan);
adminOfferRoutes.get('/planes/:id', getPlanDetalle);
adminOfferRoutes.put('/planes/:id', updatePlan);
adminOfferRoutes.delete('/planes/:id', deletePlan);
adminOfferRoutes.post('/planes/:id/materias', addMateriaAlPlan);
adminOfferRoutes.delete('/planes/:id/materias/:idMateria', removeMateriaDelPlan);

// Materias
adminOfferRoutes.get('/materias', getMaterias);
adminOfferRoutes.get('/materias/list', getMateriasList);
adminOfferRoutes.post('/materias', createMateria);
adminOfferRoutes.put('/materias/:id', updateMateria);
adminOfferRoutes.delete('/materias/:id', deleteMateria);
adminOfferRoutes.get('/materias/:id/prerrequisitos', getPrerrequisitos);
adminOfferRoutes.post('/materias/:id/prerrequisitos', addPrerrequisito);
adminOfferRoutes.delete('/materias/:id/prerrequisitos/:idPre', removePrerrequisito);

// Grupos
adminOfferRoutes.get('/grupos', getGrupos);
adminOfferRoutes.post('/grupos', createGrupo);
adminOfferRoutes.put('/grupos/:id', updateGrupo);
adminOfferRoutes.delete('/grupos/:id', deleteGrupo);

// Horarios
adminOfferRoutes.get('/grupos/:idGrupo/horarios', getHorarios);
adminOfferRoutes.post('/grupos/:idGrupo/horarios', createHorario);
adminOfferRoutes.put('/grupos/:idGrupo/horarios/:idHorario', updateHorario);
adminOfferRoutes.delete('/grupos/:idGrupo/horarios/:idHorario', deleteHorario);
