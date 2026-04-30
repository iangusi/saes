import { api } from './api';
import { ApiResponse, OfferGroup } from '../types/api.types';

export const offerService = {
  async getOffer(periodo?: number) {
    const params = periodo ? { periodo } : {};
    const { data } = await api.get<ApiResponse<OfferGroup[]>>('/offer', { params });
    return data.data;
  },
};
