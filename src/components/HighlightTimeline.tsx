import React, { useMemo, useCallback, useRef, useState, useEffect } from 'react'
import clsx from 'clsx'
import { useVideoPlayerContext } from '../contexts/useVideoPlayerContext'

import type { TranscriptSentence } from '../types'

/**
 * Props for the HighlightTimeline component
 */
interface HighlightTimelineProps {
  /** Array of all transcript sentences to display on timeline */
  allSentences?: TranscriptSentence[]
}

/**
 * HighlightTimeline component displays a visual timeline of highlight segments
 * Shows all sentences (selected and unselected) with clear visual distinction
 * Provides interactive seeking and segment navigation
 *
 * @param props - Component props
 * @returns JSX element containing the interactive timeline interface
 */
export const HighlightTimeline: React.FC<HighlightTimelineProps> = ({
  allSentences = [],
}) => {
  const { state, dispatch } = useVideoPlayerContext()
  const { highlightRanges, currentTime, duration } = state

  /**
   * Formats time in seconds to MM:SS format
   * @param seconds - Time in seconds
   * @returns Formatted time string
   */
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`
  }

  // Debounced timeline position to prevent jittering during highlight playback
  const [debouncedPosition, setDebouncedPosition] = useState(0)
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Debounce timeline position updates to reduce jittering
  useEffect(() => {
    const newPosition = (currentTime / duration) * 100

    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    debounceTimeoutRef.current = setTimeout(() => {
      setDebouncedPosition(newPosition)
    }, 100)

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [currentTime, duration])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [])

  /**
   * Get segments to display - show ALL sentences, not just selected ones
   * This creates visual consistency with the editing area
   */
  const displaySegments = useMemo(() => {
    // Show all sentences, marking which ones are selected and in highlight sequence
    return allSentences.map((sentence) => ({
      id: sentence.id,
      start: sentence.startTime,
      end: sentence.endTime,
      isSelected: sentence.isSelected,
      isInHighlightSequence: highlightRanges.some(
        (range) => range.id === sentence.id,
      ),
    }))
  }, [highlightRanges, allSentences])

  const getSegmentStyle = (segment: {
    id: string
    start: number
    end: number
    isSelected: boolean
    isInHighlightSequence: boolean
  }) => {
    const left = (segment.start / duration) * 100
    const width = ((segment.end - segment.start) / duration) * 100
    return {
      left: `${left}%`,
      width: `${width}%`,
    }
  }

  const getCurrentTimePosition = () => {
    // Use debounced position to prevent jittering
    return debouncedPosition
  }

  const timelineRef = useRef<HTMLDivElement>(null)

  const handleTimelineClick = useCallback(
    (event: React.MouseEvent) => {
      if (!timelineRef.current) return

      const rect = timelineRef.current.getBoundingClientRect()
      const clickX = event.clientX - rect.left
      const percentage = clickX / rect.width
      const seekTime = percentage * duration

      // Clamp to valid range
      const clampedTime = Math.max(0, Math.min(seekTime, duration))

      dispatch({
        type: 'SEEK_TO_TIMELINE',
        payload: { time: clampedTime, source: 'timeline' },
      })
    },
    [duration, dispatch],
  )

  const handleTimelineDrag = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      const handleMouseMove = (e: MouseEvent) => {
        const rect = timelineRef.current?.getBoundingClientRect()
        if (!rect) return

        const x = e.clientX - rect.left
        const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100))
        const time = (percentage / 100) * duration
        const clampedTime = Math.max(0, Math.min(duration, time))

        dispatch({
          type: 'SEEK_TO_TIMELINE',
          payload: { time: clampedTime, source: 'timeline' },
        })
      }

      const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)

      // Prevent text selection during drag
      event.preventDefault()
    },
    [duration, dispatch],
  )

  // Touch support for mobile devices
  const handleTouchStart = useCallback(() => {
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      const rect = timelineRef.current?.getBoundingClientRect()
      if (!rect) return

      const touch = e.touches[0]
      const x = touch.clientX - rect.left
      const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100))
      const time = (percentage / 100) * duration
      const clampedTime = Math.max(0, Math.min(duration, time))

      dispatch({
        type: 'SEEK_TO_TIMELINE',
        payload: { time: clampedTime, source: 'timeline' },
      })
    }

    const handleTouchEnd = () => {
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }

    document.addEventListener('touchmove', handleTouchMove)
    document.addEventListener('touchend', handleTouchEnd)
  }, [duration, dispatch])

  return (
    <div className="mt-2 md:mt-4 lg:mt-0" data-testid="highlight-timeline">
      <div className="flex justify-between items-center mb-2 md:mb-4 lg:mb-2">
        <h4 className="text-white m-0 flex items-center gap-2 text-sm md:text-base lg:text-sm">
          高亮片段時間軸
        </h4>
        <span className="text-neutral-300 text-xs md:text-sm lg:text-xs">
          總時長: {formatTime(duration)} | 選中片段:{' '}
          {displaySegments.filter((s) => s.isSelected).length} /{' '}
          {displaySegments.length} 個
        </span>
      </div>

      <div className="relative">
        <div
          ref={timelineRef}
          className="relative h-[60px] rounded-lg lg:rounded-t-none overflow-hidden bg-gradient-to-r from-neutral-700 via-neutral-600 to-neutral-700 cursor-pointer select-none"
          onClick={handleTimelineClick}
          onMouseDown={handleTimelineDrag}
          onTouchStart={handleTouchStart}
          data-testid="timeline-container"
        >
          {/* 所有片段 - 選中和未選中都顯示 */}
          {displaySegments.map((segment, index) => (
            <div
              key={segment.id}
              className={clsx(
                'absolute top-[3px] md:top-[5px] h-[34px] md:h-[50px] rounded cursor-pointer flex items-center justify-center transition-all border-2 border-transparent hover:-translate-y-0.5 hover:border-white shadow hover:shadow-md text-white text-xs',
                {
                  'bg-green-600/70': segment.isSelected,
                  'bg-neutral-600/50 border-neutral-500': !segment.isSelected,
                },
              )}
              style={getSegmentStyle(segment)}
              data-testid={`segment-${index}`}
              onClick={() => {
                dispatch({ type: 'SEEK', payload: segment.start })
              }}
              title={
                segment.isSelected
                  ? `已選中 - ${formatTime(segment.start)} - ${formatTime(segment.end)}`
                  : `未選中 - ${formatTime(segment.start)} - ${formatTime(segment.end)}`
              }
            >
              <div className="flex items-center justify-center w-full h-full">
                <span
                  className={clsx('font-bold text-xs md:text-sm', {
                    'text-white': segment.isSelected,
                    'text-neutral-300': !segment.isSelected,
                  })}
                >
                  {index + 1}
                </span>
              </div>
            </div>
          ))}

          {/* 目前播放位置指示器 */}
          <div
            className="absolute top-0 w-0.5 h-[40px] md:h-[60px] bg-red-500 pointer-events-none z-10"
            style={{ left: `${getCurrentTimePosition()}%` }}
          >
            <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 md:w-2.5 h-2 md:h-2.5 bg-red-500 rounded-full" />
          </div>
        </div>

        {/* 時間刻度 */}
        <div className="flex relative h-4 md:h-5 text-neutral-400 text-xs">
          {Array.from({ length: 6 }, (_, i) => {
            const time = (duration / 5) * i
            return (
              <div
                key={i}
                className="absolute -translate-x-1/2 whitespace-nowrap"
                style={{ left: `${(i / 5) * 100}%` }}
              >
                {formatTime(time)}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
