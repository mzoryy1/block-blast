# Block Blast Game

## Overview

Block Blast is a modern block puzzle game built with TypeScript and vanilla JavaScript. Players drag and place geometric pieces on an 8×8 grid to clear lines and score points. The game features a complete home screen with leaderboard, drag-and-drop controls optimized for mobile devices, and a help system with cooldown mechanics.

The application is designed as a mobile-first web game with AdMob integration for monetization through banner ads and rewarded video ads.

## Recent Changes (October 2025)

- ✅ Added home screen with Play button and Top 5 leaderboard
- ✅ Implemented drag-and-drop functionality with visual piece preview
- ✅ Added full touch event support for Android mobile devices
- ✅ Created help button system with 24-hour cooldown and reward ad integration
- ✅ Enhanced visual effects for matching blocks with exploding animations
- ✅ Implemented screen navigation between home and game views
- ✅ Added localStorage-based leaderboard persistence
- ✅ Repositioned game controls (Home and Help buttons) centered at top
- ✅ Enhanced block disappearing effects with particle burst, rotation, and saturation
- ✅ Centered play button on home screen with flexbox for better visual prominence (Oct 7)
- ✅ Enhanced line clearing animations with scale, rotation, brightness, blur, and glow effects (Oct 7)
- ✅ Modified restart game to clear 40% of blocks (max 20) instead of full reset, keeping score (Oct 7)
- ✅ Sped up line clearing animations from 800ms to 400ms for faster gameplay (Oct 7)
- ✅ Implemented score multiplier: clearing N lines awards N × 100 × N points (Oct 7)
- ✅ Fixed second chance ad feature to clear 50% of blocks (max 25) for adequate play space (Oct 7)
- ✅ Fixed line clearing animation timing to prevent cutoff during board re-render (Oct 7)
- ✅ Further accelerated block clearing animations from 0.4s to 0.25s (37.5% faster) (Oct 7)
- ✅ Added enhanced sparkle effects with glowing halos, color shift, and particle blur to block clearing (Oct 7)
- ✅ Synchronized JavaScript timeouts to 250ms to match faster animation speed (Oct 7)

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- Pure TypeScript/JavaScript with no framework dependencies
- HTML5 for structure with CSS3 for styling
- DOM manipulation for game rendering and user interaction

**Design Pattern:**
The game follows a state-driven architecture where all game logic is centralized in a `GameState` object. This single source of truth pattern ensures consistency across the UI and simplifies debugging.

**Rationale:**
- Vanilla JS/TS chosen for minimal bundle size and maximum performance on mobile devices
- No build step required for development, simplifying the development workflow
- Direct DOM manipulation provides fine-grained control over rendering performance

**Game State Management:**
```typescript
interface GameState {
    board: BoardType;           // 8x8 grid state
    score: number;              // Current score
    currentPieces: PieceType[]; // Available pieces to place
    pieceColors: number[];      // Color assignments for pieces
    usedPieces: boolean[];      // Track which pieces are placed
    selectedPiece: number | null; // Currently selected piece
    gameOver: boolean;          // Game over flag
    rewardedAdLoaded: boolean;  // Ad availability status
}
```

**Game Mechanics:**
- 8×8 board grid system
- 16 predefined piece templates (various polyomino shapes)
- Line clearing mechanism (horizontal and vertical)
- Score calculation based on pieces placed and lines cleared
- Game over detection when no valid placements remain

**UI Components:**
- Home screen: Play button with Top 5 leaderboard display
- Game board: 8×8 cell grid rendered dynamically with touch support
- Piece slots: 3 draggable pieces with visual preview while dragging
- Drag preview: Floating piece visualization following cursor/touch
- Score display: Real-time score updates
- Help button: Assistance feature with 24-hour cooldown timer
- Modal overlay: Game over screen with restart, ad, and home options
- Ad banner: Bottom-positioned advertisement space
- Visual effects: Exploding animations for line clears and help usage

### Backend Architecture

**Server Implementation:**
Simple Node.js HTTP server for development and testing purposes.

**Key Features:**
- Static file serving with MIME type detection
- No-cache headers for development convenience
- Port 5000 binding on all network interfaces (0.0.0.0)

**Rationale:**
This lightweight server approach was chosen because:
- The game has no backend logic or API requirements
- All game state is client-side
- Server only needs to deliver static assets
- Simplifies deployment to mobile platforms via Cordova/Capacitor

**Production Deployment:**
The static nature of the game means it can be:
- Hosted on any CDN or static hosting service
- Bundled directly into a mobile app package
- Served from GitHub Pages or similar services

### Mobile Platform Integration

**Target Platform:**
Cordova or Capacitor for cross-platform mobile deployment.

**Architecture Decision:**
The codebase is written as a web application that will be wrapped in a native container. This hybrid approach provides:

**Advantages:**
- Single codebase for web and mobile
- Rapid development and testing in browser
- Easy integration with mobile-specific plugins (AdMob)

**Considerations:**
- Global `AdMob` object is declared but implemented via plugin
- Graceful degradation when AdMob unavailable (web version)
- Feature detection pattern: `typeof AdMob !== 'undefined'`

### Ad Monetization Strategy

**Two-Tier Monetization:**

1. **Banner Ads (Passive Revenue):**
   - Displayed at bottom of screen during gameplay
   - Non-intrusive, always-visible placement
   - Uses AdMob's banner ad format
   - Can be hidden/shown dynamically

2. **Rewarded Ads (Engagement-Based Revenue):**
   - Offers "second chance" when game ends
   - Pre-loaded to minimize wait time
   - Player watches ad to continue playing
   - Higher eCPM than banner ads

**Implementation Pattern:**
```typescript
// Testing flag for development
initializeAdMob(testing: boolean)

// Banner management
showBannerAd(adUnitId: string)
hideBannerAd()

// Rewarded ad flow
preloadRewardedAd(adUnitId: string)
showRewardedAd(onReward, onFailure)
```

**Rationale:**
- Banner ads provide consistent revenue stream
- Rewarded ads increase engagement and session length
- Pre-loading ensures smooth user experience
- Callback pattern allows game state to react to ad outcomes

### Styling and Visual Design

**CSS Architecture:**
- CSS custom properties (variables) for theming
- Dark mode design with gradient background
- Component-based styling approach
- Responsive design with flexbox layouts

**Color System:**
- 6-color palette for game pieces
- Dark blue theme for UI consistency
- High contrast for accessibility

**Visual Feedback:**
- Shadow effects for depth perception
- Smooth transitions for user interactions
- Clear visual hierarchy (header, board, pieces)

## External Dependencies

### Runtime Dependencies

**node-fetch (^3.3.1):**
- HTTP client library
- Currently included but not actively used in game logic
- May be intended for future features (leaderboards, analytics)

**typescript (^5.9.3):**
- Type checking and compilation
- Configured with strict mode enabled
- ES.Next target for modern JavaScript features

### Development Dependencies

**@types/node (^20.10.0):**
- TypeScript definitions for Node.js APIs
- Required for server implementation (index.ts)

**tsx (^4.7.1):**
- TypeScript execution engine
- Enables running TypeScript files directly without compilation
- Development convenience tool

### Mobile Platform Dependencies

**AdMob SDK:**
- Not listed in package.json (installed via Cordova/Capacitor plugin)
- Expected plugin: cordova-plugin-admob-free or similar
- Exposes global `AdMob` JavaScript API
- Provides banner and rewarded ad capabilities

**Integration Notes:**
- AdMob is accessed via global object, not imported module
- Type safety provided via `declare const AdMob: any`
- Feature detection used for web vs. mobile environments

### Configuration Files

**tsconfig.json:**
- Target: ES.Next with ESNext modules
- Strict type checking enabled
- No emit mode (types only, no compilation)
- Node module resolution strategy

**package.json:**
- Module type: ES modules
- Main entry: index.ts
- No build scripts (uses tsx for execution)

### Future Integration Considerations

The codebase structure suggests potential for:
- Backend API integration (node-fetch dependency present)
- Analytics tracking
- User account systems
- Cloud save functionality
- Leaderboard systems

These would require additional external services such as:
- Firebase (authentication, database, analytics)
- Backend API server (scoring, leaderboards)
- Cloud storage service (game progress sync)