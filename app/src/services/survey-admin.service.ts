import { apiClient } from '@/lib/api';

// ─── Types ───────────────────────────────────────────────────
export interface SurveyStatsResponse {
  data: {
    totalSurveys: number;
    averages: {
      music: number;
      service: number;
      ambience: number;
      hygiene: number;
    };
    overallAverage: number;
  };
}

export interface SurveyItem {
  id: string;
  customerId: string;
  musicRating: number;
  serviceRating: number;
  ambienceRating: number;
  hygieneRating: number;
  qrTable: string | null;
  comments: string | null;
  createdAt: string;
  customer: {
    name: string;
    phone: string;
  };
}

export interface SurveyListResponse {
  data: SurveyItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ─── Service ─────────────────────────────────────────────────
export const surveyAdminService = {
  async getStats(): Promise<SurveyStatsResponse> {
    const response = await apiClient.get<SurveyStatsResponse>('/surveys/stats');
    return response.data;
  },

  async getSurveys(page = 1, limit = 20): Promise<SurveyListResponse> {
    const response = await apiClient.get<SurveyListResponse>('/surveys', {
      params: { page, limit },
    });
    return response.data;
  },

  async triggerSend(): Promise<{ success: boolean; message: string; data: { found: number; sent: number; skipped: number; failed: number } }> {
    const response = await apiClient.post('/surveys/trigger-send');
    return response.data;
  },
};
