import { api } from './api';
import { ApiResponse, StudentProfile, KardexResponse, ScheduleSlot, GradeRow, StudentAnnouncement } from '../types/api.types';

export const studentsService = {
  async getProfile() {
    const { data } = await api.get<ApiResponse<StudentProfile>>('/students/me');
    return data.data;
  },

  async getKardex() {
    const { data } = await api.get<ApiResponse<KardexResponse>>('/students/me/kardex');
    return data.data;
  },

  async getSchedule() {
    const { data } = await api.get<ApiResponse<{ horario: ScheduleSlot[]; porDia: Record<string, ScheduleSlot[]> }>>('/students/me/schedule');
    return data.data;
  },

  async getGrades() {
    const { data } = await api.get<ApiResponse<GradeRow[]>>('/students/me/grades');
    return data.data;
  },

  async getAnnouncements() {
    const { data } = await api.get<ApiResponse<StudentAnnouncement[]>>('/students/me/announcements');
    return data.data;
  },
};
