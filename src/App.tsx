import { useMemo, useState, useCallback, useEffect } from 'react'
import { VideoUpload } from './components/VideoUpload'
import { TranscriptEditor } from './components/TranscriptEditor'
import { VideoPreview } from './components/VideoPreview'
import type { VideoData, MockApiResponse } from './types'
import { mockProcessVideo } from './utils/mockApi'
import { VideoPlayerProvider } from './contexts/VideoPlayerProvider'
import { useVideoPlayerContext } from './contexts/useVideoPlayerContext'
import { useVideoPlayer } from './hooks/useVideoPlayer'

const getSelectedSentences = (tData: MockApiResponse | null) => {
  if (!tData) return []
  return tData.sections
    .flatMap((section) => section.sentences)
    .filter((sentence) => sentence.isSelected)
}

function App() {
  const [videoData, setVideoData] = useState<VideoData | null>(null)
  const [transcriptData, setTranscriptData] = useState<MockApiResponse | null>(
    null,
  )
  const [isProcessing, setIsProcessing] = useState(false)

  const handleVideoUpload = useCallback(async (file: File) => {
    setIsProcessing(true)

    const videoUrl = URL.createObjectURL(file)
    const video = document.createElement('video')
    video.src = videoUrl

    video.onloadedmetadata = async () => {
      const videoData: VideoData = {
        file,
        url: videoUrl,
        duration: video.duration,
      }

      setVideoData(videoData)

      try {
        const result = await mockProcessVideo(file)
        setTranscriptData(result)
      } catch (error) {
        console.error('處理影片失敗:', error)
      } finally {
        setIsProcessing(false)
      }
    }
  }, [])

  const handleSentenceToggle = useCallback(
    (sentenceId: string) => {
      if (!transcriptData) return

      setTranscriptData((prev) => {
        if (!prev) return prev

        return {
          ...prev,
          sections: prev.sections.map((section) => ({
            ...section,
            sentences: section.sentences.map((sentence) =>
              sentence.id === sentenceId
                ? { ...sentence, isSelected: !sentence.isSelected }
                : sentence,
            ),
          })),
        }
      })
    },
    [transcriptData],
  )

  return (
    <VideoPlayerProvider>
      <div className="min-h-screen flex flex-col bg-neutral-900 text-neutral-100">
        {!videoData ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <VideoUpload
              onVideoUpload={handleVideoUpload}
              isProcessing={isProcessing}
            />
            {isProcessing && (
              <p className="mt-2 text-neutral-300">正在處理影片，請稍候...</p>
            )}
            <a
              href="/demo.mp4"
              download="demo.mp4"
              className="mt-4 text-blue-400 hover:text-blue-300 underline"
            >
              下載範例影片 (demo.mp4)
            </a>
          </div>
        ) : (
          <AppContent
            videoData={videoData}
            transcriptData={transcriptData}
            onSentenceToggle={handleSentenceToggle}
          />
        )}
      </div>
    </VideoPlayerProvider>
  )
}

// New component that uses the context
function AppContent({
  videoData,
  transcriptData,
  onSentenceToggle,
}: {
  videoData: VideoData
  transcriptData: MockApiResponse | null
  onSentenceToggle: (sentenceId: string) => void
}) {
  const { state, dispatch } = useVideoPlayerContext()
  const { seekToTimestamp } = useVideoPlayer()
  const {
    currentTime,
    isPlayingHighlights,
    currentSegmentIndex,
    highlightRanges,
  } = state

  // Memo: ordered selected sentences
  const orderedSelected = useMemo(() => {
    const s = getSelectedSentences(transcriptData)
    return [...s].sort((a, b) => a.startTime - b.startTime)
  }, [transcriptData])

  // Handle timestamp clicks for seeking
  const handleTimestampClick = useCallback(
    (time: number) => {
      seekToTimestamp(time)
    },
    [seekToTimestamp],
  )

  // Update navigation state when selected sentences or current time changes
  const allSentences = useMemo(() => {
    if (!transcriptData) return []
    return transcriptData.sections.flatMap((section) => section.sentences)
  }, [transcriptData])

  // Update navigation state when time or selection changes
  useEffect(() => {
    if (allSentences.length > 0) {
      dispatch({ type: 'UPDATE_NAVIGATION_STATE', payload: allSentences })
    }
  }, [allSentences, currentTime, dispatch])

  // Derive current sentence id for transcript highlighting
  const currentSentenceId = useMemo(() => {
    if (isPlayingHighlights && currentSegmentIndex >= 0) {
      // In highlight mode, use the current segment from highlight ranges
      return highlightRanges[currentSegmentIndex]?.id ?? null
    } else if (transcriptData) {
      // In normal mode, find the sentence that contains the current time
      const allSentences = transcriptData.sections.flatMap(
        (section) => section.sentences,
      )
      const currentSentence = allSentences.find(
        (sentence) =>
          currentTime >= sentence.startTime && currentTime <= sentence.endTime,
      )
      return currentSentence?.id ?? null
    }
    return null
  }, [
    isPlayingHighlights,
    currentSegmentIndex,
    highlightRanges,
    transcriptData,
    currentTime,
  ])

  return (
    <>
      <div className="flex flex-1 min-h-0 flex-col lg:flex-row h-[calc(100vh-80px)] md:h-[calc(100vh-80px)]">
        {/* 預覽區 - 手機版固定在頂部，桌面版在右側 */}
        <div className="lg:flex-1 p-2 md:p-4 bg-neutral-700 lg:h-auto order-1 lg:order-2 min-h-0 flex-shrink-0 sticky top-0 left-0 right-0 md:relative">
          <VideoPreview
            videoUrl={videoData.url}
            selectedSentences={orderedSelected}
            allSentences={allSentences}
          />
        </div>

        {/* 編輯區 - 手機版使用剩餘高度，桌面版在左側 */}
        <div className="flex-1 border-t lg:border-t-0 lg:border-r border-neutral-800 overflow-hidden p-2 md:p-4 bg-neutral-800 lg:h-auto order-2 lg:order-1 min-h-0 flex flex-col">
          {transcriptData && (
            <TranscriptEditor
              sections={transcriptData.sections}
              currentTime={currentTime}
              onSentenceToggle={onSentenceToggle}
              onTimestampClick={handleTimestampClick}
              isHighlightMode={isPlayingHighlights}
              currentSentenceId={currentSentenceId}
            />
          )}
        </div>
      </div>
    </>
  )
}

export default App
