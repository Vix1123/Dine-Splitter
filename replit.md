# Dine Split - Replit Agent Guide

## Overview

Dine Split is a mobile bill-splitting application built with React Native/Expo that helps groups easily divide restaurant bills. Users can capture receipt photos, extract line items via OCR, assign items to people, calculate tips, and share the final split. The app supports multiple currencies and provides a visual, color-coded experience for tracking who owes what.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React Native with Expo SDK 54 (new architecture enabled)
- **Navigation**: React Navigation with native stack navigators (no tab navigation - single-purpose utility flow)
- **State Management**: React Query for server state, React useState for local UI state
- **Styling**: StyleSheet with a centralized theme system supporting light/dark modes
- **Animations**: React Native Reanimated for smooth, performant animations
- **UI Components**: Custom component library with ThemedText, ThemedView, Button, Card, and domain-specific components

### Backend Architecture
- **Server**: Express.js with TypeScript running on Node
- **API Design**: RESTful endpoints for receipt processing
- **File Handling**: Multer for image uploads
- **External API Integration**: Tabscanner API for receipt OCR (requires TABSCANNER_API_KEY secret)

### Data Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts` - shared between client and server
- **Current Storage**: In-memory storage (MemStorage class) - database schema prepared for PostgreSQL when provisioned
- **Validation**: Zod schemas generated from Drizzle schema via drizzle-zod

### Key Design Patterns
- **Path Aliases**: `@/` maps to `./client`, `@shared/` maps to `./shared`
- **Theming**: Centralized color tokens in `client/constants/theme.ts` with primary green (#35A853) and accent orange (#FF6B35)
- **Person Colors**: 8 predefined colors for visual person identification
- **Error Handling**: ErrorBoundary component wraps the app with graceful fallback UI

### Build & Development
- **Development**: Separate scripts for Expo (`expo:dev`) and Express server (`server:dev`)
- **Production Build**: Static Expo build with esbuild for server bundling
- **Database Migrations**: Drizzle Kit for schema management (`db:push`)

## External Dependencies

### Third-Party Services
- **Tabscanner API**: Receipt OCR processing - extracts line items, totals, and currency from receipt images. Requires `TABSCANNER_API_KEY` environment secret.

### Database
- **PostgreSQL**: Drizzle configured for PostgreSQL. Requires `DATABASE_URL` environment variable when database is provisioned.

### Key NPM Packages
- **expo-camera**: Receipt photo capture
- **expo-image-picker**: Gallery image selection
- **expo-haptics**: Tactile feedback
- **expo-clipboard**: Copy summaries to clipboard
- **expo-sharing**: Share split summaries
- **@tanstack/react-query**: Server state and data fetching
- **react-native-reanimated**: Performant animations
- **react-native-gesture-handler**: Touch gesture handling

### Platform Support
- iOS, Android, and Web (single-page output)
- Adaptive icon and splash screen configured for both platforms