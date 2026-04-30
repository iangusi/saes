import { api } from './api';
import { ApiResponse } from '../types/api.types';

export const reenrollmentService = {
  async getStatus() {
    const { data } = await api.get<ApiResponse<unknown>>('/reenrollment/status');
    return data.data;
  },

  async getEligibility() {
    const { data } = await api.get<ApiResponse<unknown>>('/reenrollment/eligibility');
    return data.data;
  },

  async submit(grupos: number[]) {
    const { data } = await api.post<ApiResponse<{ gruposInscritos: number; creditosTotales: number }>>(
      '/reenrollment/submit',
      { grupos }
    );
    return data.data;
  },
};
