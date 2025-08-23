/**
 * 影片片段轉換配置
 * 用於減少轉換時的落差感
 */
export interface TransitionConfig {
  /** 是否啟用平滑轉換 */
  enabled: boolean
  /** 轉換持續時間（毫秒） */
  duration: number
  /** 音頻淡入淡出時間（毫秒） */
  audioFadeDuration: number
  /** 預加載提前時間（秒） */
  preloadAdvance: number
  /** 轉換觸發容差（秒） */
  transitionTolerance: number
  /** 是否啟用視覺過渡效果 */
  visualEffects: boolean
  /** 是否啟用音頻淡入淡出 */
  audioFade: boolean
  /** 是否啟用預加載 */
  preload: boolean
}

/**
 * 默認轉換配置
 */
export const defaultTransitionConfig: TransitionConfig = {
  enabled: true,
  duration: 300,
  audioFadeDuration: 150,
  preloadAdvance: 2,
  transitionTolerance: 0.05,
  visualEffects: true,
  audioFade: true,
  preload: true,
}

/**
 * 高性能配置（減少效果以提升性能）
 */
export const performanceTransitionConfig: TransitionConfig = {
  enabled: true,
  duration: 200,
  audioFadeDuration: 100,
  preloadAdvance: 1,
  transitionTolerance: 0.02,
  visualEffects: false,
  audioFade: true,
  preload: true,
}

/**
 * 無障礙配置（為聽覺敏感用戶優化）
 */
export const accessibilityTransitionConfig: TransitionConfig = {
  enabled: true,
  duration: 500,
  audioFadeDuration: 300,
  preloadAdvance: 3,
  transitionTolerance: 0.08,
  visualEffects: true,
  audioFade: false, // 禁用音頻淡入淡出以避免聽覺不適
  preload: true,
}

/**
 * 獲取轉換配置
 * 可以根據用戶偏好或系統性能動態選擇
 */
export function getTransitionConfig(
  type: 'default' | 'performance' | 'accessibility' = 'default',
): TransitionConfig {
  switch (type) {
    case 'performance':
      return performanceTransitionConfig
    case 'accessibility':
      return accessibilityTransitionConfig
    default:
      return defaultTransitionConfig
  }
}

/**
 * 驗證轉換配置
 */
export function validateTransitionConfig(
  config: Partial<TransitionConfig>,
): TransitionConfig {
  const validated = { ...defaultTransitionConfig, ...config }

  // 確保數值在合理範圍內
  validated.duration = Math.max(100, Math.min(1000, validated.duration))
  validated.audioFadeDuration = Math.max(
    50,
    Math.min(500, validated.audioFadeDuration),
  )
  validated.preloadAdvance = Math.max(0, Math.min(10, validated.preloadAdvance))
  validated.transitionTolerance = Math.max(
    0.01,
    Math.min(1, validated.transitionTolerance),
  )

  return validated
}
