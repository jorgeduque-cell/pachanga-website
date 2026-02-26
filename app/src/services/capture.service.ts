import { apiClient } from '@/lib/api';

export interface CaptureInput {
  name: string;
  phone: string;
  birthDate: string;
  rating: number;
  qrTable?: string;
  optIn?: boolean;
}

export interface CaptureResponse {
  success: boolean;
  message: string;
}

export const captureService = {
  async capture(data: CaptureInput): Promise<CaptureResponse> {
    const response = await apiClient.post<CaptureResponse>('/crm/capture', data);
    return response.data;
  },
};
