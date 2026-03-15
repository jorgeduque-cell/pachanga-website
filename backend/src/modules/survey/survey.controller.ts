import { Request, Response } from 'express';
import { surveyService } from './survey.service.js';
import { asyncHandler } from '../../middleware/async-handler.js';
import { validatedQuery, validatedBody } from '../../middleware/validate.middleware.js';
import type {
    SurveyTokenQuery,
    SubmitSurveyInput,
    GenerateSurveyLinkInput,
    SurveyFilters,
} from '../../schemas/survey.schema.js';

// ─── Controller ─────────────────────────────────────────────
export class SurveyController {

    /**
     * Public: Verify a survey token and return customer name.
     * GET /api/surveys/verify?token=X
     */
    verify = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const { token } = validatedQuery<SurveyTokenQuery>(req);
        const result = await surveyService.verifyToken(token);
        res.json(result);
    });

    /**
     * Public: Submit a satisfaction survey.
     * POST /api/surveys/submit
     */
    submit = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const { token, ...ratings } = validatedBody<SubmitSurveyInput>(req);
        await surveyService.submitSurvey(token, ratings);
        res.status(201).json({
            success: true,
            message: '¡Gracias por tu opinión!',
        });
    });

    /**
     * Admin: Generate a survey link for a customer.
     * POST /api/surveys/generate-link
     */
    generateLink = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const { customerId } = validatedBody<GenerateSurveyLinkInput>(req);
        const url = surveyService.generateSurveyLink(customerId);
        res.json({ url });
    });

    /**
     * Admin: List all surveys (paginated).
     * GET /api/surveys
     */
    getAll = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const filters = validatedQuery<SurveyFilters>(req);
        const result = await surveyService.findAll(filters);
        res.json(result);
    });

    /**
     * Admin: Get survey statistics (averages per category).
     * GET /api/surveys/stats
     */
    getStats = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
        const stats = await surveyService.getAverages();
        res.json({ data: stats });
    });
}

export const surveyController = new SurveyController();
