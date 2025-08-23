import React from 'react'
import { type TranscriptSentence } from '../types'

/**
 * Represents a highlight range with time boundaries
 */
export interface HighlightRange {
  /** Start time in seconds */
  start: number
  /** End time in seconds */
  end: number
  /** Unique identifier for the highlight range */
  id: string
}

/**
 * Complete state shape for the video player
 * Manages both regular video playback and highlight sequence playback
 */
export interface VideoPlayerState {
  /** Whether the video is currently playing */
  isPlaying: boolean
  /** Whether the video is muted */
  isMuted: boolean
  /** Volume level (0 to 1) */
  volume: number
  /** Current playback time in seconds */
  currentTime: number
  /** Total video duration in seconds */
  duration: number
  /** Array of highlight ranges for sequence playback */
  highlightRanges: HighlightRange[]
  /** Reference to the video DOM element */
  videoRef: React.RefObject<HTMLVideoElement | null> | null
  /** Whether currently playing highlight sequence */
  isPlayingHighlights: boolean
  /** Index of current segment in highlight sequence */
  currentSegmentIndex: number
  /** Pending seek operation (for effect synchronization) */
  pendingSeek: number | null
  /** Loading state indicator */
  isLoading: boolean
  /** Error message if any */
  error: string | null
  /** Synchronization state tracking */
  syncState: 'idle' | 'seeking' | 'synced'
  /** Source of the last seek operation */
  lastSeekSource: 'user' | 'highlight' | 'timestamp' | 'timeline'
  /** Navigation state for segment jumping */
  navigation: {
    /** Array of indices of selected segments in sorted order */
    selectedSegmentIndices: number[]
    /** Whether navigation to previous segment is available */
    canNavigatePrevious: boolean
    /** Whether navigation to next segment is available */
    canNavigateNext: boolean
    /** Index of current segment in the selected segments array */
    currentSelectedSegmentIndex: number
  }
}

/**
 * All possible actions that can be dispatched to the video player reducer
 * Organized into categories: basic controls, synchronization, error handling, highlights, and navigation
 */
export type Action =
  // Basic video controls
  | {
      type: 'SET_VIDEO_REF'
      payload: React.RefObject<HTMLVideoElement | null>
    }
  | { type: 'PLAY' }
  | { type: 'PAUSE' }
  | { type: 'UPDATE_TIME'; payload: number }
  | { type: 'SET_DURATION'; payload: number }
  | { type: 'SEEK'; payload: number }
  | { type: 'SET_VOLUME'; payload: number }
  | { type: 'TOGGLE_MUTE' }
  // Enhanced synchronization actions with seek source tracking
  | { type: 'CLEAR_PENDING_SEEK' }
  | { type: 'SYNC_PLAY_STATE'; payload: boolean }
  | { type: 'HANDLE_VIDEO_ENDED' }
  | {
      type: 'SEEK_TO_TIMESTAMP'
      payload: { time: number; source: 'timestamp' }
    }
  | {
      type: 'SEEK_TO_TIMELINE'
      payload: { time: number; source: 'timeline' }
    }
  | { type: 'RESET_SYNC_STATE' }
  | { type: 'SET_SYNC_STATE'; payload: 'idle' | 'seeking' | 'synced' }
  | { type: 'HIGHLIGHT_PLAYBACK_END' }
  // Error handling actions
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_LOADING'; payload: boolean }
  // Highlight sequence actions
  | { type: 'ADD_HIGHLIGHT'; payload: { start: number; end: number } }
  | { type: 'SET_IS_PLAYING_HIGHLIGHTS'; payload: boolean }
  | { type: 'SET_CURRENT_SEGMENT_INDEX'; payload: number }
  | { type: 'SET_HIGHLIGHT_RANGES'; payload: HighlightRange[] }
  | { type: 'RESET_HIGHLIGHT_PLAYBACK' }
  | { type: 'PLAY_HIGHLIGHT_SEQUENCE'; payload: TranscriptSentence[] }
  | {
      type: 'TRANSITION_TO_NEXT_SEGMENT'
      payload: { nextIndex: number; nextStartTime: number }
    }
  // Navigation actions
  | { type: 'NAVIGATE_TO_PREVIOUS_SEGMENT'; payload: TranscriptSentence[] }
  | { type: 'NAVIGATE_TO_NEXT_SEGMENT'; payload: TranscriptSentence[] }
  | { type: 'UPDATE_NAVIGATION_STATE'; payload: TranscriptSentence[] }

/**
 * Helper function to determine navigation availability based on selected sentences and current time
 * @param selectedSentences - Array of selected transcript sentences
 * @param currentTime - Current video playback time
 * @returns Navigation state information
 */
export function calculateNavigationState(
  selectedSentences: TranscriptSentence[],
  currentTime: number,
): {
  selectedSegmentIndices: number[]
  canNavigatePrevious: boolean
  canNavigateNext: boolean
  currentSelectedSegmentIndex: number
} {
  if (selectedSentences.length === 0) {
    return {
      selectedSegmentIndices: [],
      canNavigatePrevious: false,
      canNavigateNext: false,
      currentSelectedSegmentIndex: -1,
    }
  }

  // Sort selected sentences by start time and get their indices
  const sortedSelected = selectedSentences
    .map((sentence, index) => ({ sentence, originalIndex: index }))
    .filter(({ sentence }) => sentence.isSelected)
    .sort((a, b) => a.sentence.startTime - b.sentence.startTime)

  const selectedSegmentIndices = sortedSelected.map(
    ({ originalIndex }) => originalIndex,
  )

  // Find current segment index in the selected segments array
  // Since we have guaranteed gaps between segments, we can use exact matching
  const currentSelectedSegmentIndex = sortedSelected.findIndex(
    ({ sentence }) =>
      currentTime >= sentence.startTime && currentTime <= sentence.endTime,
  )

  // Determine navigation availability
  let canNavigatePrevious = false
  let canNavigateNext = false

  if (currentSelectedSegmentIndex === -1) {
    // Not currently in a selected segment
    // Can navigate previous if there's a selected segment before current time
    canNavigatePrevious = sortedSelected.some(
      ({ sentence }) => sentence.startTime < currentTime,
    )
    // Can navigate next if there's a selected segment after current time
    canNavigateNext = sortedSelected.some(
      ({ sentence }) => sentence.startTime > currentTime,
    )
  } else {
    // Currently in a selected segment
    canNavigatePrevious = currentSelectedSegmentIndex > 0
    canNavigateNext = currentSelectedSegmentIndex < sortedSelected.length - 1
  }

  return {
    selectedSegmentIndices,
    canNavigatePrevious,
    canNavigateNext,
    currentSelectedSegmentIndex,
  }
}

/**
 * Helper function to find the previous selected segment relative to current time
 * @param selectedSentences - Array of selected transcript sentences
 * @param currentTime - Current video playback time
 * @returns Previous selected sentence or null if none exists
 */
export function findPreviousSelectedSegment(
  selectedSentences: TranscriptSentence[],
  currentTime: number,
): TranscriptSentence | null {
  const sortedSelected = selectedSentences
    .filter((s) => s.isSelected)
    .sort((a, b) => a.startTime - b.startTime)

  if (sortedSelected.length === 0) {
    return null
  }

  // Since we have guaranteed gaps between segments, we can use exact matching
  const currentIndex = sortedSelected.findIndex((s) => {
    const isInRange = currentTime >= s.startTime && currentTime <= s.endTime

    return isInRange
  })

  if (currentIndex === -1) {
    const previousIndex = sortedSelected.findLastIndex(
      (s: TranscriptSentence) => {
        const isBefore = s.startTime < currentTime

        return isBefore
      },
    )

    const result = previousIndex >= 0 ? sortedSelected[previousIndex] : null

    return result
  } else {
    const result = currentIndex > 0 ? sortedSelected[currentIndex - 1] : null

    return result
  }
}

/**
 * Helper function to find the next selected segment relative to current time
 * @param selectedSentences - Array of selected transcript sentences
 * @param currentTime - Current video playback time
 * @returns Next selected sentence or null if none exists
 */
export function findNextSelectedSegment(
  selectedSentences: TranscriptSentence[],
  currentTime: number,
): TranscriptSentence | null {
  const sortedSelected = selectedSentences
    .filter((s) => s.isSelected)
    .sort((a, b) => a.startTime - b.startTime)

  if (sortedSelected.length === 0) return null

  // Since we have guaranteed gaps between segments, we can use exact matching
  const currentIndex = sortedSelected.findIndex(
    (s) => currentTime >= s.startTime && currentTime <= s.endTime,
  )

  if (currentIndex === -1) {
    // Not currently in a selected segment, find the next one after current time
    const nextIndex = sortedSelected.findIndex((s) => s.startTime > currentTime)
    return nextIndex >= 0 ? sortedSelected[nextIndex] : null
  } else {
    // Currently in a selected segment, go to next one
    return currentIndex + 1 < sortedSelected.length
      ? sortedSelected[currentIndex + 1]
      : null
  }
}

/**
 * Initial state for the video player
 * All values set to safe defaults
 */
export const initialState: VideoPlayerState = {
  isPlaying: false,
  isMuted: false,
  volume: 0.5,
  currentTime: 0,
  duration: 0,
  highlightRanges: [],
  videoRef: null,
  isPlayingHighlights: false,
  currentSegmentIndex: -1,
  pendingSeek: null,
  isLoading: false,
  error: null,
  syncState: 'idle',
  lastSeekSource: 'user',
  navigation: {
    selectedSegmentIndices: [],
    canNavigatePrevious: false,
    canNavigateNext: false,
    currentSelectedSegmentIndex: -1,
  },
}

/**
 * Pure reducer function for video player state management
 * Handles all state transitions without side effects
 *
 * @param state - Current video player state
 * @param action - Action to process
 * @returns New state after applying the action
 */
export function videoPlayerReducer(
  state: VideoPlayerState,
  action: Action,
): VideoPlayerState {
  switch (action.type) {
    case 'SET_VIDEO_REF':
      return { ...state, videoRef: action.payload }
    case 'PLAY':
      return { ...state, isPlaying: true }
    case 'PAUSE':
      return { ...state, isPlaying: false }
    case 'UPDATE_TIME': {
      // Note: Navigation state should be updated separately via UPDATE_NAVIGATION_STATE
      // to avoid performance issues with frequent time updates
      return { ...state, currentTime: action.payload }
    }
    case 'SET_DURATION':
      return { ...state, duration: action.payload }
    case 'SEEK':
      // Record intent; effects will apply to element and then clear pendingSeek
      return {
        ...state,
        currentTime: action.payload,
        pendingSeek: action.payload,
        syncState: 'seeking',
        lastSeekSource: 'user',
      }
    case 'SET_VOLUME':
      return { ...state, volume: action.payload }
    case 'TOGGLE_MUTE':
      return { ...state, isMuted: !state.isMuted }
    case 'CLEAR_PENDING_SEEK':
      return {
        ...state,
        pendingSeek: null,
        syncState: 'synced',
      }
    case 'SYNC_PLAY_STATE':
      // Trust external event source of truth
      return { ...state, isPlaying: action.payload }
    case 'HANDLE_VIDEO_ENDED':
      return {
        ...state,
        isPlaying: false,
        isPlayingHighlights: false,
        currentSegmentIndex: -1,
        syncState: 'idle',
      }
    case 'SEEK_TO_TIMESTAMP':
      return {
        ...state,
        currentTime: action.payload.time,
        pendingSeek: action.payload.time,
        syncState: 'seeking',
        lastSeekSource: action.payload.source,
      }
    case 'SEEK_TO_TIMELINE':
      return {
        ...state,
        currentTime: action.payload.time,
        pendingSeek: action.payload.time,
        syncState: 'seeking',
        lastSeekSource: action.payload.source,
      }
    case 'RESET_SYNC_STATE':
      return {
        ...state,
        syncState: 'idle',
        lastSeekSource: 'user',
      }
    case 'SET_SYNC_STATE':
      return {
        ...state,
        syncState: action.payload,
      }
    case 'HIGHLIGHT_PLAYBACK_END':
      return {
        ...state,
        isPlayingHighlights: false,
        currentSegmentIndex: -1,
        syncState: 'idle',
      }
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    case 'CLEAR_ERROR':
      return { ...state, error: null }
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    case 'ADD_HIGHLIGHT': {
      const newHighlight = {
        ...action.payload,
        id: `highlight-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`, // Simple unique ID
      }
      return {
        ...state,
        highlightRanges: [...state.highlightRanges, newHighlight],
      }
    }
    case 'SET_IS_PLAYING_HIGHLIGHTS':
      return { ...state, isPlayingHighlights: action.payload }
    case 'SET_CURRENT_SEGMENT_INDEX':
      return { ...state, currentSegmentIndex: action.payload }
    case 'SET_HIGHLIGHT_RANGES':
      return { ...state, highlightRanges: action.payload }
    case 'RESET_HIGHLIGHT_PLAYBACK':
      return {
        ...state,
        isPlaying: false,
        isPlayingHighlights: false,
        currentSegmentIndex: -1,
        syncState: 'idle',
        // highlightRanges: [], // Do not clear highlightRanges here, they are set when playing a sequence
      }
    case 'PLAY_HIGHLIGHT_SEQUENCE': {
      // Filter selected sentences first
      const selectedSentences = action.payload.filter(
        (sentence) => sentence.isSelected,
      )

      if (selectedSentences.length === 0) {
        return state
      }

      const segments: HighlightRange[] = []

      selectedSentences
        .sort((a, b) => a.startTime - b.startTime)
        .forEach((sentence) => {
          segments.push({
            id: sentence.id,
            start: sentence.startTime,
            end: sentence.endTime,
          })
        })

      return {
        ...state,
        highlightRanges: segments,
        currentSegmentIndex: 0,
        isPlayingHighlights: true,
        isPlaying: true, // Autoplay when sequence is initiated
        // Set pending seek to the start of the first segment
        pendingSeek: segments[0].start,
        syncState: 'seeking',
        lastSeekSource: 'highlight',
      }
    }
    case 'TRANSITION_TO_NEXT_SEGMENT': {
      const { nextIndex, nextStartTime } = action.payload
      return {
        ...state,
        currentTime: nextStartTime,
        pendingSeek: nextStartTime,
        syncState: 'seeking',
        lastSeekSource: 'highlight',
        currentSegmentIndex: nextIndex,
      }
    }
    case 'UPDATE_NAVIGATION_STATE': {
      const navigationState = calculateNavigationState(
        action.payload,
        state.currentTime,
      )
      return {
        ...state,
        navigation: navigationState,
      }
    }
    case 'NAVIGATE_TO_PREVIOUS_SEGMENT': {
      const targetSentence = findPreviousSelectedSegment(
        action.payload,
        state.currentTime,
      )

      if (targetSentence) {
        const newNavigationState = calculateNavigationState(
          action.payload,
          targetSentence.startTime,
        )
        return {
          ...state,
          currentTime: targetSentence.startTime,
          pendingSeek: targetSentence.startTime,
          syncState: 'seeking',
          lastSeekSource: 'user',
          navigation: newNavigationState,
        }
      }
      return state
    }
    case 'NAVIGATE_TO_NEXT_SEGMENT': {
      const targetSentence = findNextSelectedSegment(
        action.payload,
        state.currentTime,
      )

      if (targetSentence) {
        const newNavigationState = calculateNavigationState(
          action.payload,
          targetSentence.startTime,
        )
        return {
          ...state,
          currentTime: targetSentence.startTime,
          pendingSeek: targetSentence.startTime,
          syncState: 'seeking',
          lastSeekSource: 'user',
          navigation: newNavigationState,
        }
      }
      return state
    }
    default:
      return state
  }
}
