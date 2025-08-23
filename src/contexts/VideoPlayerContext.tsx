import React, { createContext } from 'react'
import type { Action, VideoPlayerState } from '../reducers/videoPlayerReducer'

/**
 * Type definition for the video player context value
 */
interface VideoPlayerContextType {
  /** Current video player state */
  state: VideoPlayerState
  /** Dispatch function for state updates */
  dispatch: React.Dispatch<Action>
}

/**
 * React context for video player state management
 * Provides state and dispatch function to child components
 */
export const VideoPlayerContext = createContext<
  VideoPlayerContextType | undefined
>(undefined)
