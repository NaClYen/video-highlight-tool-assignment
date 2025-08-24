import React, { useState } from 'react'
import clsx from 'clsx'
import {
  type TransitionConfig,
  getTransitionConfig,
  validateTransitionConfig,
} from '../config/transitionConfig'

/**
 * 轉換設置組件屬性
 */
interface TransitionSettingsProps {
  /** 目前配置 */
  config: TransitionConfig
  /** 配置變更回調 */
  onConfigChange: (config: TransitionConfig) => void
  /** 是否顯示 */
  visible: boolean
  /** 關閉回調 */
  onClose: () => void
}

/**
 * 轉換設置組件
 * 允許用戶自定義轉換行為以減少落差感
 */
export const TransitionSettings: React.FC<TransitionSettingsProps> = ({
  config,
  onConfigChange,
  visible,
  onClose,
}) => {
  const [localConfig, setLocalConfig] = useState<TransitionConfig>(config)

  if (!visible) return null

  const handlePresetChange = (
    preset: 'default' | 'performance' | 'accessibility',
  ) => {
    const newConfig = getTransitionConfig(preset)
    setLocalConfig(newConfig)
    onConfigChange(newConfig)
  }

  const handleConfigChange = (updates: Partial<TransitionConfig>) => {
    const newConfig = validateTransitionConfig({ ...localConfig, ...updates })
    setLocalConfig(newConfig)
    onConfigChange(newConfig)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-neutral-800 text-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">轉換設置</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl"
          >
            ×
          </button>
        </div>

        {/* 預設配置 */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">預設配置</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handlePresetChange('default')}
              className={clsx('px-3 py-2 rounded text-sm', {
                'bg-indigo-600 text-white':
                  localConfig === getTransitionConfig('default'),
                'bg-neutral-700 hover:bg-neutral-600':
                  localConfig !== getTransitionConfig('default'),
              })}
            >
              默認
            </button>
            <button
              onClick={() => handlePresetChange('performance')}
              className={clsx('px-3 py-2 rounded text-sm', {
                'bg-indigo-600 text-white':
                  localConfig === getTransitionConfig('performance'),
                'bg-neutral-700 hover:bg-neutral-600':
                  localConfig !== getTransitionConfig('performance'),
              })}
            >
              高性能
            </button>
            <button
              onClick={() => handlePresetChange('accessibility')}
              className={clsx('px-3 py-2 rounded text-sm', {
                'bg-indigo-600 text-white':
                  localConfig === getTransitionConfig('accessibility'),
                'bg-neutral-700 hover:bg-neutral-600':
                  localConfig !== getTransitionConfig('accessibility'),
              })}
            >
              無障礙
            </button>
          </div>
        </div>

        {/* 基本設置 */}
        <div className="space-y-4">
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={localConfig.enabled}
                onChange={(e) =>
                  handleConfigChange({ enabled: e.target.checked })
                }
                className="mr-2"
              />
              啟用平滑轉換
            </label>
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={localConfig.visualEffects}
                onChange={(e) =>
                  handleConfigChange({ visualEffects: e.target.checked })
                }
                className="mr-2"
              />
              視覺過渡效果
            </label>
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={localConfig.audioFade}
                onChange={(e) =>
                  handleConfigChange({ audioFade: e.target.checked })
                }
                className="mr-2"
              />
              聲音淡入淡出
            </label>
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={localConfig.preload}
                onChange={(e) =>
                  handleConfigChange({ preload: e.target.checked })
                }
                className="mr-2"
              />
              預加載下一個片段
            </label>
          </div>
        </div>

        {/* 高級設置 */}
        <div className="mt-6 space-y-4">
          <h4 className="text-sm font-medium text-gray-300">高級設置</h4>

          <div>
            <label className="block text-sm mb-1">
              轉換持續時間: {localConfig.duration}ms
            </label>
            <input
              type="range"
              min="100"
              max="1000"
              step="50"
              value={localConfig.duration}
              onChange={(e) =>
                handleConfigChange({ duration: parseInt(e.target.value) })
              }
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">
              聲音淡入淡出時間: {localConfig.audioFadeDuration}ms
            </label>
            <input
              type="range"
              min="50"
              max="500"
              step="25"
              value={localConfig.audioFadeDuration}
              onChange={(e) =>
                handleConfigChange({
                  audioFadeDuration: parseInt(e.target.value),
                })
              }
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">
              預加載提前時間: {localConfig.preloadAdvance}s
            </label>
            <input
              type="range"
              min="0"
              max="10"
              step="0.5"
              value={localConfig.preloadAdvance}
              onChange={(e) =>
                handleConfigChange({
                  preloadAdvance: parseFloat(e.target.value),
                })
              }
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">
              轉換觸發容差: {localConfig.transitionTolerance}s
            </label>
            <input
              type="range"
              min="0.01"
              max="1"
              step="0.01"
              value={localConfig.transitionTolerance}
              onChange={(e) =>
                handleConfigChange({
                  transitionTolerance: parseFloat(e.target.value),
                })
              }
              className="w-full"
            />
          </div>
        </div>

        {/* 說明 */}
        <div className="mt-6 p-3 bg-neutral-700 rounded text-sm text-gray-300">
          <p className="mb-2">
            <strong>說明：</strong>
          </p>
          <ul className="space-y-1 text-xs">
            <li>
              • <strong>默認</strong>：平衡性能和效果
            </li>
            <li>
              • <strong>高性能</strong>：減少效果以提升流暢度
            </li>
            <li>
              • <strong>無障礙</strong>：為聽覺敏感用戶優化
            </li>
            <li>• 較長的轉換時間可以減少落差感，但可能影響響應性</li>
            <li>• 聲音淡入淡出可以平滑聲音轉換</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
