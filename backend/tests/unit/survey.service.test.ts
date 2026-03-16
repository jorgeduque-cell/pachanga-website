import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prismaMock } from './setup.js';
import jwt from 'jsonwebtoken';
import { env } from '../../src/config/env.js';

const { SurveyService } = await import('../../src/modules/survey/survey.service.js');

describe('SurveyService', () => {
  let surveyService: InstanceType<typeof SurveyService>;

  beforeEach(() => {
    surveyService = new SurveyService();
  });

  // ─── generateSurveyToken ──────────────────────────────
  describe('generateSurveyToken', () => {
    it('should return a valid JWT with purpose=survey', () => {
      const token = surveyService.generateSurveyToken('cust-1');

      const decoded = jwt.verify(token, env.JWT_SECRET) as any;
      expect(decoded.customerId).toBe('cust-1');
      expect(decoded.purpose).toBe('survey');
      expect(decoded.iss).toBe('pachanga-survey');
    });
  });

  // ─── generateSurveyLink ───────────────────────────────
  describe('generateSurveyLink', () => {
    it('should return full URL with token', () => {
      const link = surveyService.generateSurveyLink('cust-1');

      expect(link).toContain(`${env.FRONTEND_URL}/encuesta?token=`);
      expect(link.length).toBeGreaterThan(50);
    });
  });

  // ─── verifyToken ───────────────────────────────────────
  describe('verifyToken', () => {
    it('should return valid=true with customer name', async () => {
      const token = surveyService.generateSurveyToken('cust-1');

      prismaMock.customer.findUnique.mockResolvedValue({
        name: 'Juan Pérez',
        isActive: true,
      } as any);

      const result = await surveyService.verifyToken(token);

      expect(result.valid).toBe(true);
      expect(result.customerName).toBe('Juan Pérez');
    });

    it('should return valid=false for expired token', async () => {
      // Create an already-expired token
      const token = jwt.sign(
        { customerId: 'cust-1', purpose: 'survey' },
        env.JWT_SECRET,
        { expiresIn: '0s', issuer: 'pachanga-survey' },
      );

      // Wait a moment for expiration
      await new Promise(r => setTimeout(r, 100));

      const result = await surveyService.verifyToken(token);

      expect(result.valid).toBe(false);
    });

    it('should return valid=false for wrong purpose', async () => {
      const token = jwt.sign(
        { customerId: 'cust-1', purpose: 'other' },
        env.JWT_SECRET,
        { issuer: 'pachanga-survey' },
      );

      const result = await surveyService.verifyToken(token);

      expect(result.valid).toBe(false);
    });

    it('should return valid=false for inactive customer', async () => {
      const token = surveyService.generateSurveyToken('cust-1');

      prismaMock.customer.findUnique.mockResolvedValue({
        name: 'Juan',
        isActive: false,
      } as any);

      const result = await surveyService.verifyToken(token);

      expect(result.valid).toBe(false);
    });
  });

  // ─── submitSurvey ─────────────────────────────────────
  describe('submitSurvey', () => {
    const ratings = {
      musicRating: 4,
      serviceRating: 5,
      ambienceRating: 3,
      hygieneRating: 4,
    };

    it('should create survey and interaction in transaction', async () => {
      const token = surveyService.generateSurveyToken('cust-1');

      prismaMock.customer.findUnique.mockResolvedValue({
        id: 'cust-1',
        isActive: true,
      } as any);

      prismaMock.interaction.findFirst.mockResolvedValue(null);

      // Mock transaction
      prismaMock.$transaction.mockImplementation(async (fn: any) => {
        return fn({
          satisfactionSurvey: { create: vi.fn() },
          interaction: { create: vi.fn() },
        });
      });

      await expect(surveyService.submitSurvey(token, ratings)).resolves.not.toThrow();
    });

    it('should throw 401 for invalid token', async () => {
      await expect(surveyService.submitSurvey('invalid-token', ratings))
        .rejects.toThrow('Token inválido o expirado');
    });
  });

  // ─── getAverages ───────────────────────────────────────
  describe('getAverages', () => {
    it('should calculate averages correctly', async () => {
      prismaMock.satisfactionSurvey.aggregate.mockResolvedValue({
        _avg: { musicRating: 4.0, serviceRating: 3.5, ambienceRating: 4.5, hygieneRating: 4.0 },
        _count: {},
        _sum: {},
        _min: {},
        _max: {},
      } as any);
      prismaMock.satisfactionSurvey.count.mockResolvedValue(10);

      const result = await surveyService.getAverages();

      expect(result.totalSurveys).toBe(10);
      expect(result.averages.music).toBe(4.0);
      expect(result.averages.service).toBe(3.5);
      expect(result.overallAverage).toBe(4.0);
    });
  });
});
