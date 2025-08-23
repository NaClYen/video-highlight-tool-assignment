import { useContext } from 'react'
import { VideoPlayerContext } from './VideoPlayerContext'

/**
 * Hook to access video player context
 * Must be used within a VideoPlayerProvider
 *
 * @returns Video player context containing state and dispatch
 * @throws Error if used outside of VideoPlayerProvider
 */
export const useVideoPlayerContext = () => {
  const context = useContext(VideoPlayerContext)
  if (context === undefined) {
    throw new Error(
      'useVideoPlayerContext must be used within a VideoPlayerProvider',
    )
  }
  return context
}
