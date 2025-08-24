# Video Highlight Tool

A React-based video editing tool that uses AI to help users create highlight clips from uploaded videos with automatic transcript generation.

## 🎯 Core Features

- **Video Upload**: Support for video file uploads with processing simulation
- **AI-Powered Transcription**: Mock API generates full transcripts split into sections with timestamps
- **Interactive Editing**: Split-screen interface with transcript editor and video preview
- **Highlight Selection**: Users can select/deselect sentences to create custom highlight clips
- **Real-time Sync**: Bidirectional synchronization between transcript editor and video player
- **Virtual Timeline**: Seamless playback of non-contiguous highlight segments
- **Transcript Overlay**: Selected text appears as overlay on video during playback
- **Responsive Design**: Mobile-first design with adaptive layout for different screen sizes

## 🏗️ Architecture

### Technology Stack

- **React 19.1.1**: UI framework with latest features
- **TypeScript 5.8.3**: Type-safe JavaScript with strict configuration
- **Vite 7.1.2**: Fast build tool and dev server with SWC compilation
- **Tailwind CSS 4.1.12**: Utility-first CSS framework with native Vite integration
- **Vitest**: Unit and integration testing
- **Playwright**: End-to-end testing across browsers
- **Heroicons**: Icon library for UI elements

### State Management

- **Context API**: Centralized state management with `VideoPlayerContext`
- **Reducer Pattern**: Pure functions for predictable state updates (`videoPlayerReducer`)
- **Effect Separation**: Centralized DOM synchronization via `useVideoEffects`
- **Virtual Timeline**: Custom utility for handling non-contiguous video segments

### Project Structure

```
src/
├── components/          # React components
│   ├── VideoUpload.tsx     # File upload interface
│   ├── TranscriptEditor.tsx # Left panel transcript editing
│   ├── VideoPreview.tsx    # Right panel video player
│   ├── VideoControls.tsx   # Playback controls
│   └── HighlightTimeline.tsx # Timeline visualization
├── contexts/            # Context API setup
│   ├── VideoPlayerContext.tsx
│   ├── VideoPlayerProvider.tsx
│   └── useVideoPlayerContext.ts
├── hooks/               # Custom React hooks
│   ├── useVideoPlayer.ts   # Video player logic
│   └── useVideoEffects.ts  # DOM synchronization
├── reducers/            # State management
│   └── videoPlayerReducer.ts
├── utils/               # Utility functions
│   └── mockApi.ts         # Mock API for development
├── types/               # TypeScript definitions
└── __tests__/           # Test files (co-located)
```

## 🚀 Quick Start

### Project Setup

```sh
pnpm install
```

### Development

```sh
pnpm dev
```

### Build for Production

```sh
pnpm build
```

### Linting and Formatting

```sh
# Run all checks
pnpm lint
pnpm tsc

# Fix linting and formatting issues
pnpm lint:fix
pnpm format
```

### Testing

This project uses comprehensive testing with both unit and end-to-end testing.

#### Unit & Integration Tests (Vitest)

```sh
# Run all tests once
pnpm test

# Run tests and generate a coverage report
pnpm coverage

# Run tests in interactive watch mode
vitest

# Run tests with a machine-readable reporter (for CI/AI)
pnpm test:ai
```

#### End-to-End Tests (Playwright)

```sh
# Run E2E tests across multiple browsers
pnpm e2e

# Run E2E tests with interactive UI for debugging
pnpm e2e:ui

# Run E2E tests with AI-friendly output (first error only)
pnpm e2e:ai

# Show detailed test reports with screenshots
pnpm e2e:report
```

#### Test Structure

- **Unit tests**: Located in `src/**/__tests__/**/*.{test,spec}.{ts,tsx}`
- **E2E tests**: Located in `e2e/**/*.spec.ts`
- **Test environments**: Node.js for utils, jsdom for React components
- **Cross-browser**: Tests run on Chromium, WebKit, Mobile Chrome, and Mobile Safari

## 📖 User Guide

### Basic Workflow

1. **Upload Video**: Click "選擇檔案" to upload a video file
2. **AI Processing**: The app simulates AI processing and generates a transcript
3. **Select Highlights**: In the transcript editor (left panel), click sentences to select/deselect them
4. **Preview**: Click "播放高亮片段" to preview your highlight sequence

### Key Features in Action

- **Transcript Navigation**: Click timestamps to jump to specific moments
- **Real-time Sync**: The transcript automatically scrolls during playback
- **Virtual Timeline**: Selected segments play seamlessly as one continuous video
- **Subtitle Overlay**: Selected text appears on the video during playback
- **Responsive Layout**: Interface adapts to mobile and desktop screens

### UI Components

- **VideoUpload**: Drag-and-drop file upload with processing indicator
- **TranscriptEditor**: Interactive transcript with sentence selection and timestamp navigation
- **VideoPreview**: Video player with subtitle overlay and highlight timeline
- **VideoControls**: Playback controls with highlight mode toggle
- **HighlightTimeline**: Visual representation of selected segments

## 🎥 Demo Video

A demo video is included in the `public/` folder for testing purposes.

**Video Source**: [Freepik Business Meeting](https://www.freepik.com/free-video/businessman-explaining-wind-turbine-model-showing-data-graph-meeting-office_175303)

## 🔧 Technical Decisions

For a comprehensive overview of all technical decisions and their rationale, see **[Technical Choices Documentation](docs/technical-choices.md)**.

### Key Technical Decisions

#### Why Context API + Reducer?

- **Predictable State**: Pure reducer functions make state changes predictable and testable
- **Performance**: Context prevents prop drilling while maintaining component isolation
- **Debugging**: Centralized state makes debugging easier with clear action flows

#### Why Virtual Timeline?

- **User Experience**: Allows seamless playback of non-contiguous video segments
- **Flexibility**: Users can select any combination of sentences without jarring jumps
- **Performance**: Efficient time calculations for complex highlight sequences

#### Why Separate Effects Hook?

- **Single Responsibility**: `useVideoEffects` handles all DOM synchronization
- **No Duplicates**: Prevents multiple event listeners on the same video element
- **Testability**: Pure reducer + isolated effects = easier testing

#### Why Tailwind CSS 4?

- **Native Vite Integration**: No config file needed, works out of the box
- **Performance**: Only includes used utilities in production
- **Developer Experience**: Utility-first approach speeds up development

#### Mock API Design

- **Development Friendly**: Simulates real API behavior without external dependencies
- **Configurable Timing**: Adjustable processing delays for realistic UX
- **Structured Data**: Returns well-organized transcript sections with timing information

## 🚀 Deployment

### Build for Production

```sh
pnpm build
```

### Preview Production Build

```sh
pnpm preview
```

### Quality Checks

Before deployment, ensure all quality checks pass:

```sh
pnpm tsc      # TypeScript compilation
pnpm lint     # ESLint checks
pnpm test     # Unit tests (note: some tests may fail due to UI changes)
pnpm e2e:ai   # E2E tests
pnpm build    # Production build
```
