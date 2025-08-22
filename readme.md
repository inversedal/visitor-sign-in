# Visitor Management System

## Overview

This is a comprehensive visitor management system built with React (frontend) and Express.js (backend). The application allows visitors to sign in and out of a facility, captures photos for visitor badges, sends email notifications to hosts, and provides an admin dashboard for monitoring and managing visitor activity. The system features real-time visitor tracking, badge generation, audit logging, and comprehensive reporting capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: React Query (TanStack Query) for server state management
- **UI Framework**: Radix UI components with shadcn/ui design system
- **Styling**: Tailwind CSS with CSS variables for theming
- **Forms**: React Hook Form with Zod validation
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Session Management**: Express sessions with in-memory storage (configurable for production)
- **Authentication**: Password hashing with bcrypt for admin users
- **Email Service**: Nodemailer for host notifications
- **File Handling**: Base64 encoding for photo storage
- **API Design**: RESTful endpoints with proper error handling and logging

### Data Storage Solutions
- **Primary Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Schema Management**: Drizzle Kit for migrations and schema updates
- **In-Memory Fallback**: MemStorage class for development/testing scenarios

### Authentication and Authorization
- **Admin Authentication**: Username/password with bcrypt hashing
- **Session Management**: Express sessions with configurable storage
- **Route Protection**: Server-side session validation for admin endpoints
- **Security**: CSRF protection through same-origin policies

### Key Features and Components

#### Visitor Management
- **Sign-in Process**: Multi-step form with photo capture, host selection, and reason for visit
- **Sign-out Process**: Simple name-based lookup system
- **Badge Generation**: PDF badge creation with visitor photo and details
- **Photo Capture**: WebRTC-based camera integration with fallback handling

#### Admin Dashboard
- **Real-time Analytics**: Current visitor count, daily statistics, and average visit duration
- **Visitor Monitoring**: Live visitor list with sign-out capabilities
- **Visitor Details Modal**: Click on any visitor record to view complete details including photo
- **Data Export**: CSV/JSON export functionality for audit and reporting
- **Search and Filter**: Visitor lookup and filtering capabilities

#### Email Notifications
- **Host Alerts**: Automatic email notifications when visitors arrive
- **Template System**: Configurable email templates for different notification types
- **SMTP Integration**: Support for various email providers (Gmail, custom SMTP)

#### Audit and Compliance
- **Activity Logging**: Comprehensive audit trail for all system actions
- **Data Retention**: Configurable retention policies for visitor records
- **Export Capabilities**: Multiple format support for compliance reporting

## External Dependencies

### Database and ORM
- **Neon Database**: Serverless PostgreSQL hosting
- **Drizzle ORM**: Type-safe database operations and schema management
- **Drizzle Kit**: Database migration and schema generation tools

### UI and Design System
- **Radix UI**: Accessible component primitives for complex UI elements
- **shadcn/ui**: Pre-built component library built on Radix UI
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Lucide React**: Icon library for consistent iconography

### Email and Communication
- **Nodemailer**: Email sending capabilities with SMTP support
- **Gmail API**: Integration option for Google Workspace environments

### File and Media Processing
- **jsPDF**: Client-side PDF generation for visitor badges
- **Browser WebRTC**: Camera access for photo capture functionality

### Development and Build Tools
- **Vite**: Fast development server and build tool
- **TypeScript**: Type safety across frontend and backend
- **React Query**: Server state management and caching
- **React Hook Form**: Form handling with validation

### Authentication and Security
- **bcrypt**: Password hashing for secure credential storage
- **Express Session**: Session management middleware
- **Zod**: Runtime type validation and schema enforcement

### Optional Integrations
- **OAuth2 Provider**: Configurable enterprise SSO integration
- **Custom SMTP**: Support for enterprise email systems
- **Company Branding**: Customizable logos and company information

## Testing

The application includes a comprehensive test suite to ensure reliability and maintainability. Tests are written using Vitest for unit testing and React Testing Library for component testing.

### Test Coverage

#### Backend Tests
- **Storage Layer** (`test/server/storage.test.ts`)
  - Visitor CRUD operations
  - Admin authentication and credentials verification
  - Statistics calculation
  - Audit log creation and retrieval
  - Session management

- **API Routes** (`test/server/routes.test.ts`)
  - Visitor sign-in/sign-out endpoints
  - Admin authentication endpoints
  - Protected route authorization
  - Request validation
  - Error handling

#### Frontend Tests
- **Components** 
  - `test/components/visitor-signin.test.tsx` - Visitor sign-in form validation and flow
  - `test/components/admin-dashboard.test.tsx` - Dashboard rendering, filtering, and interactions
  
- **Utilities**
  - `test/lib/utils.test.ts` - Utility function testing (classname merging)
  - `test/lib/pdf-generator.test.ts` - PDF badge generation functionality

### Running Tests

To run the test suite, add these scripts to your package.json:

```json
"scripts": {
  "test": "vitest",
  "test:coverage": "vitest run --coverage",
  "test:watch": "vitest --watch",
  "test:ui": "vitest --ui"
}
```

Then use:

```bash
# Run all tests
npm test

# Run tests with coverage report
npm run test:coverage

# Run tests in watch mode during development
npm run test:watch

# Run tests with UI
npm run test:ui
```

### Test Configuration

Tests are configured in `vitest.config.ts` with:
- JSdom environment for React component testing
- Global test setup for common configurations
- Path aliases matching the application structure
- Coverage reporting for code quality metrics

### Test Best Practices

- All critical business logic has unit tests
- Components are tested for user interactions and rendering
- API endpoints are tested for both success and error cases
- Mock data is used consistently across tests
- Tests are isolated and can run independently