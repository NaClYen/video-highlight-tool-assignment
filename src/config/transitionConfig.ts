/**
 * 影片片段轉換配置
 * 用於減少轉換時的落差感
 */
export interface TransitionConfig {
  /** 轉換觸發容差（秒） */
  transitionTolerance: number
}

/**
 * 默認轉換配置
 */
export const defaultTransitionConfig: TransitionConfig = {
  transitionTolerance: 0.01,
}

/**
 * 獲取轉換配置
 */
export function getTransitionConfig(): TransitionConfig {
  return defaultTransitionConfig
}

/**
 * 驗證轉換配置
 */
export function validateTransitionConfig(
  config: Partial<TransitionConfig>,
): TransitionConfig {
  const validated = { ...defaultTransitionConfig, ...config }

  // 確保數值在合理範圍內
  validated.transitionTolerance = Math.max(
    0.01,
    Math.min(1, validated.transitionTolerance),
  )

  return validated
}
