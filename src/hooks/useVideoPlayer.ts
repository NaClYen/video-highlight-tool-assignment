import { useRef, useCallback, useEffect } from 'react'
import type { TranscriptSentence } from '../types'
import { useVideoPlayerContext } from '../contexts/useVideoPlayerContext'
import { useVideoEffects } from './useVideoEffects'
import { getTransitionConfig } from '../config/transitionConfig'

/**
 * Main hook for video player functionality
 * Provides a clean interface for video controls and highlight playback
 * Integrates with useVideoEffects for DOM synchronization
 *
 * @returns Object containing video controls, state, and highlight methods
 */
export const useVideoPlayer = () => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const { state, dispatch } = useVideoPlayerContext()
  const {
    highlightRanges,
    isPlayingHighlights,
    currentSegmentIndex,
    currentTime,
  } = state

  // Track last segment transition to prevent rapid transitions
  const lastSegmentTransitionRef = useRef<number>(0)

  // Apply centralized video effects - this handles all DOM synchronization
  useVideoEffects(videoRef)

  // Get transition configuration
  const transitionConfig = getTransitionConfig()

  /**
   * Handle highlight playback logic when time updates
   * Manages segment transitions during highlight playback
   */
  useEffect(() => {
    if (!isPlayingHighlights || !highlightRanges.length) {
      return
    }

    const currentSegment = highlightRanges[currentSegmentIndex]

    if (!currentSegment) {
      return
    }

    // Don't run highlight logic if there's a pending seek operation
    // This prevents race conditions during initial seek to first segment
    if (state.pendingSeek !== null) {
      return
    }

    // Use simple timing logic for segment transitions
    const timeToEnd = currentSegment.end - currentTime
    const shouldTransitionNow =
      timeToEnd <= transitionConfig.transitionTolerance

    if (shouldTransitionNow) {
      // Prevent rapid segment transitions - minimum 0.5s between transitions
      const now = Date.now()
      if (now - lastSegmentTransitionRef.current < 500) {
        return
      }
      lastSegmentTransitionRef.current = now

      // Auto-advance to next segment
      const nextIndex = currentSegmentIndex + 1

      if (nextIndex < highlightRanges.length) {
        const nextSegment = highlightRanges[nextIndex]
        dispatch({
          type: 'TRANSITION_TO_NEXT_SEGMENT',
          payload: { nextIndex, nextStartTime: nextSegment.start },
        })
      } else {
        // End of highlight sequence - loop back to first segment
        const firstSegment = highlightRanges[0]
        dispatch({
          type: 'TRANSITION_TO_NEXT_SEGMENT',
          payload: { nextIndex: 0, nextStartTime: firstSegment.start },
        })
      }
    }
  }, [
    currentTime,
    isPlayingHighlights,
    currentSegmentIndex,
    highlightRanges,
    state.pendingSeek,
    dispatch,
    transitionConfig.transitionTolerance,
  ])

  /**
   * Basic video control methods
   * All methods dispatch actions to maintain pure state management
   */
  const play = useCallback(() => {
    dispatch({ type: 'PLAY' })
  }, [dispatch])

  const pause = useCallback(() => {
    dispatch({ type: 'PAUSE' })
  }, [dispatch])

  const seekTo = useCallback(
    (time: number) => {
      // If in highlight mode, clamp seeks to current segment bounds
      if (
        isPlayingHighlights &&
        highlightRanges.length > 0 &&
        currentSegmentIndex >= 0
      ) {
        const currentSegment = highlightRanges[currentSegmentIndex]
        const clampedTime = Math.max(
          currentSegment.start,
          Math.min(time, currentSegment.end),
        )
        dispatch({ type: 'SEEK', payload: clampedTime })
      } else {
        dispatch({ type: 'SEEK', payload: time })
      }
    },
    [isPlayingHighlights, highlightRanges, currentSegmentIndex, dispatch],
  )

  const seekToTimestamp = useCallback(
    (time: number) => {
      dispatch({
        type: 'SEEK_TO_TIMESTAMP',
        payload: { time, source: 'timestamp' },
      })
    },
    [dispatch],
  )

  /**
   * Sets the playback rate of the video
   * Note: This is one of the few direct DOM manipulations allowed
   * as playback rate is not part of the core state management
   */
  const setPlaybackRate = useCallback((rate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate
    }
  }, [])

  /**
   * Highlight-specific methods for managing sequence playback
   */
  const playHighlightSequence = useCallback(
    (selectedSentences: TranscriptSentence[]) => {
      if (selectedSentences.length === 0) {
        return
      }

      // Reset transition tracking when starting new sequence
      lastSegmentTransitionRef.current = 0

      // The reducer now correctly sets up the state, and the effects will handle playback.
      dispatch({ type: 'PLAY_HIGHLIGHT_SEQUENCE', payload: selectedSentences })
    },
    [dispatch], // Removed videoRef from dependencies as it's not used in the effect
  )

  const stopHighlightPlayback = useCallback(() => {
    dispatch({ type: 'RESET_HIGHLIGHT_PLAYBACK' })
    videoRef.current?.pause()
  }, [dispatch])

  /**
   * Navigation methods for jumping between selected segments
   */
  const navigateToPreviousSegment = useCallback(
    (selectedSentences: TranscriptSentence[]) => {
      dispatch({
        type: 'NAVIGATE_TO_PREVIOUS_SEGMENT',
        payload: selectedSentences,
      })
    },
    [dispatch],
  )

  const navigateToNextSegment = useCallback(
    (selectedSentences: TranscriptSentence[]) => {
      dispatch({ type: 'NAVIGATE_TO_NEXT_SEGMENT', payload: selectedSentences })
    },
    [dispatch],
  )

  /**
   * Helper functions to determine navigation availability
   */
  const getNavigationState = useCallback(
    (selectedSentences: TranscriptSentence[]) => {
      const selected = selectedSentences
        .filter((s) => s.isSelected)
        .sort((a, b) => a.startTime - b.startTime)
      if (selected.length === 0) {
        return {
          canNavigatePrevious: false,
          canNavigateNext: false,
          currentSegmentIndex: -1,
          totalSegments: 0,
        }
      }

      const currentIndex = selected.findIndex(
        (s) => currentTime >= s.startTime && currentTime <= s.endTime,
      )

      let canNavigatePrevious = false
      let canNavigateNext = false

      if (currentIndex === -1) {
        // Not currently in a selected segment
        canNavigatePrevious = selected.some((s) => s.startTime < currentTime)
        canNavigateNext = selected.some((s) => s.startTime > currentTime)
      } else {
        // Currently in a selected segment
        canNavigatePrevious = currentIndex > 0
        canNavigateNext = currentIndex < selected.length - 1
      }

      return {
        canNavigatePrevious,
        canNavigateNext,
        currentSegmentIndex: currentIndex,
        totalSegments: selected.length,
      }
    },
    [currentTime],
  )

  return {
    // Existing methods
    videoRef,
    play,
    pause,
    seekTo,
    seekToTimestamp,
    setPlaybackRate,

    // New highlight-specific methods
    playHighlightSequence,
    stopHighlightPlayback,

    // Navigation methods
    navigateToPreviousSegment,
    navigateToNextSegment,
    getNavigationState,

    // State (these are now directly from context, but returned for convenience)
    isPlayingHighlights,
    currentSegmentIndex,
    currentTime,
    highlightRanges,
  }
}
