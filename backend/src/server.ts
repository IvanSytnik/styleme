/**
 * StyleMe Backend Server
 * Node.js + Express + TypeScript + Replicate (nano-banana)
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import multer from 'multer';
import sharp from 'sharp';
import Replicate from 'replicate';

import config from './config';
import { HAIRSTYLES } from './hairstyles';
import {
  ApiResponse,
  TransformResult,
  HairstyleListItem,
  HealthCheckResponse,
  TransformRequestBody,
  CustomTransformRequestBody,
  ReferenceTransformRequestBody,
} from './types';

const app = express();

// Инициализация Replicate
const replicate = new Replicate({
  auth: config.replicate.apiToken,
});

// ============================================
// MIDDLEWARE
// ============================================

app.use(cors({
  origin: config.frontendUrl,
  methods: ['GET', 'POST'],
  credentials: true,
}));

app.use(express.json({ limit: '50mb' }));

// Multer для загрузки файлов
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: config.limits.maxFileSize },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Разрешены только изображения'));
    }
  },
});

// ============================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================

/**
 * Оптимизация изображения
 */
async function optimizeImage(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .rotate() // Автоповорот по EXIF
    .resize(config.limits.maxImageDimension, config.limits.maxImageDimension, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .jpeg({ quality: 90 })
    .toBuffer();
}

/**
 * Конвертация в data URL (base64)
 */
function toDataUrl(buffer: Buffer, mimeType: string = 'image/jpeg'): string {
  return `data:${mimeType};base64,${buffer.toString('base64')}`;
}

/**
 * Декодирование base64
 */
function fromBase64(base64String: string): Buffer {
  const data = base64String.replace(/^data:image\/\w+;base64,/, '');
  return Buffer.from(data, 'base64');
}

/**
 * Извлечение URL из результата Replicate
 */
function extractResultUrl(output: unknown): string {
  if (output && typeof output === 'object' && 'url' in output && typeof (output as { url: () => string }).url === 'function') {
    return (output as { url: () => string }).url();
  }
  
  if (typeof output === 'string') {
    return output;
  }
  
  if (Array.isArray(output) && output.length > 0) {
    const first = output[0];
    if (typeof first === 'string') return first;
    if (first && typeof first === 'object' && 'url' in first && typeof (first as { url: () => string }).url === 'function') {
      return (first as { url: () => string }).url();
    }
  }
  
  throw new Error('Unexpected output format from nano-banana');
}

/**
 * Вызов nano-banana через Replicate
 */
async function transformWithNanoBanana(imageDataUrl: string, prompt: string): Promise<string> {
  console.log('[nano-banana] Starting generation...');
  console.log('[nano-banana] Prompt:', prompt.substring(0, 100) + '...');
  
  const input = {
    prompt: prompt,
    image_input: [imageDataUrl],
  };

  const output = await replicate.run(config.replicate.model as `${string}/${string}`, { input });
  return extractResultUrl(output);
}

/**
 * Вызов nano-banana с референсом
 */
async function transformWithReference(
  mainImageDataUrl: string, 
  referenceImageDataUrl: string, 
  prompt: string
): Promise<string> {
  console.log('[nano-banana] Starting reference generation...');
  
  const input = {
    prompt: prompt,
    image_input: [mainImageDataUrl, referenceImageDataUrl],
  };

  const output = await replicate.run(config.replicate.model as `${string}/${string}`, { input });
  return extractResultUrl(output);
}

// ============================================
// API ROUTES
// ============================================

// Health check
app.get('/health', (_req: Request, res: Response<HealthCheckResponse>) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    model: config.replicate.model,
    totalStyles: Object.keys(HAIRSTYLES).length,
  });
});

// Список всех причесок
app.get('/api/hairstyles', (_req: Request, res: Response<ApiResponse<HairstyleListItem[]>>) => {
  const styles: HairstyleListItem[] = Object.entries(HAIRSTYLES).map(([id, data]) => ({
    id: parseInt(id, 10),
    name: data.name,
    gender: data.gender,
  }));
  res.json({ success: true, data: styles });
});

// Список мужских причесок
app.get('/api/hairstyles/male', (_req: Request, res: Response<ApiResponse<HairstyleListItem[]>>) => {
  const styles: HairstyleListItem[] = Object.entries(HAIRSTYLES)
    .filter(([_, data]) => data.gender === 'male')
    .map(([id, data]) => ({
      id: parseInt(id, 10),
      name: data.name,
    }));
  res.json({ success: true, data: styles });
});

// Список женских причесок
app.get('/api/hairstyles/female', (_req: Request, res: Response<ApiResponse<HairstyleListItem[]>>) => {
  const styles: HairstyleListItem[] = Object.entries(HAIRSTYLES)
    .filter(([_, data]) => data.gender === 'female')
    .map(([id, data]) => ({
      id: parseInt(id, 10),
      name: data.name,
    }));
  res.json({ success: true, data: styles });
});

// Трансформация прически по ID
app.post('/api/transform', upload.single('image'), async (
  req: Request<{}, ApiResponse<TransformResult>, TransformRequestBody>,
  res: Response<ApiResponse<TransformResult>>
) => {
  const startTime = Date.now();

  try {
    if (!config.replicate.apiToken) {
      res.status(500).json({ 
        success: false, 
        error: 'REPLICATE_API_TOKEN не настроен на сервере' 
      });
      return;
    }

    // Получаем изображение
    let imageBuffer: Buffer;
    if (req.file) {
      imageBuffer = req.file.buffer;
    } else if (req.body.image) {
      imageBuffer = fromBase64(req.body.image);
    } else {
      res.status(400).json({ success: false, error: 'Изображение не предоставлено' });
      return;
    }

    // Валидация стиля
    const styleId = req.body.styleId;
    if (!styleId || !HAIRSTYLES[styleId]) {
      res.status(400).json({ success: false, error: 'Неверный ID прически' });
      return;
    }

    console.log(`[Transform] Style: ${HAIRSTYLES[styleId].name}`);

    const optimizedBuffer = await optimizeImage(imageBuffer);
    const imageDataUrl = toDataUrl(optimizedBuffer);

    const prompt = HAIRSTYLES[styleId].prompt;
    const resultImageUrl = await transformWithNanoBanana(imageDataUrl, prompt);

    const processingTime = Date.now() - startTime;
    console.log(`[Transform] Done in ${processingTime}ms`);

    res.json({
      success: true,
      data: {
        resultImage: resultImageUrl,
        style: HAIRSTYLES[styleId].name,
        processingTime,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Ошибка обработки';
    console.error('[Transform] Error:', errorMessage);
    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
});

// Трансформация с кастомным названием прически
app.post('/api/transform/custom', upload.single('image'), async (
  req: Request<{}, ApiResponse<TransformResult>, CustomTransformRequestBody>,
  res: Response<ApiResponse<TransformResult>>
) => {
  const startTime = Date.now();

  try {
    if (!config.replicate.apiToken) {
      res.status(500).json({ 
        success: false, 
        error: 'REPLICATE_API_TOKEN не настроен' 
      });
      return;
    }

    // Получаем изображение
    let imageBuffer: Buffer;
    if (req.file) {
      imageBuffer = req.file.buffer;
    } else if (req.body.image) {
      imageBuffer = fromBase64(req.body.image);
    } else {
      res.status(400).json({ success: false, error: 'Изображение не предоставлено' });
      return;
    }

    const customHairstyle = req.body.hairstyle || req.body.prompt;
    if (!customHairstyle) {
      res.status(400).json({ success: false, error: 'Название прически не указано' });
      return;
    }

    console.log(`[Custom Transform] Hairstyle: ${customHairstyle}`);

    const optimizedBuffer = await optimizeImage(imageBuffer);
    const imageDataUrl = toDataUrl(optimizedBuffer);
    
    const prompt = `Change the hairstyle to ${customHairstyle}. Keep the face exactly the same, only change the hair. Make it look natural and photorealistic.`;
    
    const resultImageUrl = await transformWithNanoBanana(imageDataUrl, prompt);

    const processingTime = Date.now() - startTime;
    console.log(`[Custom Transform] Done in ${processingTime}ms`);

    res.json({
      success: true,
      data: { 
        resultImage: resultImageUrl,
        style: customHairstyle,
        processingTime,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Ошибка обработки';
    console.error('[Custom Transform] Error:', errorMessage);
    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
});

// Трансформация с фото-референсом прически
app.post('/api/transform/reference', async (
  req: Request<{}, ApiResponse<TransformResult>, ReferenceTransformRequestBody>,
  res: Response<ApiResponse<TransformResult>>
) => {
  const startTime = Date.now();

  try {
    if (!config.replicate.apiToken) {
      res.status(500).json({ 
        success: false, 
        error: 'REPLICATE_API_TOKEN не настроен' 
      });
      return;
    }

    // Получаем основное фото
    if (!req.body.image) {
      res.status(400).json({ success: false, error: 'Основное фото не предоставлено' });
      return;
    }
    const mainImageBuffer = fromBase64(req.body.image);

    // Получаем фото-референс прически
    if (!req.body.reference) {
      res.status(400).json({ success: false, error: 'Фото с прической не предоставлено' });
      return;
    }
    const referenceImageBuffer = fromBase64(req.body.reference);

    console.log('[Reference Transform] Processing with reference image...');

    // Оптимизируем оба изображения
    const mainOptimized = await optimizeImage(mainImageBuffer);
    const referenceOptimized = await optimizeImage(referenceImageBuffer);
    
    const mainDataUrl = toDataUrl(mainOptimized);
    const referenceDataUrl = toDataUrl(referenceOptimized);

    const prompt = `Copy the exact hairstyle from the second image and apply it to the person in the first image. Keep the face of the first person exactly the same, only change their hair to match the hairstyle, color, and style in the second image. Make it look natural and photorealistic.`;

    const resultImageUrl = await transformWithReference(mainDataUrl, referenceDataUrl, prompt);

    const processingTime = Date.now() - startTime;
    console.log(`[Reference Transform] Done in ${processingTime}ms`);

    res.json({
      success: true,
      data: {
        resultImage: resultImageUrl,
        style: 'Прическа с фото',
        processingTime,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Ошибка обработки';
    console.error('[Reference Transform] Error:', errorMessage);
    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
});

// ============================================
// ERROR HANDLING
// ============================================

app.use((error: Error, _req: Request, res: Response<ApiResponse>, _next: NextFunction) => {
  console.error('[Server Error]:', error);
  res.status(500).json({
    success: false,
    error: error.message || 'Внутренняя ошибка сервера',
  });
});

// ============================================
// START SERVER
// ============================================

app.listen(config.port, () => {
  const femaleCount = Object.values(HAIRSTYLES).filter(h => h.gender === 'female').length;
  const maleCount = Object.values(HAIRSTYLES).filter(h => h.gender === 'male').length;
  
  console.log(`
╔═══════════════════════════════════════════╗
║     StyleMe Backend Server v2.0 (TS)      ║
╠═══════════════════════════════════════════╣
║  Port:     ${String(config.port).padEnd(29)}║
║  Mode:     ${config.nodeEnv.padEnd(29)}║
║  Model:    ${config.replicate.model.padEnd(29)}║
║  Styles:   ${String(femaleCount + maleCount).padEnd(29)}║
║   - Female: ${String(femaleCount).padEnd(27)}║
║   - Male:   ${String(maleCount).padEnd(27)}║
║  API Key:  ${config.replicate.apiToken ? '✓ Configured' : '✗ MISSING'}                   ║
╚═══════════════════════════════════════════╝
  `);
});

export default app;
