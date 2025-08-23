import React, { useEffect, useRef } from 'react'
import type { TranscriptSection, TranscriptSentence } from '../types'

interface TranscriptEditorProps {
  sections: TranscriptSection[]
  currentTime: number
  onSentenceToggle: (sentenceId: string) => void
  onTimestampClick: (time: number) => void
  isHighlightMode?: boolean
  currentSentenceId?: string | null
}

export const TranscriptEditor: React.FC<TranscriptEditorProps> = ({
  sections,
  currentTime,
  onSentenceToggle,
  onTimestampClick,
  isHighlightMode = false,
  currentSentenceId = null,
}) => {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`
  }

  const isCurrentSentence = (sentence: TranscriptSentence): boolean => {
    if (isHighlightMode && currentSentenceId) {
      return sentence.id === currentSentenceId
    }
    return currentTime >= sentence.startTime && currentTime <= sentence.endTime
  }

  // Refs for auto-scroll to current sentence
  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({})

  // Auto-scroll to current sentence (works in both normal and highlight modes)
  useEffect(() => {
    if (!currentSentenceId) return
    const el = rowRefs.current[currentSentenceId]
    if (el) {
      // Smooth scroll the row into view within the scrollable container
      el.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest',
      })
    }
  }, [currentSentenceId])

  return (
    <div
      data-testid="transcript-editor"
      className="h-full flex flex-col min-h-0"
    >
      <h3 className="mt-0 text-white border-b border-neutral-700 pb-2 text-sm md:text-base font-medium flex-shrink-0s">
        編輯區域
      </h3>
      <div className="flex-1 overflow-y-auto min-h-0 pb-4">
        {sections.map((section) => (
          <div key={section.id} className="mb-4 md:mb-8">
            <h4 className="text-sky-400 mb-2 md:mb-4 text-sm md:text-lg font-medium">
              {section.title}
            </h4>
            {section.sentences.map((sentence) => (
              <div
                key={sentence.id} // Add key prop
                ref={(el) => {
                  rowRefs.current[sentence.id] = el
                }}
                className={
                  `flex items-start gap-2 p-2 mb-1 md:mb-2 rounded transition-all duration-200 cursor-pointer ` +
                  `hover:bg-neutral-600 hover:shadow-md ` +
                  `${sentence.isSelected ? 'bg-green-600/30 ' : ''}` +
                  `${isCurrentSentence(sentence) ? 'bg-blue-900/40 border-l-4 border-l-blue-500 ' : ''}` +
                  `${sentence.isHighlighted ? 'border-r-4 border-r-amber-500 ' : ''}`
                }
                data-selected={sentence.isSelected ? 'true' : 'false'}
                data-testid={`transcript-row-${sentence.id}${isCurrentSentence(sentence) ? '-current' : ''}`}
                onClick={(e) => {
                  // If clicking on checkbox or timestamp button, don't handle here
                  if (
                    (e.target as HTMLElement).tagName === 'INPUT' ||
                    (e.target as HTMLElement).tagName === 'BUTTON'
                  ) {
                    return
                  }
                  // First jump to the sentence time, then toggle selection
                  onTimestampClick(sentence.startTime)
                  onSentenceToggle(sentence.id)
                }}
              >
                <input
                  type="checkbox"
                  checked={sentence.isSelected}
                  onChange={() => onSentenceToggle(sentence.id)}
                  onClick={(e) => e.stopPropagation()} // Prevent double toggle
                  className="pointer-events-none mt-1 md:mt-0 w-4 h-4 md:w-3 md:h-3" // Make checkbox non-interactive since row handles it
                  aria-label={`選擇句子: ${sentence.text.substring(0, 50)}...`}
                />
                <button
                  type="button"
                  className="bg-neutral-700 text-sky-400 px-1 md:px-2 py-0.5 rounded text-xs font-mono min-w-8 md:min-w-10 hover:bg-neutral-600 transition-colors cursor-pointer flex-shrink-0"
                  onClick={(e) => {
                    e.stopPropagation() // Prevent row click
                    onTimestampClick(sentence.startTime)
                  }}
                  aria-label={`跳轉到時間: ${formatTime(sentence.startTime)}`}
                >
                  {formatTime(sentence.startTime)}
                </button>
                <span className="text-white text-xs md:text-sm leading-relaxed flex-1 break-words">
                  {sentence.text}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
