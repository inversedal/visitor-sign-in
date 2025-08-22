# Visitor Management System

## Overview

This is a comprehensive visitor management system built with React (frontend) and Express.js (backend). The application allows visitors to sign in and out of a facility, captures photos for visitor badges, manages host notifications, and provides admin oversight through a dashboard. The system is designed for corporate environments where visitor tracking and security are important.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development
- **Routing**: Wouter for lightweight client-side routing with minimal bundle size
- **State Management**: React Query (TanStack Query) for server state management and caching
- **UI Framework**: Radix UI components with shadcn/ui design system for accessible, customizable components
- **Styling**: Tailwind CSS with CSS variables for theming and responsive design
- **Forms**: React Hook Form with Zod validation for type-safe form handling
- **Build Tool**: Vite for fast development and optimized production builds
- **Testing**: Vitest with React Testing Library for component and integration tests

### Backend Architecture
- **Framework**: Express.js with TypeScript for robust server-side development
- **Session Management**: Express sessions with configurable storage (in-memory for development)
- **Authentication**: Password hashing with bcrypt for admin user security
- **Email Service**: Nodemailer for automated host notifications when visitors arrive
- **File Handling**: Base64 encoding for photo storage and processing
- **API Design**: RESTful endpoints with proper error handling, logging, and CORS support
- **Build System**: ESBuild for production bundling with external package support

### Data Storage Solutions
- **Primary Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Database Provider**: Neon Database (serverless PostgreSQL) for scalable cloud hosting
- **Schema Management**: Drizzle Kit for migrations, schema updates, and database synchronization
- **In-Memory Fallback**: MemStorage class for development and testing environments
- **Photo Storage**: Base64 encoded strings stored directly in database for simplicity

### Authentication and Authorization
- **Admin Authentication**: Username/password authentication with bcrypt hashing
- **Session Management**: Express sessions with secure cookie configuration
- **Route Protection**: Server-side session validation for admin-only endpoints
- **Security Features**: CSRF protection, secure headers, and session timeout handling

### Key Features and Components

#### Visitor Management
- **Multi-step Sign-in**: Progressive form with name, company, host selection, and visit reason
- **Photo Capture**: WebRTC-based camera integration with fallback for environments without camera access
- **Badge Generation**: PDF badge creation with visitor photo, details, and company branding
- **Email Notifications**: Automatic host notifications when visitors arrive
- **Sign-out Process**: Simple name-based lookup system for visitor departure

#### Admin Dashboard
- **Real-time Statistics**: Current visitor count, daily sign-ins, and average visit duration
- **Visitor Management**: View all visitors, sign out visitors remotely, and export data
- **Search and Filter**: Find visitors by name, company, or host with real-time search
- **Audit Logging**: Track all system actions for security and compliance
- **Data Export**: CSV and JSON export capabilities for reporting

#### Photo Management
- **WebRTC Camera Access**: Direct browser camera integration for photo capture
- **Fallback Options**: File upload support when camera access is unavailable
- **Image Processing**: Automatic resizing and compression for efficient storage
- **Security**: Photo data is validated and sanitized before storage

## External Dependencies

### Database and Storage
- **Neon Database**: Serverless PostgreSQL hosting with automatic scaling
- **Drizzle ORM**: Type-safe database operations with schema management
- **Drizzle Kit**: Database migration and schema synchronization tools

### Email Services
- **Nodemailer**: SMTP email sending for host notifications
- **Gmail SMTP**: Default email provider (configurable for other SMTP services)
- **Email Templates**: HTML email templates for visitor arrival notifications

### UI and Design
- **Radix UI**: Accessible React component primitives for complex UI patterns
- **shadcn/ui**: Pre-built component library with consistent design system
- **Tailwind CSS**: Utility-first CSS framework for rapid styling
- **Lucide React**: Consistent icon library for UI elements

### Development Tools
- **Vite**: Fast build tool with hot module replacement for development
- **TypeScript**: Static type checking for both frontend and backend
- **ESLint & Prettier**: Code formatting and linting for consistent code quality
- **Vitest**: Fast unit testing framework with React Testing Library integration

### Authentication and Security
- **bcrypt**: Password hashing for secure admin authentication
- **express-session**: Session management with configurable storage backends
- **CORS**: Cross-origin resource sharing configuration for API security

### File Processing
- **jsPDF**: Client-side PDF generation for visitor badges
- **Canvas API**: Image manipulation for photo processing and badge creation
- **File API**: Browser file handling for photo uploads and processing

### Development Environment
- **Replit Integration**: Development environment setup with hot reloading
- **Environment Variables**: Secure configuration management for database URLs, email credentials
- **Docker Ready**: Containerization support for deployment flexibility