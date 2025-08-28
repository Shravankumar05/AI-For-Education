# Testing Documentation

## Overview

This document outlines the comprehensive testing strategy implemented for the AI-For-Education platform.

## Testing Stack

### Frontend Testing
- **Jest**: JavaScript testing framework
- **React Testing Library**: Component testing utilities
- **MSW (Mock Service Worker)**: API mocking
- **User Event**: User interaction simulation
- **jsdom**: DOM environment for testing

### Backend Testing
- **Jest**: Testing framework
- **Supertest**: HTTP assertion library
- **MongoDB Memory Server**: In-memory database for testing
- **ts-jest**: TypeScript support for Jest

## Test Structure

### Frontend Tests Location
```
frontend/src/
├── __tests__/                    # Unit tests
├── app/components/__tests__/      # Component tests
├── app/document/[id]/__tests__/   # Page-specific tests
├── __tests__/integration/        # Integration tests
└── mocks/                        # MSW handlers
```

### Backend Tests Location
```
backend/src/
├── __tests__/                    # Unit tests
├── controllers/__tests__/        # Controller tests
└── models/__tests__/             # Model tests
```

## Coverage Requirements

Both frontend and backend maintain minimum coverage thresholds:
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

## Test Categories

### 1. Unit Tests
- Individual component testing
- Function and method testing
- Model validation testing

### 2. Integration Tests
- API endpoint testing
- Database integration testing
- Service communication testing

### 3. Component Tests
- React component rendering
- User interaction testing
- Props and state testing

### 4. Controller Tests
- HTTP request/response testing
- Business logic validation
- Error handling testing

## Running Tests

### All Tests
```bash
npm test                    # Run all tests (backend + frontend)
npm run test:coverage      # Run with coverage report
npm run test:watch         # Watch mode for development
```

### Frontend Only
```bash
cd frontend
npm test                   # Run frontend tests
npm run test:watch         # Watch mode
npm run test:coverage      # Coverage report
```

### Backend Only
```bash
cd backend
npm test                   # Run backend tests
npm run test:watch         # Watch mode
npm run test:coverage      # Coverage report
```

### Integration Tests
```bash
npm run test:integration   # Run integration tests only
```

## Test Configuration

### Frontend (jest.config.js)
- **Environment**: jsdom
- **Setup**: jest.setup.js
- **Module mapping**: @/* → src/*
- **Coverage collection**: src/**/*.{js,jsx,ts,tsx}
- **Test patterns**: __tests__/**/* and *.{test,spec}.{js,jsx,ts,tsx}

### Backend (jest.config.js)
- **Environment**: node
- **Preset**: ts-jest
- **Setup**: jest.setup.js (MongoDB Memory Server)
- **Coverage collection**: src/**/*.{js,ts}
- **Test timeout**: 10000ms

## Mock Service Worker (MSW)

API endpoints mocked for frontend testing:

### Document Endpoints
- `GET /api/documents` - List documents
- `POST /api/documents/upload` - Upload document
- `GET /api/documents/:id` - Get document details

### Search Endpoints
- `POST /api/search` - Search documents

### Q&A Endpoints
- `POST /api/qa` - Ask questions

### Flashcard Endpoints
- `GET /api/flashcards/:documentId` - Get flashcards
- `POST /api/flashcards` - Create flashcard
- `PUT /api/flashcards/:id` - Update flashcard
- `DELETE /api/flashcards/:id` - Delete flashcard
- `GET /api/flashcards/:documentId/export` - Export CSV

## Test Data Management

### Frontend
- Mock data defined in `src/mocks/handlers.ts`
- Consistent test data across all tests
- MSW server handles request/response simulation

### Backend
- MongoDB Memory Server provides clean database for each test
- Test data created in `beforeEach` hooks
- Database cleared after each test

## Best Practices

### 1. Test Organization
- Group related tests in describe blocks
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)

### 2. Mocking Strategy
- Mock external dependencies
- Use MSW for API calls in frontend
- Mock MongoDB for backend tests

### 3. Test Data
- Create minimal test data
- Use factories for complex objects
- Clean up after each test

### 4. Assertions
- Test behavior, not implementation
- Use semantic queries in React Testing Library
- Verify user-visible outcomes

## Continuous Integration

Tests are designed to run in CI/CD environments:
- No external dependencies
- Consistent test data
- Fast execution times
- Comprehensive coverage reporting

## Debugging Tests

### Frontend
```bash
npm run test:watch         # Interactive watch mode
npm test -- --verbose      # Detailed output
npm test -- --runInBand    # Serial execution
```

### Backend
```bash
npm run test:watch         # Interactive watch mode
npm test -- --verbose      # Detailed output
npm test -- --detectOpenHandles  # Debug hanging tests
```

## Performance Considerations

### Test Optimization
- Parallel test execution where possible
- Efficient mock implementations
- Minimal test setup/teardown
- Strategic use of test.only and test.skip

### Memory Management
- MongoDB Memory Server cleanup
- MSW server lifecycle management
- Component unmounting in tests

## Future Enhancements

### Planned Additions
- End-to-end testing with Playwright
- Visual regression testing
- Performance testing
- Accessibility testing
- Cross-browser testing

### Test Automation
- Pre-commit hooks for test execution
- Automated coverage reporting
- Test result integration with CI/CD
- Performance benchmarking