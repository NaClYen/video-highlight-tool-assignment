/**
 * Type definitions for the video highlight tool application
 */

/**
 * Represents a section of the transcript with grouped sentences
 */
export interface TranscriptSection {
  /** Unique identifier for the section */
  id: string
  /** Display title for the section */
  title: string
  /** Array of sentences within this section */
  sentences: TranscriptSentence[]
}

/**
 * Represents a single sentence in the transcript with timing information
 */
export interface TranscriptSentence {
  /** Unique identifier for the sentence */
  id: string
  /** Text content of the sentence */
  text: string
  /** Start time in seconds */
  startTime: number
  /** End time in seconds */
  endTime: number
  /** Whether this sentence is selected for highlight playback */
  isSelected: boolean
  /** Whether this sentence is AI-suggested for highlighting */
  isHighlighted: boolean
}

/**
 * Represents uploaded video data with metadata
 */
export interface VideoData {
  /** The uploaded video file */
  file: File
  /** Object URL for the video */
  url: string
  /** Duration of the video in seconds */
  duration: number
}

/**
 * Response structure from the mock API for transcript processing
 */
export interface MockApiResponse {
  /** Complete transcript text */
  fullTranscript: string
  /** Organized transcript sections */
  sections: TranscriptSection[]
  /** Array of sentence IDs suggested for highlighting */
  suggestedHighlights: string[]
}
