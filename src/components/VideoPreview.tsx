import React, { useEffect, useMemo } from 'react'
import type { TranscriptSentence } from '../types'
import { HighlightTimeline } from './HighlightTimeline'
import { VideoControls } from './VideoControls'
import { useVideoPlayer } from '../hooks/useVideoPlayer'
import { useVideoPlayerContext } from '../contexts/useVideoPlayerContext'

/**
 * Props for the VideoPreview component
 */
interface VideoPreviewProps {
  /** URL of the video to display */
  videoUrl: string
  /** Array of selected transcript sentences for highlight playback */
  selectedSentences: TranscriptSentence[]
  /** Array of all transcript sentences for timeline display */
  allSentences?: TranscriptSentence[]
}

/**
 * VideoPreview component displays the video player with controls and timeline
 * Handles video playback, subtitle overlay, and highlight sequence management
 *
 * @param props - Component props
 * @returns JSX element containing video player interface
 */
export const VideoPreview: React.FC<VideoPreviewProps> = ({
  videoUrl,
  selectedSentences,
  allSentences,
}) => {
  const { state, dispatch } = useVideoPlayerContext()
  const { videoRef, play, pause } = useVideoPlayer()

  const {
    currentTime,
    isPlaying,
    isPlayingHighlights,
    currentSegmentIndex,
    highlightRanges,
  } = state

  /**
   * Set videoRef in global state - this is the only direct DOM interaction needed
   * All other video interactions are handled through the context and effects
   */
  useEffect(() => {
    if (videoRef.current) {
      dispatch({ type: 'SET_VIDEO_REF', payload: videoRef })
    }
  }, [videoRef, dispatch])

  /**
   * Memoized current subtitle text based on playback mode and time
   * Shows subtitles for selected segments during both regular and highlight playback
   * Optimized with useMemo to prevent unnecessary recalculations
   */
  const currentSubtitle = useMemo((): string => {
    if (isPlayingHighlights && highlightRanges.length > 0) {
      // During highlight playback, show text for the current segment
      const currentSegment = highlightRanges[currentSegmentIndex]
      if (currentSegment) {
        // Use Map for O(1) lookup instead of O(n) find
        const sentenceMap = new Map(
          selectedSentences.map((sentence) => [sentence.id, sentence]),
        )
        const currentSentence = sentenceMap.get(currentSegment.id)
        return currentSentence?.text || ''
      }
      return ''
    } else {
      // During regular playback, show subtitle for any selected segment at current time
      // Only search through selected sentences for better performance
      const selectedOnly = selectedSentences.filter(
        (sentence) => sentence.isSelected,
      )
      const currentSentence = selectedOnly.find(
        (sentence) =>
          currentTime >= sentence.startTime && currentTime <= sentence.endTime,
      )
      return currentSentence?.text || ''
    }
  }, [
    isPlayingHighlights,
    highlightRanges,
    currentSegmentIndex,
    selectedSentences,
    currentTime,
  ])

  return (
    <div
      data-testid="video-preview"
      className="lg:h-full flex flex-col min-h-0"
    >
      <h3 className="mt-0 text-white border-b border-neutral-700 pb-2 text-sm md:text-base font-medium flex-shrink-0">
        預覽區域
      </h3>

      {/* 桌面版：播放控制在上方 */}
      <div className="hidden lg:block flex-shrink-0">
        <VideoControls
          data-testid="video-controls"
          selectedCount={selectedSentences.length}
          selectedSentences={selectedSentences}
        />
      </div>

      {/* No-selection handling and messaging */}
      {selectedSentences.length === 0 && (
        <div
          className="bg-yellow-900/50 border border-yellow-600 rounded-lg p-2 md:p-4 mb-2 md:mb-4 flex-shrink-0"
          data-testid="no-selection-warning"
        >
          <div className="flex items-center gap-2">
            <span className="text-yellow-400 text-sm md:text-base">⚠️</span>
            <span className="text-yellow-200 text-xs md:text-sm">
              請先在轉錄文本中選擇要播放的片段，然後點擊「播放高亮片段」按鈕
            </span>
          </div>
        </div>
      )}

      <div className="relative mb-2 md:mb-4" data-testid="video-container">
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-full max-h-[400px] rounded-lg cursor-pointer object-contain lg:rounded-b-none lg:mx-0 lg:px-0"
          onClick={isPlaying ? pause : play}
          data-testid="video-element"
        />

        {currentSubtitle && (
          <div
            className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-black/90 text-white px-2 md:px-4 py-1 md:py-2 rounded-lg text-xs md:text-sm lg:text-base max-w-[90%] md:max-w-[85%] text-center pointer-events-none shadow-lg border border-white/20"
            data-testid="subtitle-overlay"
            style={{
              textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(4px)',
            }}
          >
            {currentSubtitle}
          </div>
        )}
      </div>

      {/* 時間軸 - 桌面版貼影片，手機版獨立 */}
      <div className="flex-shrink-0 lg:rounded-b-lg lg:bg-neutral-700 lg:p-2">
        <HighlightTimeline
          data-testid="highlight-timeline"
          allSentences={allSentences || []}
        />
      </div>

      {/* 手機版：播放控制在時間軸下方 */}
      <div className="lg:hidden flex-shrink-0 mt-2">
        <VideoControls
          data-testid="video-controls-mobile"
          selectedCount={selectedSentences.length}
          selectedSentences={selectedSentences}
        />
      </div>
    </div>
  )
}
