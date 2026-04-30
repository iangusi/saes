import { api } from './api';
import { ApiResponse } from '../types/api.types';

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    identificador: string;
    nombre: string;
    apellidoPaterno: string;
    apellidoMaterno: string | null;
    correo: string;
    roles: string[];
  };
}

export const authService = {
  async login(identificador: string, password: string) {
    const { data } = await api.post<ApiResponse<LoginResponse>>('/auth/login', {
      identificador,
      password,
    });
    return data.data;
  },

  async forgotPassword(correo: string) {
    await api.post('/auth/forgot-password', { correo });
  },

  async resetPassword(token: string, password: string) {
    await api.post('/auth/reset-password', { token, password });
  },

  async logout() {
    await api.post('/auth/logout');
  },
};
