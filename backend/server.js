/**
 * StyleMe Backend Server
 * Node.js + Express + Replicate (nano-banana)
 */

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const sharp = require('sharp');
const Replicate = require('replicate');
const config = require('./config');

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
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Разрешены только изображения'), false);
    }
  },
});

// ============================================
// КАТАЛОГ ПРИЧЕСОК
// ============================================

const HAIRSTYLES = {
  1: { 
    name: 'Классическое каре', 
    prompt: 'Change the hairstyle to a classic bob haircut, sleek and straight, chin length. Keep the face exactly the same, only change the hair.' 
  },
  2: { 
    name: 'Пикси', 
    prompt: 'Change the hairstyle to a pixie cut, short and textured, modern edgy look. Keep the face exactly the same, only change the hair.' 
  },
  3: { 
    name: 'Голливудские локоны', 
    prompt: 'Change the hairstyle to glamorous hollywood waves, big voluminous curls, long flowing hair. Keep the face exactly the same, only change the hair.' 
  },
  4: { 
    name: 'Небрежный пучок', 
    prompt: 'Change the hairstyle to a messy bun, relaxed updo style, effortless chic look. Keep the face exactly the same, only change the hair.' 
  },
  5: { 
    name: 'Французская коса', 
    prompt: 'Change the hairstyle to a french braid, elegant braided hair style. Keep the face exactly the same, only change the hair.' 
  },
  6: { 
    name: 'Шэг', 
    prompt: 'Change the hairstyle to a shag cut, layered and textured, 70s rock style with modern touch. Keep the face exactly the same, only change the hair.' 
  },
  7: { 
    name: 'Удлинённый боб', 
    prompt: 'Change the hairstyle to a long bob (lob), shoulder length, sleek and shiny. Keep the face exactly the same, only change the hair.' 
  },
  8: { 
    name: 'Кудри афро', 
    prompt: 'Change the hairstyle to natural afro curls, voluminous bouncy curly hair. Keep the face exactly the same, only change the hair.' 
  },
  9: { 
    name: 'Прямые длинные', 
    prompt: 'Change the hairstyle to long straight silky hair, smooth and glossy, flowing down. Keep the face exactly the same, only change the hair.' 
  },
  10: { 
    name: 'Мужской фейд', 
    prompt: 'Change the hairstyle to a modern fade haircut, clean shaved sides, textured top. Keep the face exactly the same, only change the hair.' 
  },
};

// ============================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================

/**
 * Оптимизация изображения
 */
async function optimizeImage(buffer) {
  return sharp(buffer)
    .rotate() // Автоматически поворачивает по EXIF ориентации
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
function toDataUrl(buffer, mimeType = 'image/jpeg') {
  return `data:${mimeType};base64,${buffer.toString('base64')}`;
}

/**
 * Декодирование base64
 */
function fromBase64(base64String) {
  const data = base64String.replace(/^data:image\/\w+;base64,/, '');
  return Buffer.from(data, 'base64');
}

/**
 * Вызов nano-banana через Replicate
 */
async function transformWithNanoBanana(imageDataUrl, prompt) {
  console.log('[nano-banana] Starting generation...');
  console.log('[nano-banana] Prompt:', prompt);
  
  const input = {
    prompt: prompt,
    image_input: [imageDataUrl],
  };

  const output = await replicate.run(config.replicate.model, { input });
  
  // output может быть FileOutput объектом
  if (output && typeof output.url === 'function') {
    return output.url();
  }
  
  // Или напрямую URL
  if (typeof output === 'string') {
    return output;
  }
  
  // Или массив
  if (Array.isArray(output) && output.length > 0) {
    const first = output[0];
    if (typeof first === 'string') return first;
    if (first && typeof first.url === 'function') return first.url();
  }
  
  throw new Error('Unexpected output format from nano-banana');
}

// ============================================
// API ROUTES
// ============================================

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    model: config.replicate.model,
  });
});

// Список причесок
app.get('/api/hairstyles', (req, res) => {
  const styles = Object.entries(HAIRSTYLES).map(([id, data]) => ({
    id: parseInt(id),
    name: data.name,
  }));
  res.json({ success: true, data: styles });
});

// Трансформация прически
app.post('/api/transform', upload.single('image'), async (req, res) => {
  const startTime = Date.now();

  try {
    // Проверка API токена
    if (!config.replicate.apiToken) {
      return res.status(500).json({ 
        success: false, 
        error: 'REPLICATE_API_TOKEN не настроен на сервере' 
      });
    }

    // Получаем изображение
    let imageBuffer;
    if (req.file) {
      imageBuffer = req.file.buffer;
    } else if (req.body.image) {
      imageBuffer = fromBase64(req.body.image);
    } else {
      return res.status(400).json({ success: false, error: 'Изображение не предоставлено' });
    }

    // Валидация стиля
    const styleId = parseInt(req.body.styleId);
    if (!HAIRSTYLES[styleId]) {
      return res.status(400).json({ success: false, error: 'Неверный ID прически' });
    }

    console.log(`[Transform] Style: ${HAIRSTYLES[styleId].name}`);

    // Оптимизируем изображение
    const optimizedBuffer = await optimizeImage(imageBuffer);
    const imageDataUrl = toDataUrl(optimizedBuffer);

    // Вызываем nano-banana
    const prompt = HAIRSTYLES[styleId].prompt;
    const resultImageUrl = await transformWithNanoBanana(imageDataUrl, prompt);

    const processingTime = Date.now() - startTime;
    console.log(`[Transform] Done in ${processingTime}ms`);
    console.log(`[Transform] Result URL: ${resultImageUrl}`);

    res.json({
      success: true,
      data: {
        resultImage: resultImageUrl,
        style: HAIRSTYLES[styleId].name,
        processingTime,
      },
    });
  } catch (error) {
    console.error('[Transform] Error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Ошибка обработки',
    });
  }
});

// Трансформация с кастомным промптом
app.post('/api/transform/custom', upload.single('image'), async (req, res) => {
  try {
    if (!config.replicate.apiToken) {
      return res.status(500).json({ 
        success: false, 
        error: 'REPLICATE_API_TOKEN не настроен' 
      });
    }

    let imageBuffer;
    if (req.file) {
      imageBuffer = req.file.buffer;
    } else if (req.body.image) {
      imageBuffer = fromBase64(req.body.image);
    } else {
      return res.status(400).json({ success: false, error: 'Изображение не предоставлено' });
    }

    const customPrompt = req.body.prompt;
    if (!customPrompt) {
      return res.status(400).json({ success: false, error: 'Промпт не указан' });
    }

    const optimizedBuffer = await optimizeImage(imageBuffer);
    const imageDataUrl = toDataUrl(optimizedBuffer);
    const resultImageUrl = await transformWithNanoBanana(imageDataUrl, customPrompt);

    res.json({
      success: true,
      data: { resultImage: resultImageUrl },
    });
  } catch (error) {
    console.error('[Custom Transform] Error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Ошибка обработки',
    });
  }
});

// ============================================
// ERROR HANDLING
// ============================================

app.use((error, req, res, next) => {
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
  console.log(`
╔═══════════════════════════════════════════╗
║        StyleMe Backend Server v1.0        ║
╠═══════════════════════════════════════════╣
║  Port:     ${String(config.port).padEnd(29)}║
║  Mode:     ${config.nodeEnv.padEnd(29)}║
║  Model:    ${config.replicate.model.padEnd(29)}║
║  API Key:  ${config.replicate.apiToken ? '✓ Configured' : '✗ MISSING'}                   ║
╚═══════════════════════════════════════════╝
  `);
});

module.exports = app;
