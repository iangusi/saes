import { api } from './api';
import { ApiResponse, TeacherProfile, TeacherSchedule, StudentFromGroup, TeacherGradeRecord, TeacherAnnouncement } from '../types/api.types';

export const teachersService = {
  async getProfile() {
    const { data } = await api.get<ApiResponse<TeacherProfile>>('/teachers/me');
    return data.data;
  },

  async getSchedule() {
    const { data } = await api.get<ApiResponse<TeacherSchedule>>('/teachers/me/schedule');
    return data.data;
  },

  async getGroupStudents(groupId: number) {
    const { data } = await api.get<ApiResponse<StudentFromGroup[]>>(`/teachers/groups/${groupId}/students`);
    return data.data;
  },

  async getGroupGrades(groupId: number) {
    const { data } = await api.get<ApiResponse<TeacherGradeRecord[]>>(`/teachers/groups/${groupId}/grades`);
    return data.data;
  },

  async recordAttendance(idGrupo: number, fecha: string, asistencias: Array<{ idAlumno: number; presente: boolean; justificada?: boolean }>) {
    const { data } = await api.post<ApiResponse>('/teachers/attendance', {
      idGrupo,
      fecha,
      asistencias,
    });
    return data.data;
  },

  async updateGrade(idInscripcion: number, idGrupoEvaluacion: number, calificacion: number) {
    const { data } = await api.put<ApiResponse>('/teachers/grades', {
      idInscripcion,
      idGrupoEvaluacion,
      calificacion,
    });
    return data.data;
  },

  async createAnnouncement(idGrupo: number, titulo: string, contenido: string) {
    const { data } = await api.post<ApiResponse<{ id: number }>>('/teachers/announcements', {
      idGrupo,
      titulo,
      contenido,
    });
    return data.data;
  },

  async getGroupAnnouncements(groupId: number) {
    const { data } = await api.get<ApiResponse<TeacherAnnouncement[]>>(`/teachers/groups/${groupId}/announcements`);
    return data.data;
  },
};
