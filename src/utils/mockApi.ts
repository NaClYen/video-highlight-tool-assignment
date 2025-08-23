import type { MockApiResponse, TranscriptSection } from '../types'

/**
 * Gap size added between adjacent segments to prevent navigation issues
 * This value should be used consistently across navigation logic
 */
export const SEGMENT_GAP_SIZE = 0.05 // 50ms gap between segments

/**
 * Adjusts transcript timing to prevent navigation issues with adjacent segments
 * Adds small gaps between consecutive segments to ensure proper navigation behavior
 */
function adjustSegmentTiming(
  sections: TranscriptSection[],
): TranscriptSection[] {
  const GAP_SIZE = SEGMENT_GAP_SIZE

  return sections.map((section) => ({
    ...section,
    sentences: section.sentences.map((sentence, index, sentences) => {
      // For sentences after the first one, check if it starts exactly when previous ends
      if (index > 0) {
        const prevSentence = sentences[index - 1]
        if (sentence.startTime === prevSentence.endTime) {
          // Add small gap: move this sentence's start time slightly later
          return {
            ...sentence,
            startTime: sentence.startTime + GAP_SIZE,
            endTime: sentence.endTime,
          }
        }
      }
      return sentence
    }),
  }))
}

// 模擬 AI 處理 API
export const mockProcessVideo = async (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _file: File,
): Promise<MockApiResponse> => {
  // 模擬 API 延遲
  await new Promise((resolve) => setTimeout(resolve, 2000))

  // 模擬回傳的轉錄資料（原始數據）
  const sections: TranscriptSection[] = [
    {
      id: 'section-1',
      title: '開場介紹',
      sentences: [
        {
          id: 'sent-1',
          text: '歡迎來到今天的產品發表會',
          startTime: 0,
          endTime: 3,
          isSelected: true,
          isHighlighted: true,
        },
        {
          id: 'sent-2',
          text: '我們很興奮向大家展示我們的最新創新',
          startTime: 3,
          endTime: 7,
          isSelected: true,
          isHighlighted: true,
        },
        {
          id: 'sent-3',
          text: '這個產品將會改變我們的工作方式',
          startTime: 8,
          endTime: 11,
          isSelected: false,
          isHighlighted: false,
        },
      ],
    },
    {
      id: 'section-2',
      title: '產品特色',
      sentences: [
        {
          id: 'sent-4',
          text: '首先讓我們看看這個革命性的功能',
          startTime: 12,
          endTime: 15,
          isSelected: true,
          isHighlighted: true,
        },
        {
          id: 'sent-5',
          text: '它可以自動分析和處理複雜的資料',
          startTime: 15,
          endTime: 19,
          isSelected: false,
          isHighlighted: false,
        },
        {
          id: 'sent-6',
          text: '效率提升了百分之三百',
          startTime: 19,
          endTime: 22,
          isSelected: true,
          isHighlighted: true,
        },
      ],
    },
    {
      id: 'section-3',
      title: '總結',
      sentences: [
        {
          id: 'sent-7',
          text: '感謝大家的聆聽',
          startTime: 22,
          endTime: 25,
          isSelected: false,
          isHighlighted: false,
        },
        {
          id: 'sent-8',
          text: '我們期待與您合作',
          startTime: 25,
          endTime: 28,
          isSelected: true,
          isHighlighted: true,
        },
      ],
    },
  ]

  // Apply timing adjustments to prevent navigation issues
  const adjustedSections = adjustSegmentTiming(sections)

  return {
    fullTranscript: adjustedSections
      .flatMap((s) => s.sentences.map((sent) => sent.text))
      .join(' '),
    sections: adjustedSections,
    suggestedHighlights: adjustedSections
      .flatMap((s) => s.sentences)
      .filter((s) => s.isHighlighted)
      .map((s) => s.id),
  }
}
