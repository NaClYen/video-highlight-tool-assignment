import React from 'react'
import { type TransitionState } from '../hooks/useSmoothTransition'

/**
 * 轉換指示器組件屬性
 */
interface TransitionIndicatorProps {
  /** 轉換狀態 */
  transitionState: TransitionState
  /** 轉換進度 (0-1) */
  progress: number
  /** 當前片段信息 */
  currentSegment?: {
    start: number
    end: number
    title?: string
  }
  /** 下一個片段信息 */
  nextSegment?: {
    start: number
    end: number
    title?: string
  }
  /** 是否顯示 */
  visible: boolean
}

/**
 * 轉換指示器組件
 * 提供視覺反饋來減少轉換時的落差感
 */
export const TransitionIndicator: React.FC<TransitionIndicatorProps> = ({
  transitionState,
  progress,
  currentSegment,
  nextSegment,
  visible,
}) => {
  if (!visible) return null

  const getTransitionText = () => {
    switch (transitionState) {
      case 'preparing':
        return '準備轉換...'
      case 'transitioning':
        return '正在轉換...'
      case 'completed':
        return '轉換完成'
      default:
        return ''
    }
  }

  const getProgressColor = () => {
    switch (transitionState) {
      case 'preparing':
        return 'bg-blue-500'
      case 'transitioning':
        return 'bg-yellow-500'
      case 'completed':
        return 'bg-green-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <div className="fixed top-4 right-4 z-50 bg-black bg-opacity-80 text-white p-4 rounded-lg shadow-lg min-w-64 transition-all duration-300">
      {/* 狀態指示器 */}
      <div className="flex items-center gap-2 mb-3">
        <div
          className={`w-3 h-3 rounded-full ${getProgressColor()} animate-pulse`}
        />
        <span className="text-sm font-medium">{getTransitionText()}</span>
      </div>

      {/* 進度條 */}
      <div className="w-full bg-gray-700 rounded-full h-2 mb-3">
        <div
          className={`h-2 rounded-full transition-all duration-200 ${getProgressColor()}`}
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {/* 片段信息 */}
      <div className="space-y-2 text-xs">
        {currentSegment && (
          <div className="flex justify-between">
            <span className="text-gray-300">當前片段:</span>
            <span>
              {formatTime(currentSegment.start)} -{' '}
              {formatTime(currentSegment.end)}
            </span>
          </div>
        )}

        {nextSegment && transitionState !== 'idle' && (
          <div className="flex justify-between">
            <span className="text-gray-300">下一個片段:</span>
            <span>
              {formatTime(nextSegment.start)} - {formatTime(nextSegment.end)}
            </span>
          </div>
        )}
      </div>

      {/* 轉換動畫 */}
      {transitionState === 'transitioning' && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 animate-pulse" />
      )}
    </div>
  )
}

/**
 * 格式化時間顯示
 */
function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}
