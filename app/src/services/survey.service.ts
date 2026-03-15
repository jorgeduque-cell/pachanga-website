import { apiClient } from '@/lib/api';

// ── Response / Payload types ──────────────────────────────────────────────

export interface SurveyVerifyResponse {
  valid: boolean;
  customerName: string;
}

export interface SurveySubmitPayload {
  token: string;
  musicRating: number;
  serviceRating: number;
  ambienceRating: number;
  hygieneRating: number;
}

export interface SurveySubmitResponse {
  success: boolean;
  message: string;
}

// ── Service ───────────────────────────────────────────────────────────────

export const surveyService = {
  async verifySurveyToken(token: string): Promise<SurveyVerifyResponse> {
    const response = await apiClient.get<SurveyVerifyResponse>(
      '/surveys/verify',
      { params: { token } },
    );
    return response.data;
  },

  async submitSurvey(data: SurveySubmitPayload): Promise<SurveySubmitResponse> {
    const response = await apiClient.post<SurveySubmitResponse>(
      '/surveys/submit',
      data,
    );
    return response.data;
  },
};
