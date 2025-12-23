import React, { useState, useRef, useEffect, ChangeEvent } from 'react';
import { transformHairstyle, transformCustom, transformWithReference } from './api';
import { FEMALE_HAIRSTYLES, MALE_HAIRSTYLES } from './hairstyles';
import { Screen, TabType, Hairstyle } from './types';
import './App.css';

const App: React.FC = () => {
  // Состояния
  const [screen, setScreen] = useState<Screen>('upload');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<Hairstyle | null>(null);
  const [customHairstyle, setCustomHairstyle] = useState<string>('');
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('female');
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);

  // Рефы
  const fileInputRef = useRef<HTMLInputElement>(null);
  const referenceInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Определить режим выбора
  const isReferenceMode = activeTab === 'reference';

  // Получить текущий список причесок
  const getCurrentHairstyles = (): Hairstyle[] => {
    if (activeTab === 'female') return FEMALE_HAIRSTYLES;
    if (activeTab === 'male') return MALE_HAIRSTYLES;
    return [];
  };

  // Загрузка основного фото
  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('Файл слишком большой. Максимум 10MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImage(event.target?.result as string);
        setError(null);
        setScreen('select');
      };
      reader.readAsDataURL(file);
    }
  };

  // Загрузка фото-референса
  const handleReferenceUpload = (e: ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('Файл слишком большой. Максимум 10MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setReferenceImage(event.target?.result as string);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  // Запуск камеры
  const startCamera = async (): Promise<void> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      setCameraStream(stream);
      setIsCapturing(true);
    } catch (err) {
      console.error('Camera error:', err);
      setError('Не удалось получить доступ к камере: ' + (err as Error).message);
    }
  };

  // Подключение потока к video элементу
  useEffect(() => {
    if (isCapturing && cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.play().catch(err => {
        console.error('Video play error:', err);
      });
    }
  }, [isCapturing, cameraStream]);

  // Съёмка фото
  const capturePhoto = (): void => {
    if (canvasRef.current && videoRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg', 0.9);
        setUploadedImage(imageData);
        stopCamera();
        setScreen('select');
      }
    }
  };

  // Остановка камеры
  const stopCamera = (): void => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setIsCapturing(false);
  };

  // Выбор прически из списка
  const selectStyle = (style: Hairstyle): void => {
    setSelectedStyle(style);
    setCustomHairstyle('');
  };

  // Ввод кастомной прически
  const handleCustomInput = (value: string): void => {
    setCustomHairstyle(value);
    if (value.trim()) {
      setSelectedStyle(null);
    }
  };

  // Смена таба
  const changeTab = (tab: TabType): void => {
    setActiveTab(tab);
    setSelectedStyle(null);
    setCustomHairstyle('');
    if (tab !== 'reference') {
      setReferenceImage(null);
    }
  };

  // Проверка готовности к обработке
  const isReadyToProcess = (): boolean => {
    if (isReferenceMode) {
      return referenceImage !== null;
    }
    return selectedStyle !== null || customHairstyle.trim() !== '';
  };

  // Получить название выбранной прически
  const getSelectedName = (): string => {
    if (isReferenceMode && referenceImage) {
      return 'Прическа с фото';
    }
    if (customHairstyle.trim()) {
      return customHairstyle.trim();
    }
    if (selectedStyle) {
      return selectedStyle.name;
    }
    return '';
  };

  // Отправка на обработку
  const processImage = async (): Promise<void> => {
    if (!uploadedImage) return;

    setScreen('processing');
    setError(null);
    setProgress(0);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + Math.random() * 10;
      });
    }, 500);

    try {
      let result;

      if (isReferenceMode && referenceImage) {
        result = await transformWithReference(uploadedImage, referenceImage);
      } else if (customHairstyle.trim()) {
        result = await transformCustom(uploadedImage, customHairstyle.trim());
      } else if (selectedStyle) {
        result = await transformHairstyle(uploadedImage, selectedStyle.id);
      } else {
        throw new Error('Прическа не выбрана');
      }

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
      setError((err as Error).message || 'Ошибка при обработке');
      setScreen('select');
    }
  };

  // Сброс
  const reset = (): void => {
    setUploadedImage(null);
    setReferenceImage(null);
    setSelectedStyle(null);
    setCustomHairstyle('');
    setResultImage(null);
    setScreen('upload');
    setError(null);
    setProgress(0);
    setActiveTab('female');
    stopCamera();
  };

  // Попробовать другую прическу
  const tryAnother = (): void => {
    setSelectedStyle(null);
    setCustomHairstyle('');
    setReferenceImage(null);
    setResultImage(null);
    setScreen('select');
  };

  // Сохранение результата
  const saveResult = (): void => {
    if (!resultImage) return;
    const link = document.createElement('a');
    const name = getSelectedName().replace(/\s+/g, '-');
    link.download = `styleme-${name}.jpg`;
    link.href = resultImage;
    link.click();
  };

  // Шаринг
  const shareResult = (): void => {
    if (navigator.share) {
      navigator.share({
        title: 'Мой новый образ от StyleMe',
        text: `Примерил прическу "${getSelectedName()}"`,
      });
    }
  };

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
              <p>Загрузи фото и примерь 40+ причесок с помощью AI</p>
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
        {screen === 'select' && uploadedImage && (
          <div className="screen select-screen">
            <div className="preview-image">
              <img src={uploadedImage} alt="Твоё фото" />
              <div className="preview-badge">Твоё фото загружено ✓</div>
            </div>

            {/* Табы */}
            <div className="gender-tabs three-tabs">
              <button
                className={`gender-tab ${activeTab === 'female' ? 'active' : ''}`}
                onClick={() => changeTab('female')}
              >
                👩 Женские
              </button>
              <button
                className={`gender-tab ${activeTab === 'male' ? 'active' : ''}`}
                onClick={() => changeTab('male')}
              >
                👨 Мужские
              </button>
              <button
                className={`gender-tab ${activeTab === 'reference' ? 'active' : ''}`}
                onClick={() => changeTab('reference')}
              >
                📷 С фото
              </button>
            </div>

            {/* Контент в зависимости от таба */}
            {isReferenceMode ? (
              <div className="reference-section">
                <div className="reference-info">
                  <h2>📷 Прическа с фото</h2>
                  <p>Загрузи фото с прической, которую хочешь примерить.</p>
                </div>

                {referenceImage ? (
                  <div className="reference-preview">
                    <div className="reference-image-container">
                      <img src={referenceImage} alt="Референс" />
                      <button 
                        className="reference-remove"
                        onClick={() => setReferenceImage(null)}
                      >
                        ✕
                      </button>
                    </div>
                    <p className="reference-ready">✓ Фото с прической загружено</p>
                  </div>
                ) : (
                  <button
                    onClick={() => referenceInputRef.current?.click()}
                    className="reference-upload-btn"
                  >
                    <span className="reference-upload-icon">📸</span>
                    <span className="reference-upload-text">Загрузить фото с прической</span>
                    <span className="reference-upload-hint">Найди фото с нужной прической</span>
                  </button>
                )}

                <input
                  ref={referenceInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleReferenceUpload}
                  hidden
                />
              </div>
            ) : (
              <>
                {/* Поле ввода своей прически */}
                <div className="custom-input-section">
                  <label className="custom-label">Или введи свою прическу:</label>
                  <input
                    type="text"
                    className={`custom-input ${customHairstyle.trim() ? 'active' : ''}`}
                    placeholder="Например: розовые волосы до плеч..."
                    value={customHairstyle}
                    onChange={(e) => handleCustomInput(e.target.value)}
                  />
                  {customHairstyle.trim() && (
                    <div className="custom-selected">
                      ✨ Будет применена: <strong>{customHairstyle}</strong>
                    </div>
                  )}
                </div>

                {/* Сетка причесок */}
                <div className="styles-section">
                  <h2>
                    {activeTab === 'female' ? '👩 Женские прически' : '👨 Мужские прически'}
                    <span className="styles-count">{getCurrentHairstyles().length}</span>
                  </h2>
                  <div className="styles-grid">
                    {getCurrentHairstyles().map((style) => (
                      <button
                        key={style.id}
                        onClick={() => selectStyle(style)}
                        className={`style-card ${selectedStyle?.id === style.id ? 'selected' : ''}`}
                      >
                        <span className="style-emoji">{style.emoji}</span>
                        <p className="style-name">{style.name}</p>
                        {selectedStyle?.id === style.id && (
                          <div className="style-check">✓</div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Кнопка обработки */}
            {isReadyToProcess() && (
              <div className="sticky-button">
                <button onClick={processImage} className="btn btn-primary btn-large">
                  ✨ Примерить «{getSelectedName()}»
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
            <p>Примеряем прическу «{getSelectedName()}»</p>
          </div>
        )}

        {/* Экран результата */}
        {screen === 'result' && uploadedImage && resultImage && (
          <div className="screen result-screen">
            <div className="result-header">
              <h2>Вот твой новый образ! 🎉</h2>
              <p>Прическа «{getSelectedName()}»</p>
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
              <button onClick={tryAnother} className="btn btn-secondary">
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
};

export default App;
