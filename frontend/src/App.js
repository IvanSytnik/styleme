import React, { useState, useRef } from 'react';
import { transformHairstyle, transformCustom } from './api';
import './App.css';

// Женские прически (20)
const FEMALE_HAIRSTYLES = [
  { id: 1, name: 'Классическое каре', emoji: '💇‍♀️' },
  { id: 2, name: 'Удлинённый боб (Лоб)', emoji: '✨' },
  { id: 3, name: 'Пикси', emoji: '⭐' },
  { id: 4, name: 'Голливудские локоны', emoji: '🌟' },
  { id: 5, name: 'Каскад', emoji: '🌊' },
  { id: 6, name: 'Пляжные волны', emoji: '🏖️' },
  { id: 7, name: 'Шэг', emoji: '🔥' },
  { id: 8, name: 'Прямые длинные', emoji: '💎' },
  { id: 9, name: 'Кудри афро', emoji: '🌀' },
  { id: 10, name: 'Французская коса', emoji: '🥐' },
  { id: 11, name: 'Небрежный пучок', emoji: '🎀' },
  { id: 12, name: 'Конский хвост', emoji: '🐴' },
  { id: 13, name: 'Косы боксёр', emoji: '🥊' },
  { id: 14, name: 'Мальвинка', emoji: '👸' },
  { id: 15, name: 'Низкий пучок', emoji: '🎭' },
  { id: 16, name: 'Асимметричный боб', emoji: '📐' },
  { id: 17, name: 'Ретро волны', emoji: '🎬' },
  { id: 18, name: 'Длинная чёлка', emoji: '💫' },
  { id: 19, name: 'Объёмные локоны', emoji: '🌸' },
  { id: 20, name: 'Гладкий хвост', emoji: '✨' },
];

// Мужские прически (20)
const MALE_HAIRSTYLES = [
  { id: 21, name: 'Фейд', emoji: '💈' },
  { id: 22, name: 'Андеркат', emoji: '🔪' },
  { id: 23, name: 'Помпадур', emoji: '👑' },
  { id: 24, name: 'Кроп', emoji: '✂️' },
  { id: 25, name: 'Квифф', emoji: '💨' },
  { id: 26, name: 'Бокс', emoji: '🥊' },
  { id: 27, name: 'Полубокс', emoji: '⚡' },
  { id: 28, name: 'Канадка', emoji: '🍁' },
  { id: 29, name: 'Цезарь', emoji: '🏛️' },
  { id: 30, name: 'Мужской пучок', emoji: '🎯' },
  { id: 31, name: 'Текстурная стрижка', emoji: '🌊' },
  { id: 32, name: 'Под машинку', emoji: '🔌' },
  { id: 33, name: 'Ёжик', emoji: '🦔' },
  { id: 34, name: 'Британка', emoji: '🎩' },
  { id: 35, name: 'Гранж', emoji: '🎸' },
  { id: 36, name: 'Теннис', emoji: '🎾' },
  { id: 37, name: 'Площадка', emoji: '📦' },
  { id: 38, name: 'Фейд с узором', emoji: '🎨' },
  { id: 39, name: 'Длинные мужские', emoji: '🦁' },
  { id: 40, name: 'Боковой пробор', emoji: '👔' },
];

function App() {
  const [screen, setScreen] = useState('upload');
  const [uploadedImage, setUploadedImage] = useState(null);
  const [selectedStyle, setSelectedStyle] = useState(null);
  const [customHairstyle, setCustomHairstyle] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [resultImage, setResultImage] = useState(null);
  const [activeGender, setActiveGender] = useState('female'); // 'female' или 'male'
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);

  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Получить текущий список причесок
  const getCurrentHairstyles = () => {
    return activeGender === 'female' ? FEMALE_HAIRSTYLES : MALE_HAIRSTYLES;
  };

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
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      setCameraStream(stream);
      setIsCapturing(true);
    } catch (err) {
      console.error('Camera error:', err);
      setError('Не удалось получить доступ к камере: ' + err.message);
    }
  };

  // Подключение потока к video элементу
  React.useEffect(() => {
    if (isCapturing && cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.play().catch(err => {
        console.error('Video play error:', err);
      });
    }
  }, [isCapturing, cameraStream]);

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

  // Выбор прически из списка
  const selectStyle = (style) => {
    setSelectedStyle(style);
    setUseCustom(false);
    setCustomHairstyle('');
  };

  // Ввод кастомной прически
  const handleCustomInput = (value) => {
    setCustomHairstyle(value);
    if (value.trim()) {
      setUseCustom(true);
      setSelectedStyle(null);
    } else {
      setUseCustom(false);
    }
  };

  // Проверка готовности к обработке
  const isReadyToProcess = () => {
    return (selectedStyle && !useCustom) || (useCustom && customHairstyle.trim());
  };

  // Получить название выбранной прически
  const getSelectedName = () => {
    if (useCustom && customHairstyle.trim()) {
      return customHairstyle.trim();
    }
    if (selectedStyle) {
      return selectedStyle.name;
    }
    return '';
  };

  // Отправка на обработку
  const processImage = async () => {
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
      
      if (useCustom && customHairstyle.trim()) {
        // Кастомная прическа
        result = await transformCustom(uploadedImage, customHairstyle.trim());
      } else if (selectedStyle) {
        // Прическа из списка
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
      setError(err.message || 'Ошибка при обработке');
      setScreen('select');
    }
  };

  // Сброс
  const reset = () => {
    setUploadedImage(null);
    setSelectedStyle(null);
    setCustomHairstyle('');
    setUseCustom(false);
    setResultImage(null);
    setScreen('upload');
    setError(null);
    setProgress(0);
    stopCamera();
  };

  // Сохранение результата
  const saveResult = () => {
    const link = document.createElement('a');
    const name = getSelectedName().replace(/\s+/g, '-');
    link.download = `styleme-${name}.jpg`;
    link.href = resultImage;
    link.click();
  };

  // Шаринг
  const shareResult = () => {
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
              <p>Загрузи фото и примерь 40 причесок с помощью AI</p>
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

            {/* Поле ввода своей прически */}
            <div className="custom-input-section">
              <label className="custom-label">Или введи свою прическу:</label>
              <input
                type="text"
                className={`custom-input ${useCustom ? 'active' : ''}`}
                placeholder="Например: розовые волосы до плеч..."
                value={customHairstyle}
                onChange={(e) => handleCustomInput(e.target.value)}
              />
              {useCustom && customHairstyle.trim() && (
                <div className="custom-selected">
                  ✨ Будет применена: <strong>{customHairstyle}</strong>
                </div>
              )}
            </div>

            {/* Переключатель Женские/Мужские */}
            <div className="gender-tabs">
              <button
                className={`gender-tab ${activeGender === 'female' ? 'active' : ''}`}
                onClick={() => setActiveGender('female')}
              >
                👩 Женские
              </button>
              <button
                className={`gender-tab ${activeGender === 'male' ? 'active' : ''}`}
                onClick={() => setActiveGender('male')}
              >
                👨 Мужские
              </button>
            </div>

            {/* Сетка причесок */}
            <div className="styles-section">
              <h2>
                {activeGender === 'female' ? '👩 Женские прически' : '👨 Мужские прически'}
                <span className="styles-count">{getCurrentHairstyles().length}</span>
              </h2>
              <div className="styles-grid">
                {getCurrentHairstyles().map((style) => (
                  <button
                    key={style.id}
                    onClick={() => selectStyle(style)}
                    className={`style-card ${selectedStyle?.id === style.id && !useCustom ? 'selected' : ''}`}
                  >
                    <span className="style-emoji">{style.emoji}</span>
                    <p className="style-name">{style.name}</p>
                    {selectedStyle?.id === style.id && !useCustom && (
                      <div className="style-check">✓</div>
                    )}
                  </button>
                ))}
              </div>
            </div>

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
        {screen === 'result' && (
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
              <button onClick={() => { setScreen('select'); setSelectedStyle(null); setCustomHairstyle(''); setUseCustom(false); }} className="btn btn-secondary">
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
