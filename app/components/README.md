# Components Documentation

This directory contains all the UI components for the LUT Studios scrollytelling website.

## Component Structure

### Core Components

#### `LoadingScreen.tsx`
Displays a loading screen with progress bar while videos are being preloaded.
- Shows LUT branding
- Animated progress bar (0-100%)
- Loading percentage display

#### `Navigation.tsx`
Top navigation menu component.
- Reusable across different sections
- Highlights current active section
- Handles navigation clicks

#### `VideoBackground.tsx`
Reusable video background component.
- Handles video playback settings
- Configurable autoPlay, loop, and className props
- Ensures proper video rendering

#### `SocialLinks.tsx`
Social media links component (Instagram, LinkedIn).
- Positioned at bottom-left
- Opens links in new tab
- Includes accessibility labels

### Section Components

#### `HeroSection.tsx`
Main hero/landing section with video background.
- Homepage video loop
- Navigation overlay
- Scroll indicator
- Social links and copyright

#### `AboutSection.tsx`
About section with video background and content.
- About video loop
- Navigation
- Centered content with heading and description

#### `TransitionVideo.tsx`
Handles video transitions between sections.
- Supports forward and reverse transitions
- Full-screen overlay during transitions
- Automatically switches video source based on direction

## File Organization

```
app/
├── components/          # UI components
│   ├── LoadingScreen.tsx
│   ├── Navigation.tsx
│   ├── VideoBackground.tsx
│   ├── SocialLinks.tsx
│   ├── HeroSection.tsx
│   ├── AboutSection.tsx
│   └── TransitionVideo.tsx
├── hooks/              # Custom React hooks
│   ├── useVideoPreloader.ts
│   └── useScrollTransition.ts
├── constants/          # App constants and types
│   └── config.ts
└── page.tsx           # Main page component
```

## Usage Example

```tsx
import { HeroSection } from './components/HeroSection';
import { VIDEO_PATHS } from './constants/config';

<HeroSection
  videoRef={heroVideoRef}
  videoSrc={VIDEO_PATHS.heroLoop}
  isVisible={currentSection === 'hero'}
  currentSection={currentSection}
  onAboutClick={handleAboutClick}
/>
```

## Benefits of This Structure

1. **Modularity**: Each component has a single responsibility
2. **Reusability**: Components can be easily reused across sections
3. **Maintainability**: Easy to find and update specific functionality
4. **Type Safety**: Full TypeScript support with proper types
5. **Testability**: Components can be tested in isolation
6. **Scalability**: Easy to add new sections or features
