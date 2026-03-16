import QRCode from 'qrcode';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';
import { env } from '../../config/env.js';

// ─── Constants ───────────────────────────────────────────────
const BASE_URL = env.FRONTEND_URL;

const QR_STYLE = {
  width: 500,
  margin: 2,
  color: { dark: '#1a1a2e', light: '#ffffff' },
  errorCorrectionLevel: 'H' as const,
};

// ─── Types ───────────────────────────────────────────────────
interface QRResult { tableName: string; qrBase64: string; }

// ─── Service ─────────────────────────────────────────────────
export class QrService {
  async generateForTable(tableName: string): Promise<Buffer> {
    const table = await prisma.table.findFirst({ where: { name: tableName } });
    if (!table) throw new AppError('Mesa no encontrada', 404);

    return QRCode.toBuffer(this.buildQrUrl(tableName), { ...QR_STYLE });
  }

  async generateBatch(): Promise<QRResult[]> {
    const tables = await prisma.table.findMany({
      orderBy: { name: 'asc' },
      select: { name: true },
    });

    return Promise.all(
      tables.map(async (table) => {
        const dataUrl = await QRCode.toDataURL(this.buildQrUrl(table.name), { ...QR_STYLE });
        return { tableName: table.name, qrBase64: dataUrl };
      }),
    );
  }

  private buildQrUrl(tableName: string): string {
    return `${BASE_URL}/qr?table=${encodeURIComponent(tableName)}`;
  }
}

export const qrService = new QrService();

