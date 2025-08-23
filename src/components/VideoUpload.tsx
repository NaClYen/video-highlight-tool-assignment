import React, { useRef } from 'react'

interface VideoUploadProps {
  onVideoUpload: (file: File) => void
  isProcessing: boolean
}

export const VideoUpload: React.FC<VideoUploadProps> = ({
  onVideoUpload,
  isProcessing,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith('video/')) {
      onVideoUpload(file)
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="mb-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
        data-testid="video-file-input"
      />
      <button
        onClick={handleClick}
        disabled={isProcessing}
        className="bg-indigo-500 text-white px-6 py-3 rounded-lg text-base transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed cursor-pointer hover:bg-indigo-600 md:hover:bg-indigo-600 md:hover:shadow-lg md:hover:scale-105 md:transition-all md:duration-200"
        data-testid="upload-button"
      >
        {isProcessing ? '處理中...' : '上傳影片'}
      </button>
    </div>
  )
}
