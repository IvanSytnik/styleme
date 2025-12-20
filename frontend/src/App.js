import React, { useState, useRef } from 'react';
import { transformHairstyle } from './api';
import './App.css';

// Каталог причесок
const HAIRSTYLES = [
  { id: 1, name: 'Классическое каре', emoji: '💇‍♀️', category: 'Короткие' },
  { id: 2, name: 'Пикси', emoji: '✨', category: 'Короткие' },
  { id: 3, name: 'Голливудские локоны', emoji: '🌟', category: 'Длинные' },
  { id: 4, name: 'Небрежный пучок', emoji: '🎀', category: 'Собранные' },
  { id: 5, name: 'Французская коса', emoji: '🥐', category: 'Собранные' },
  { id: 6, name: 'Шэг', emoji: '🔥', category: 'Средние' },
  { id: 7, name: 'Удлинённый боб', emoji: '💎', category: 'Средние' },
  { id: 8, name: 'Кудри афро', emoji: '🌀', category: 'Кудри' },
  { id: 9, name: 'Прямые длинные', emoji: '🌊', category: 'Длинные' },
  { id: 10, name: 'Мужской фейд', emoji: '💈', category: 'Мужские' },
];

const CATEGORIES = ['Все', 'Короткие', 'Средние', 'Длинные', 'Собранные', 'Кудри', 'Мужские'];

function App() {
  const [screen, setScreen] = useState('upload');
  const [uploadedImage, setUploadedImage] = useState(null);
  const [selectedStyle, setSelectedStyle] = useState(null);
  const [resultImage, setResultImage] = useState(null);
  const [activeCategory, setActiveCategory] = useState('Все');
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);

  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Загрузка файла
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('Файл слишком большой. Максимум 10MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImage(event.target.result);
        setError(null);
        setScreen('select');
      };
      reader.readAsDataURL(file);
    }
  };

  // Запуск камеры
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
      });
      setCameraStream(stream);
      setIsCapturing(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setError('Не удалось получить доступ к камере');
    }
  };

  // Съёмка фото
  const capturePhoto = () => {
    if (canvasRef.current && videoRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0);
      const imageData = canvas.toDataURL('image/jpeg', 0.9);
      setUploadedImage(imageData);
      stopCamera();
      setScreen('select');
    }
  };

  // Остановка камеры
  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setIsCapturing(false);
  };

  // Отправка на обработку
  const processImage = async () => {
    setScreen('processing');
    setError(null);
    setProgress(0);

    // Анимация прогресса
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + Math.random() * 15;
      });
    }, 500);

    try {
      const result = await transformHairstyle(uploadedImage, selectedStyle.id);

      clearInterval(progressInterval);
      setProgress(100);

      if (result.success && result.data?.resultImage) {
        setResultImage(result.data.resultImage);
        setScreen('result');
      } else {
        throw new Error('Не удалось получить результат');
      }
    } catch (err) {
      clearInterval(progressInterval);
      setError(err.message || 'Ошибка при обработке');
      setScreen('select');
    }
  };

  // Сброс
  const reset = () => {
    setUploadedImage(null);
    setSelectedStyle(null);
    setResultImage(null);
    setScreen('upload');
    setError(null);
    setProgress(0);
    stopCamera();
  };

  // Сохранение результата
  const saveResult = () => {
    const link = document.createElement('a');
    link.download = `styleme-${selectedStyle.name}.jpg`;
    link.href = resultImage;
    link.click();
  };

  // Шаринг
  const shareResult = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Мой новый образ от StyleMe',
        text: `Примерил прическу "${selectedStyle.name}"`,
      });
    }
  };

  // Фильтрация причесок
  const filteredStyles =
    activeCategory === 'Все'
      ? HAIRSTYLES
      : HAIRSTYLES.filter((s) => s.category === activeCategory);

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <button onClick={reset} className="logo">
            <div className="logo-icon">✂️</div>
            <span className="logo-text">StyleMe</span>
          </button>
          {screen !== 'upload' && (
            <button onClick={reset} className="reset-btn">
              Начать заново
            </button>
          )}
        </div>
      </header>

      <main className="main">
        {/* Ошибка */}
        {error && <div className="error-message">⚠️ {error}</div>}

        {/* Экран загрузки */}
        {screen === 'upload' && (
          <div className="screen upload-screen">
            <div className="hero">
              <h1>
                Найди свой <span className="gradient-text">идеальный стиль</span>
              </h1>
              <p>Загрузи фото и примерь топ-10 причесок с помощью AI</p>
            </div>

            {!isCapturing ? (
              <div className="upload-options">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="upload-card"
                >
                  <div className="upload-icon upload-icon-pink">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <p className="upload-title">Загрузить фото</p>
                  <p className="upload-subtitle">JPG, PNG до 10MB</p>
                </button>

                <button onClick={startCamera} className="upload-card">
                  <div className="upload-icon upload-icon-violet">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                  <p className="upload-title">Сделать селфи</p>
                  <p className="upload-subtitle">Используй камеру устройства</p>
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  hidden
                />
              </div>
            ) : (
              <div className="camera-container">
                <div className="camera-preview">
                  <video ref={videoRef} autoPlay playsInline muted />
                  <div className="camera-hint">Расположи лицо в центре</div>
                </div>
                <div className="camera-buttons">
                  <button onClick={stopCamera} className="btn btn-secondary">
                    Отмена
                  </button>
                  <button onClick={capturePhoto} className="btn btn-primary">
                    📸 Снять
                  </button>
                </div>
                <canvas ref={canvasRef} hidden />
              </div>
            )}
          </div>
        )}

        {/* Экран выбора */}
        {screen === 'select' && (
          <div className="screen select-screen">
            <div className="preview-image">
              <img src={uploadedImage} alt="Твоё фото" />
              <div className="preview-badge">Твоё фото загружено ✓</div>
            </div>

            <div className="categories">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`category-btn ${activeCategory === cat ? 'active' : ''}`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="styles-section">
              <h2>Выбери прическу</h2>
              <div className="styles-grid">
                {filteredStyles.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setSelectedStyle(style)}
                    className={`style-card ${selectedStyle?.id === style.id ? 'selected' : ''}`}
                  >
                    <span className="style-emoji">{style.emoji}</span>
                    <p className="style-name">{style.name}</p>
                    <p className="style-category">{style.category}</p>
                    {selectedStyle?.id === style.id && (
                      <div className="style-check">✓</div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {selectedStyle && (
              <div className="sticky-button">
                <button onClick={processImage} className="btn btn-primary btn-large">
                  ✨ Примерить «{selectedStyle.name}»
                </button>
              </div>
            )}
          </div>
        )}

        {/* Экран обработки */}
        {screen === 'processing' && (
          <div className="screen processing-screen">
            <div className="progress-ring">
              <svg viewBox="0 0 128 128">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="#f3e8ff"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="url(#progressGradient)"
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={351.86}
                  strokeDashoffset={351.86 * (1 - progress / 100)}
                  style={{ transition: 'stroke-dashoffset 0.5s' }}
                />
                <defs>
                  <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#f43f5e" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </svg>
              <span className="progress-text">{Math.round(progress)}%</span>
            </div>
            <h2>AI творит магию...</h2>
            <p>Примеряем прическу «{selectedStyle?.name}»</p>
          </div>
        )}

        {/* Экран результата */}
        {screen === 'result' && (
          <div className="screen result-screen">
            <div className="result-header">
              <h2>Вот твой новый образ! 🎉</h2>
              <p>Прическа «{selectedStyle?.name}»</p>
            </div>

            <div className="comparison">
              <div className="comparison-item">
                <p className="comparison-label">До</p>
                <img src={uploadedImage} alt="До" />
              </div>
              <div className="comparison-item highlight">
                <p className="comparison-label">После</p>
                <img src={resultImage} alt="После" />
              </div>
            </div>

            <div className="result-actions">
              <button onClick={saveResult} className="btn btn-primary">
                💾 Сохранить результат
              </button>
              <button onClick={() => setScreen('select')} className="btn btn-secondary">
                🔄 Попробовать другую прическу
              </button>
              <button onClick={shareResult} className="btn btn-tertiary">
                📤 Поделиться
              </button>
            </div>
          </div>
        )}
      </main>

      <footer className="footer">
        <p>Создано с ❤️ для поиска идеального стиля</p>
      </footer>
    </div>
  );
}

export default App;
