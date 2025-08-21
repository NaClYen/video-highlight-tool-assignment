import { useState, useCallback } from 'react'
import { VideoUpload } from './components/VideoUpload'
import { TranscriptEditor } from './components/TranscriptEditor'
import { VideoPreview } from './components/VideoPreview'
import type { VideoData, MockApiResponse } from './types'
import { mockProcessVideo } from './utils/mockApi'

function App() {
  const [videoData, setVideoData] = useState<VideoData | null>(null)
  const [transcriptData, setTranscriptData] = useState<MockApiResponse | null>(
    null,
  )
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)

  const handleVideoUpload = useCallback(async (file: File) => {
    setIsProcessing(true)

    // 創建視頻 URL
    const videoUrl = URL.createObjectURL(file)

    // 獲取視頻時長（簡化處理）
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
        // 模擬 AI 處理
        const result = await mockProcessVideo(file)
        setTranscriptData(result)
      } catch (error) {
        console.error('處理視頻失敗:', error)
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

  const handleTimestampClick = useCallback((time: number) => {
    setCurrentTime(time)
  }, [])

  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentTime(time)
  }, [])

  const getSelectedSentences = () => {
    if (!transcriptData) return []
    return transcriptData.sections
      .flatMap((section) => section.sentences)
      .filter((sentence) => sentence.isSelected)
  }

  return (
    <div className="min-h-screen flex flex-col bg-neutral-900 text-neutral-100">
      <header className="bg-neutral-900 p-4 text-center border-b border-neutral-800">
        <h1 className="m-0 text-white text-xl">視頻高亮編輯工具</h1>
      </header>

      {!videoData ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <VideoUpload
            onVideoUpload={handleVideoUpload}
            isProcessing={isProcessing}
          />
          {isProcessing && (
            <p className="mt-2 text-neutral-300">正在處理視頻，請稍候...</p>
          )}
        </div>
      ) : (
        <div className="flex flex-1 min-h-0 flex-col md:flex-row md:h-[calc(100vh-80px)]">
          <div className="flex-1 border-b md:border-b-0 md:border-r border-neutral-800 overflow-y-auto p-4 bg-neutral-800">
            {transcriptData && (
              <TranscriptEditor
                sections={transcriptData.sections}
                currentTime={currentTime}
                onSentenceToggle={handleSentenceToggle}
                onTimestampClick={handleTimestampClick}
              />
            )}
          </div>

          <div className="flex-1 p-4 bg-neutral-700">
            <VideoPreview
              videoUrl={videoData.url}
              selectedSentences={getSelectedSentences()}
              currentTime={currentTime}
              totalDuration={videoData.duration}
              onTimeUpdate={handleTimeUpdate}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default App
