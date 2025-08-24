import { useRef, useCallback, useEffect, useState } from 'react'
import { useVideoPlayerContext } from '../contexts/useVideoPlayerContext'

/**
 * 轉換狀態類型
 */
export type TransitionState =
  | 'idle'
  | 'preparing'
  | 'transitioning'
  | 'completed'

/**
 * 平滑轉換配置
 */
export interface TransitionConfig {
  /** 轉換持續時間（毫秒） */
  duration: number
  /** 聲音淡入淡出時間（毫秒） */
  audioFadeDuration: number
  /** 預加載提前時間（秒） */
  preloadAdvance: number
  /** 轉換觸發容差（秒） */
  transitionTolerance: number
}

/**
 * 平滑轉換 hook
 * 處理影片片段之間的平滑過渡，減少落差感
 */
export const useSmoothTransition = (
  videoRef: React.RefObject<HTMLVideoElement | null>,
  config: Partial<TransitionConfig> = {},
) => {
  const { state } = useVideoPlayerContext()
  const [transitionState, setTransitionState] =
    useState<TransitionState>('idle')
  const [transitionProgress, setTransitionProgress] = useState(0)

  // 合併配置
  const finalConfig: TransitionConfig = {
    duration: 300,
    audioFadeDuration: 150,
    preloadAdvance: 2,
    transitionTolerance: 0.2,
    ...config,
  }

  const transitionRef = useRef<{
    startTime: number
    targetTime: number
    startVolume: number
    audioContext: AudioContext | null
    gainNode: GainNode | null
  }>({
    startTime: 0,
    targetTime: 0,
    startVolume: 1,
    audioContext: null,
    gainNode: null,
  })

  /**
   * 初始化聲音上下文
   */
  const initAudioContext = useCallback(() => {
    if (!videoRef.current || transitionRef.current.audioContext) return

    try {
      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)()
      const gainNode = audioContext.createGain()

      // 創建聲音源
      const source = audioContext.createMediaElementSource(videoRef.current)
      source.connect(gainNode)
      gainNode.connect(audioContext.destination)

      transitionRef.current.audioContext = audioContext
      transitionRef.current.gainNode = gainNode
    } catch (error) {
      // Audio context not supported, falling back to volume-based fade
    }
  }, [videoRef])

  /**
   * 聲音淡出效果
   */
  const fadeOutAudio = useCallback(
    async (duration: number) => {
      const { audioContext, gainNode } = transitionRef.current

      if (audioContext && gainNode) {
        // 使用 Web Audio API 進行精確的聲音控制
        const startTime = audioContext.currentTime
        gainNode.gain.setValueAtTime(1, startTime)
        gainNode.gain.linearRampToValueAtTime(0, startTime + duration / 1000)
      } else if (videoRef.current) {
        // 降級到音量控制
        const startVolume = videoRef.current.volume
        const steps = 10
        const stepDuration = duration / steps
        const volumeStep = startVolume / steps

        for (let i = 0; i < steps; i++) {
          await new Promise((resolve) => setTimeout(resolve, stepDuration))
          if (videoRef.current) {
            videoRef.current.volume = Math.max(
              0,
              startVolume - (i + 1) * volumeStep,
            )
          }
        }
      }
    },
    [videoRef],
  )

  /**
   * 聲音淡入效果
   */
  const fadeInAudio = useCallback(
    async (duration: number) => {
      const { audioContext, gainNode } = transitionRef.current

      if (audioContext && gainNode) {
        const startTime = audioContext.currentTime
        gainNode.gain.setValueAtTime(0, startTime)
        gainNode.gain.linearRampToValueAtTime(1, startTime + duration / 1000)
      } else if (videoRef.current) {
        const targetVolume = state.volume
        const steps = 10
        const stepDuration = duration / steps
        const volumeStep = targetVolume / steps

        for (let i = 0; i < steps; i++) {
          await new Promise((resolve) => setTimeout(resolve, stepDuration))
          if (videoRef.current) {
            videoRef.current.volume = Math.min(
              targetVolume,
              (i + 1) * volumeStep,
            )
          }
        }
      }
    },
    [videoRef, state.volume],
  )

  /**
   * 執行平滑轉換
   */
  const executeSmoothTransition = useCallback(
    async (_fromTime: number, toTime: number) => {
      if (!videoRef.current) return

      setTransitionState('preparing')

      // 初始化聲音上下文
      initAudioContext()

      // 開始淡出
      setTransitionState('transitioning')
      await fadeOutAudio(finalConfig.audioFadeDuration)

      // 更新進度
      setTransitionProgress(0.5)

      // 執行時間跳轉
      videoRef.current.currentTime = toTime

      // 等待影片準備就緒
      await new Promise<void>((resolve) => {
        const handleCanPlay = () => {
          videoRef.current?.removeEventListener('canplay', handleCanPlay)
          resolve()
        }
        videoRef.current?.addEventListener('canplay', handleCanPlay)
      })

      // 開始淡入
      await fadeInAudio(finalConfig.audioFadeDuration)

      setTransitionProgress(1)
      setTransitionState('completed')

      // 重置狀態
      setTimeout(() => {
        setTransitionState('idle')
        setTransitionProgress(0)
      }, 100)
    },
    [
      videoRef,
      initAudioContext,
      fadeOutAudio,
      fadeInAudio,
      finalConfig.audioFadeDuration,
    ],
  )

  /**
   * 預加載下一個片段
   */
  const preloadNextSegment = useCallback(
    (_nextStartTime: number) => {
      if (!videoRef.current) return

      // 設置預加載範圍
      // 使用 MediaSource API 或 Range 請求進行預加載
      // 這裡簡化實現，實際可以根據瀏覽器支持情況優化
    },
    [videoRef, finalConfig.preloadAdvance],
  )

  /**
   * 智能轉換時機判斷
   */
  const shouldTransition = useCallback(
    (currentTime: number, segmentEnd: number) => {
      const timeToEnd = segmentEnd - currentTime

      // 動態調整容差：接近結束時使用更小的容差
      const dynamicTolerance = Math.max(
        0.01,
        Math.min(finalConfig.transitionTolerance, timeToEnd * 0.1),
      )

      return currentTime >= segmentEnd - dynamicTolerance
    },
    [finalConfig.transitionTolerance],
  )

  /**
   * 清理資源
   */
  useEffect(() => {
    return () => {
      const { audioContext } = transitionRef.current
      if (audioContext) {
        audioContext.close()
      }
    }
  }, [])

  return {
    transitionState,
    transitionProgress,
    executeSmoothTransition,
    preloadNextSegment,
    shouldTransition,
    config: finalConfig,
  }
}
