import { useEffect, useCallback, useRef, type RefObject } from 'react'
import { useVideoPlayerContext } from '../contexts/useVideoPlayerContext'

/**
 * Centralized hook for managing video DOM effects and event listeners.
 * This hook consolidates all video-related side effects in one place,
 * ensuring no duplicate event listeners and proper state-DOM synchronization.
 *
 * @param videoRef - Reference to the video DOM element
 */
export const useVideoEffects = (
  videoRef: RefObject<HTMLVideoElement | null>,
) => {
  const { state, dispatch } = useVideoPlayerContext()
  const throttleRef = useRef<{ last: number } | null>({ last: 0 })
  const video = videoRef.current // Extract video element here
  const eventListenersRef = useRef<{
    timeupdate: (() => void) | null
    loadedmetadata: (() => void) | null
    play: (() => void) | null
    pause: (() => void) | null
    ended: (() => void) | null
    error: (() => void) | null
    loadstart: (() => void) | null
    canplay: (() => void) | null
    seeking: (() => void) | null
    seeked: (() => void) | null
  }>({
    timeupdate: null,
    loadedmetadata: null,
    play: null,
    pause: null,
    ended: null,
    error: null,
    loadstart: null,
    canplay: null,
    seeking: null,
    seeked: null,
  })

  // Effect: Reset sync state when highlight playback ends to ensure clean state
  useEffect(() => {
    if (!state.isPlayingHighlights && state.syncState !== 'idle') {
      // Small delay to ensure all highlight-related effects have completed
      const timeoutId = setTimeout(() => {
        dispatch({ type: 'RESET_SYNC_STATE' })
      }, 100)

      return () => clearTimeout(timeoutId)
    }
  }, [state.isPlayingHighlights, state.syncState, dispatch])

  /**
   * Throttled timeupdate handler for performance optimization
   * Limits time updates to once every 100ms to prevent excessive re-renders
   */
  const throttledTimeUpdate = useCallback(
    (currentTime: number) => {
      const now = Date.now()
      const last = throttleRef.current?.last ?? 0
      if (now - last >= 100) {
        throttleRef.current = { last: now }
        dispatch({ type: 'UPDATE_TIME', payload: currentTime })
      }
    },
    [dispatch],
  )

  // Consolidated effect for all video DOM synchronization
  useEffect(() => {
    if (!video) return

    // Sync isPlaying state with DOM
    if (state.isPlaying) {
      const playPromise = video.play()
      if (playPromise) {
        playPromise.catch(() => {
          dispatch({ type: 'SET_ERROR', payload: 'Failed to play video' })
          dispatch({ type: 'SYNC_PLAY_STATE', payload: false })
        })
      }
    } else {
      video.pause()
    }

    // Sync volume and mute state with DOM
    video.volume = state.volume
    video.muted = state.isMuted

    // Handle seek operations with sync state tracking
    if (state.pendingSeek !== null) {
      // Set sync state to seeking before applying seek
      if (state.syncState !== 'seeking') {
        dispatch({ type: 'SET_SYNC_STATE', payload: 'seeking' })
      }

      video.currentTime = state.pendingSeek
      dispatch({ type: 'CLEAR_PENDING_SEEK' })
    }
  }, [
    video,
    state.isPlaying,
    state.volume,
    state.isMuted,
    state.pendingSeek,
    state.syncState,
    dispatch,
  ])

  // Consolidated event listener attachment with cleanup
  useEffect(() => {
    if (!video) return

    /**
     * Event handlers for video element
     * All handlers dispatch actions to maintain pure state management
     */
    const handleTimeUpdate = () => {
      throttledTimeUpdate(video.currentTime)
    }

    const handleLoadedMetadata = () => {
      dispatch({ type: 'SET_DURATION', payload: video.duration })
    }

    const handlePlay = () => {
      dispatch({ type: 'SYNC_PLAY_STATE', payload: true })
    }

    const handlePause = () => {
      dispatch({ type: 'SYNC_PLAY_STATE', payload: false })
    }

    const handleEnded = () => {
      dispatch({ type: 'HANDLE_VIDEO_ENDED' })
    }

    const handleError = () => {
      dispatch({ type: 'SET_ERROR', payload: 'Video playback error occurred' })
    }

    const handleLoadStart = () => {
      dispatch({ type: 'SET_LOADING', payload: true })
    }

    const handleCanPlay = () => {
      dispatch({ type: 'SET_LOADING', payload: false })
      dispatch({ type: 'CLEAR_ERROR' })
    }

    // Ensure current time state stays in sync on explicit seeks as well
    // Some environments may not emit frequent timeupdate events while paused
    const handleSeeking = () => {
      dispatch({ type: 'UPDATE_TIME', payload: video.currentTime })
      dispatch({ type: 'SET_SYNC_STATE', payload: 'seeking' })
    }

    const handleSeeked = () => {
      dispatch({ type: 'UPDATE_TIME', payload: video.currentTime })
      dispatch({ type: 'SET_SYNC_STATE', payload: 'synced' })
    }

    // Store references to event listeners for cleanup
    eventListenersRef.current = {
      timeupdate: handleTimeUpdate,
      loadedmetadata: handleLoadedMetadata,
      play: handlePlay,
      pause: handlePause,
      ended: handleEnded,
      error: handleError,
      loadstart: handleLoadStart,
      canplay: handleCanPlay,
      seeking: handleSeeking,
      seeked: handleSeeked,
    }

    // Attach all event listeners
    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('ended', handleEnded)
    video.addEventListener('error', handleError)
    video.addEventListener('loadstart', handleLoadStart)
    video.addEventListener('canplay', handleCanPlay)
    video.addEventListener('seeking', handleSeeking)
    video.addEventListener('seeked', handleSeeked)

    // Cleanup function
    return () => {
      // Clear any pending throttled updates
      throttleRef.current = { last: Date.now() }

      // Remove all event listeners using stored references
      const listeners = eventListenersRef.current
      if (listeners.timeupdate)
        video.removeEventListener('timeupdate', listeners.timeupdate)
      if (listeners.loadedmetadata)
        video.removeEventListener('loadedmetadata', listeners.loadedmetadata)
      if (listeners.play) video.removeEventListener('play', listeners.play)
      if (listeners.pause) video.removeEventListener('pause', listeners.pause)
      if (listeners.ended) video.removeEventListener('ended', listeners.ended)
      if (listeners.error) video.removeEventListener('error', listeners.error)
      if (listeners.loadstart)
        video.removeEventListener('loadstart', listeners.loadstart)
      if (listeners.canplay)
        video.removeEventListener('canplay', listeners.canplay)
      if (listeners.seeking)
        video.removeEventListener('seeking', listeners.seeking)
      if (listeners.seeked)
        video.removeEventListener('seeked', listeners.seeked)

      // Clear stored references
      eventListenersRef.current = {
        timeupdate: null,
        loadedmetadata: null,
        play: null,
        pause: null,
        ended: null,
        error: null,
        loadstart: null,
        canplay: null,
        seeking: null,
        seeked: null,
      }
    }
  }, [video, dispatch, throttledTimeUpdate])
}
