import React, { useReducer, type ReactNode } from 'react'
import {
  videoPlayerReducer,
  initialState,
} from '../reducers/videoPlayerReducer'
import { VideoPlayerContext } from './VideoPlayerContext'

/**
 * Props for the VideoPlayerProvider component
 */
interface VideoPlayerProviderProps {
  /** Child components that will have access to video player context */
  children: ReactNode
}

/**
 * Provider component for video player context
 * Wraps the application with video player state management
 *
 * @param props - Component props
 * @returns JSX element providing video player context
 */
export const VideoPlayerProvider: React.FC<VideoPlayerProviderProps> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(videoPlayerReducer, initialState)

  return (
    <VideoPlayerContext.Provider value={{ state, dispatch }}>
      {children}
    </VideoPlayerContext.Provider>
  )
}
