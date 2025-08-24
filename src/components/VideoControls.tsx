import React, { useCallback } from 'react'
import { useVideoPlayerContext } from '../contexts/useVideoPlayerContext'
import { useVideoPlayer } from '../hooks/useVideoPlayer'
import { type TranscriptSentence } from '../types'
import performanceMonitor from '../utils/performanceMonitor'
import {
  BackwardIcon,
  ForwardIcon,
  PauseIcon,
  PlayIcon,
} from '@heroicons/react/24/outline'

/**
 * Props for the VideoControls component
 */
interface VideoControlsProps {
  /** Number of selected sentences */
  selectedCount: number
  /** Array of selected transcript sentences */
  selectedSentences: TranscriptSentence[]
}

/**
 * VideoControls component provides playback controls
 * Handles play/pause and highlight playback mode
 *
 * @param props - Component props
 * @returns JSX element containing video control buttons and status
 */
export const VideoControls: React.FC<VideoControlsProps> = ({
  selectedCount,
  selectedSentences,
}) => {
  const { state, dispatch } = useVideoPlayerContext()
  const { isPlaying } = state
  const {
    navigateToPreviousSegment,
    navigateToNextSegment,
    getNavigationState,
  } = useVideoPlayer()

  const navigationState = getNavigationState(selectedSentences)

  // Optimized play/pause handler with useCallback to prevent unnecessary re-renders
  const handlePlayPauseClick = useCallback(() => {
    const endTimer = performanceMonitor.startTimer('play-pause-button-click')

    performanceMonitor.measureStateUpdate('play-pause-state-update', () => {
      if (isPlaying) {
        dispatch({ type: 'PAUSE' })
      } else if (selectedCount > 0) {
        dispatch({
          type: 'PLAY_HIGHLIGHT_SEQUENCE',
          payload: selectedSentences,
        })
      } else {
        dispatch({ type: 'PLAY' })
      }
    })

    endTimer()
  }, [isPlaying, selectedCount, selectedSentences, dispatch])

  // Optimized navigation handlers
  const handlePreviousSegment = useCallback(() => {
    const endTimer = performanceMonitor.startTimer(
      'previous-segment-navigation',
    )
    navigateToPreviousSegment(selectedSentences)
    endTimer()
  }, [navigateToPreviousSegment, selectedSentences])

  const handleNextSegment = useCallback(() => {
    const endTimer = performanceMonitor.startTimer('next-segment-navigation')
    navigateToNextSegment(selectedSentences)
    endTimer()
  }, [navigateToNextSegment, selectedSentences])

  return (
    <div className="flex justify-between items-center p-2 md:p-4 bg-neutral-700 rounded-lg flex-col gap-3 md:flex-row md:gap-0">
      <div className="flex gap-1 md:gap-2 w-full md:w-auto justify-center">
        <button
          type="button"
          className="bg-gray-600 text-white px-2 md:px-3 py-1.5 md:py-2 rounded-md text-xs md:text-sm transition-colors hover:bg-gray-700 disabled:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer flex-1 md:flex-none flex items-center justify-center"
          onClick={handlePreviousSegment}
          disabled={selectedCount === 0 || !navigationState.canNavigatePrevious}
          data-testid="previous-segment-button"
          title="上一個片段"
        >
          <BackwardIcon className="w-4 h-4" />
        </button>

        <button
          type="button"
          className="bg-indigo-500 text-white px-3 md:px-4 py-1.5 md:py-2 rounded-md text-lg md:text-xl transition-colors hover:bg-indigo-600 cursor-pointer flex-1 md:flex-none flex items-center justify-center"
          onClick={handlePlayPauseClick}
          data-testid="play-pause-button"
          title={selectedCount > 0 ? '播放選中的高亮片段' : '播放影片'}
        >
          {isPlaying ? (
            <PauseIcon className="w-4 h-4" />
          ) : (
            <PlayIcon className="w-4 h-4" />
          )}
        </button>

        <button
          type="button"
          className="bg-gray-600 text-white px-2 md:px-3 py-1.5 md:py-2 rounded-md text-xs md:text-sm transition-colors hover:bg-gray-700 disabled:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer flex-1 md:flex-none flex items-center justify-center"
          onClick={handleNextSegment}
          disabled={selectedCount === 0 || !navigationState.canNavigateNext}
          data-testid="next-segment-button"
          title="下一個片段"
        >
          <ForwardIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
