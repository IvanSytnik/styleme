/**
 * Компонент рекламы для StyleMe
 * 
 * Использование:
 * 1. Замени AD_CLIENT и AD_SLOT на свои после одобрения AdSense
 * 2. Для тестирования используется заглушка
 */

import React, { useState, useEffect, useCallback } from 'react';

// ============================================
// КОНФИГУРАЦИЯ - ЗАМЕНИ НА СВОИ ДАННЫЕ
// ============================================
const AD_CONFIG = {
  // Google AdSense
  adClient: 'ca-pub-9778350994032622',
  bannerSlot: '',            // Создай слот в AdSense и вставь сюда
  rewardedSlot: '',          // Создай слот в AdSense и вставь сюда
  
  // Настройки
  adsPerGeneration: 2,    // Сколько реклам нужно посмотреть
  adDuration: 5,          // Длительность просмотра (секунд)
  testMode: true,         // Поменяй на false когда создашь слоты
};

// ============================================
// ТИПЫ
// ============================================
interface AdCredits {
  watchedAds: number;
  generations: number;
}

interface BannerAdProps {
  position?: 'top' | 'bottom';
}

interface RewardedAdProps {
  onReward: () => void;
  onClose: () => void;
  isVisible: boolean;
}

interface UseAdCreditsReturn {
  credits: AdCredits;
  hasGeneration: boolean;
  watchAd: () => void;
  useGeneration: () => boolean;
  adsNeeded: number;
  showRewardedAd: boolean;
  setShowRewardedAd: (show: boolean) => void;
}

// ============================================
// ХУК ДЛЯ УПРАВЛЕНИЯ КРЕДИТАМИ
// ============================================
export const useAdCredits = (): UseAdCreditsReturn => {
  const [credits, setCredits] = useState<AdCredits>(() => {
    // Загружаем из localStorage
    const saved = localStorage.getItem('styleme_ad_credits');
    if (saved) {
      return JSON.parse(saved);
    }
    // Даём 1 бесплатную генерацию новым пользователям
    return { watchedAds: 0, generations: 1 };
  });
  
  const [showRewardedAd, setShowRewardedAd] = useState(false);

  // Сохраняем в localStorage
  useEffect(() => {
    localStorage.setItem('styleme_ad_credits', JSON.stringify(credits));
  }, [credits]);

  // Есть ли доступная генерация
  const hasGeneration = credits.generations > 0;
  
  // Сколько реклам нужно посмотреть до генерации
  const adsNeeded = AD_CONFIG.adsPerGeneration - (credits.watchedAds % AD_CONFIG.adsPerGeneration);

  // Засчитать просмотр рекламы
  const watchAd = useCallback(() => {
    setCredits(prev => {
      const newWatchedAds = prev.watchedAds + 1;
      const earnedGeneration = newWatchedAds % AD_CONFIG.adsPerGeneration === 0;
      
      return {
        watchedAds: newWatchedAds,
        generations: earnedGeneration ? prev.generations + 1 : prev.generations,
      };
    });
  }, []);

  // Использовать генерацию
  const useGeneration = useCallback((): boolean => {
    if (credits.generations <= 0) {
      return false;
    }
    setCredits(prev => ({
      ...prev,
      generations: prev.generations - 1,
    }));
    return true;
  }, [credits.generations]);

  return {
    credits,
    hasGeneration,
    watchAd,
    useGeneration,
    adsNeeded,
    showRewardedAd,
    setShowRewardedAd,
  };
};

// ============================================
// БАННЕР (внизу экрана)
// ============================================
export const BannerAd: React.FC<BannerAdProps> = ({ position = 'bottom' }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!AD_CONFIG.testMode) {
      // Загружаем скрипт AdSense
      const script = document.createElement('script');
      script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.dataset.adClient = AD_CONFIG.adClient;
      document.head.appendChild(script);
      
      script.onload = () => setIsLoaded(true);
    } else {
      setIsLoaded(true);
    }
  }, []);

  const positionStyle: React.CSSProperties = {
    position: 'fixed',
    left: 0,
    right: 0,
    zIndex: 1000,
    ...(position === 'bottom' ? { bottom: 0 } : { top: 60 }),
  };

  if (AD_CONFIG.testMode) {
    return (
      <div style={positionStyle} className="banner-ad banner-ad-test">
        <div className="banner-ad-content">
          📢 Рекламный баннер (тестовый режим)
        </div>
      </div>
    );
  }

  if (!isLoaded) return null;

  return (
    <div style={positionStyle} className="banner-ad">
      <ins
        className="adsbygoogle"
        style={{ display: 'block', width: '100%', height: '50px' }}
        data-ad-client={AD_CONFIG.adClient}
        data-ad-slot={AD_CONFIG.bannerSlot}
        data-ad-format="horizontal"
        data-full-width-responsive="true"
      />
    </div>
  );
};

// ============================================
// REWARDED AD (полноэкранная)
// ============================================
export const RewardedAd: React.FC<RewardedAdProps> = ({ 
  onReward, 
  onClose, 
  isVisible 
}) => {
  const [countdown, setCountdown] = useState(AD_CONFIG.adDuration);
  const [canClose, setCanClose] = useState(false);

  useEffect(() => {
    if (!isVisible) {
      setCountdown(AD_CONFIG.adDuration);
      setCanClose(false);
      return;
    }

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanClose(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isVisible]);

  const handleClose = () => {
    if (canClose) {
      onReward();
      onClose();
    }
  };

  if (!isVisible) return null;

  return (
    <div className="rewarded-ad-overlay">
      <div className="rewarded-ad-container">
        {/* Заголовок */}
        <div className="rewarded-ad-header">
          <span>Реклама</span>
          {canClose ? (
            <button className="rewarded-ad-close" onClick={handleClose}>
              ✕ Закрыть
            </button>
          ) : (
            <span className="rewarded-ad-countdown">{countdown}с</span>
          )}
        </div>

        {/* Контент рекламы */}
        <div className="rewarded-ad-content">
          {AD_CONFIG.testMode ? (
            <div className="rewarded-ad-test">
              <div className="rewarded-ad-test-icon">📺</div>
              <h3>Тестовая реклама</h3>
              <p>Здесь будет видеореклама</p>
              <p className="rewarded-ad-test-hint">
                {canClose 
                  ? '✅ Можно закрыть и получить награду!' 
                  : `Подождите ${countdown} секунд...`
                }
              </p>
            </div>
          ) : (
            // Реальная реклама AdSense
            <ins
              className="adsbygoogle"
              style={{ display: 'block', width: '100%', height: '100%' }}
              data-ad-client={AD_CONFIG.adClient}
              data-ad-slot={AD_CONFIG.rewardedSlot}
              data-ad-format="fluid"
            />
          )}
        </div>

        {/* Кнопка получения награды */}
        {canClose && (
          <button className="rewarded-ad-reward-btn" onClick={handleClose}>
            🎁 Получить награду
          </button>
        )}
      </div>
    </div>
  );
};

// ============================================
// КНОПКА "ПОСМОТРЕТЬ РЕКЛАМУ"
// ============================================
interface WatchAdButtonProps {
  onClick: () => void;
  adsNeeded: number;
  generations: number;
}

export const WatchAdButton: React.FC<WatchAdButtonProps> = ({ 
  onClick, 
  adsNeeded,
  generations 
}) => {
  return (
    <div className="watch-ad-section">
      <div className="credits-info">
        <span className="credits-count">🎬 Генераций: {generations}</span>
        {generations === 0 && (
          <span className="credits-hint">
            Посмотри {adsNeeded} {adsNeeded === 1 ? 'рекламу' : 'рекламы'} для генерации
          </span>
        )}
      </div>
      
      {generations === 0 && (
        <button className="watch-ad-btn" onClick={onClick}>
          📺 Посмотреть рекламу ({adsNeeded} осталось)
        </button>
      )}
    </div>
  );
};

// ============================================
// СТИЛИ (добавь в App.css)
// ============================================
export const adStyles = `
/* Баннер */
.banner-ad {
  background: linear-gradient(135deg, #1f2937, #374151);
  padding: 8px;
  text-align: center;
}

.banner-ad-test {
  background: linear-gradient(135deg, #7c3aed, #8b5cf6);
}

.banner-ad-content {
  color: white;
  font-size: 0.875rem;
}

/* Rewarded Ad Overlay */
.rewarded-ad-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.9);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.rewarded-ad-container {
  background: white;
  border-radius: 20px;
  width: 100%;
  max-width: 400px;
  overflow: hidden;
}

.rewarded-ad-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f3f4f6;
  font-weight: 600;
}

.rewarded-ad-countdown {
  background: #ef4444;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
}

.rewarded-ad-close {
  background: #10b981;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  cursor: pointer;
  font-weight: 600;
}

.rewarded-ad-content {
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.rewarded-ad-test {
  text-align: center;
  padding: 2rem;
}

.rewarded-ad-test-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.rewarded-ad-test h3 {
  margin-bottom: 0.5rem;
}

.rewarded-ad-test p {
  color: #6b7280;
}

.rewarded-ad-test-hint {
  margin-top: 1rem;
  font-weight: 600;
  color: #8b5cf6 !important;
}

.rewarded-ad-reward-btn {
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, #f43f5e, #8b5cf6);
  color: white;
  border: none;
  font-size: 1.125rem;
  font-weight: 700;
  cursor: pointer;
}

/* Watch Ad Section */
.watch-ad-section {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(244, 63, 94, 0.1));
  border-radius: 16px;
  padding: 1rem;
  margin-bottom: 1rem;
  text-align: center;
}

.credits-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 0.75rem;
}

.credits-count {
  font-size: 1.125rem;
  font-weight: 700;
  color: #1f2937;
}

.credits-hint {
  font-size: 0.875rem;
  color: #6b7280;
}

.watch-ad-btn {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
}

.watch-ad-btn:hover {
  transform: scale(1.02);
}

/* Отступ для баннера внизу */
.app {
  padding-bottom: 60px;
}
`;

export default {
  useAdCredits,
  BannerAd,
  RewardedAd,
  WatchAdButton,
  AD_CONFIG,
};
