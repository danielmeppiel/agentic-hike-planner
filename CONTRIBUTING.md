# Contributing to Agentic Hike Planner 🥾

Welcome to the Agentic Hike Planner project! We're excited to have you contribute to our AI-powered hiking trip planning application. This guide will help you get started with development, understand our coding standards, and contribute effectively to the project.

## 📋 Table of Contents

- [Development Environment Setup](#development-environment-setup)
- [Project Structure](#project-structure)
- [Code Style and Conventions](#code-style-and-conventions)
- [Testing Requirements](#testing-requirements)
- [Azure Development Setup](#azure-development-setup)
- [Pull Request Process](#pull-request-process)
- [Build and Deployment](#build-and-deployment)
- [Getting Help](#getting-help)

## 🚀 Development Environment Setup

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **Git** - [Download here](https://git-scm.com/)
- **Azure CLI** - [Installation guide](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli)
- **Azure subscription** - For testing with real Azure services
- **Code Editor** - VS Code recommended with TypeScript extension

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/danielmeppiel/agentic-hike-planner.git
   cd agentic-hike-planner
   ```

2. **Install root dependencies**
   ```bash
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   cd ..
   ```

4. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   cd ..
   ```

5. **Configure environment variables**
   ```bash
   # Backend environment
   cp backend/.env.example backend/.env
   # Edit backend/.env with your Azure configurations
   
   # Frontend environment (if needed)
   cp frontend/.env.example frontend/.env
   ```

6. **Start development servers**
   ```bash
   # Terminal 1: Start backend (http://localhost:3001)
   cd backend
   npm run dev
   
   # Terminal 2: Start frontend (http://localhost:3000)
   cd frontend
   npm run dev
   ```

### Environment Variables

The backend requires several Azure service configurations. See `backend/.env.example` for the complete list:

```env
# Core Configuration
NODE_ENV=development
PORT=3001
CORS_ORIGIN=http://localhost:3000

# Azure Configuration
AZURE_COSMOS_DB_ENDPOINT=https://your-cosmos.documents.azure.com:443/
AZURE_COSMOS_DB_KEY=your-cosmos-key
AZURE_COSMOS_DB_DATABASE_NAME=HikePlannerDB
AZURE_AD_B2C_TENANT_ID=your-tenant-id
AZURE_AD_B2C_CLIENT_ID=your-client-id
AZURE_AI_FOUNDRY_ENDPOINT=https://your-ai.openai.azure.com/
AZURE_AI_FOUNDRY_KEY=your-ai-key
AZURE_STORAGE_ACCOUNT_NAME=your-storage-account
AZURE_STORAGE_ACCOUNT_KEY=your-storage-key

# Authentication (Optional - for Azure AD integration)
USE_AAD_AUTH=false
```

## 📁 Project Structure

```
agentic-hike-planner/
├── frontend/                    # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/             # Page components
│   │   ├── services/          # API services and utilities
│   │   ├── types/             # TypeScript type definitions
│   │   ├── utils/             # Helper functions
│   │   └── App.tsx            # Main application component
│   ├── public/                # Static assets
│   ├── package.json
│   ├── tsconfig.json
│   ├── eslint.config.js
│   └── vite.config.ts
├── backend/                     # Node.js + Express + TypeScript
│   ├── src/
│   │   ├── controllers/       # Request handlers
│   │   ├── middleware/        # Express middleware
│   │   ├── routes/           # API route definitions
│   │   ├── services/         # Business logic and Azure integration
│   │   ├── config/           # Configuration management
│   │   └── server.ts         # Application entry point
│   ├── scripts/              # Utility scripts
│   ├── package.json
│   ├── tsconfig.json
│   └── .eslintrc.json
├── infrastructure/              # Azure Infrastructure as Code
│   ├── bicep/                # Azure Bicep templates
│   ├── terraform/            # Terraform configurations (alternative)
│   └── scripts/              # Deployment scripts
├── tests/                      # Test suites
│   ├── unit/                 # Unit tests
│   ├── integration/          # Integration tests
│   ├── performance/          # Performance tests
│   └── utils/                # Test utilities
├── docs/                       # Documentation
├── scripts/                    # Build and deployment scripts
└── package.json               # Root package configuration
```

## 🎨 Code Style and Conventions

### TypeScript Configuration

**Frontend (Strict Mode)**
- Strict TypeScript mode enabled
- No `any` types allowed (use proper typing)
- Unused variables and parameters flagged as errors
- React-specific TypeScript patterns

**Backend (Relaxed Mode)**
- TypeScript with relaxed strictness for rapid development
- Gradual migration to stricter typing encouraged
- Focus on type safety for Azure integrations

### ESLint Rules

**Frontend (`frontend/eslint.config.js`)**
```javascript
// Key rules:
- React hooks rules enforced
- TypeScript strict rules
- No unused variables
- Proper JSX formatting
```

**Backend (`backend/.eslintrc.json`)**
```json
{
  "rules": {
    "indent": ["error", 2],
    "quotes": ["error", "single"],
    "semi": ["error", "always"],
    "linebreak-style": ["error", "unix"]
  }
}
```

### Naming Conventions

- **Files**: kebab-case (`user-profile.component.ts`)
- **Components**: PascalCase (`UserProfile`)
- **Functions**: camelCase (`getUserData`)
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`)
- **Interfaces**: PascalCase with 'I' prefix (`IUserProfile`)
- **Types**: PascalCase (`UserRole`)

### Code Organization

- Group imports by: React, external libraries, internal modules
- Use absolute imports where configured
- Keep components focused and single-responsibility
- Prefer composition over inheritance
- Use TypeScript interfaces for data contracts

### Example Component Structure

```typescript
// Frontend component example
import React from 'react';
import { useState, useEffect } from 'react';
import { Button, Card } from '@headlessui/react';

import { userService } from '../services/user.service';
import { IUserProfile } from '../types';

interface UserProfileProps {
  userId: string;
  onUpdate?: (profile: IUserProfile) => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ 
  userId, 
  onUpdate 
}) => {
  // Component implementation
};
```

## 🧪 Testing Requirements

### Test Structure

```
tests/
├── unit/                    # Fast, isolated tests
├── integration/            # Component integration tests
│   └── azure/             # Azure service integration
├── performance/           # Performance benchmarks
└── utils/                 # Test utilities and helpers
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test types
npm run test:unit
npm run test:integration
npm run test:azure        # Requires real Azure resources

# Backend tests only
cd backend
npm run test:unit
npm run test:integration

# Frontend tests
cd frontend
npm test
```

### Test Requirements

**Unit Tests**
- Cover all business logic functions
- Mock external dependencies (Azure services, APIs)
- Fast execution (< 1 second per test)
- High code coverage (aim for 80%+)

**Integration Tests**
- Test component interactions
- Database operations with test data
- API endpoint functionality
- Error handling scenarios

**Azure Integration Tests**
- Test real Azure service connections
- Validate authentication flows
- Performance benchmarking
- Resource cleanup after tests

### Writing Tests

**Unit Test Example**
```typescript
// tests/unit/user.service.test.ts
import { userService } from '../../backend/src/services/user.service';

describe('UserService', () => {
  test('should create user profile', async () => {
    const profile = await userService.createProfile({
      name: 'Test User',
      email: 'test@example.com'
    });
    
    expect(profile.id).toBeDefined();
    expect(profile.name).toBe('Test User');
  });
});
```

**Integration Test Example**
```typescript
// tests/integration/azure/cosmos-db.test.ts
import { DatabaseService } from '../../backend/src/services/database';

describe('Cosmos DB Integration', () => {
  let databaseService: DatabaseService;
  
  beforeAll(() => {
    // Requires real Azure credentials
    if (!process.env.AZURE_COSMOS_DB_ENDPOINT) {
      throw new Error('Azure integration tests require real credentials');
    }
    databaseService = new DatabaseService();
  });
  
  test('should connect to Cosmos DB', async () => {
    const health = await databaseService.healthCheck();
    expect(health.status).toBe('healthy');
  });
});
```

## ☁️ Azure Development Setup

### Azure CLI Setup

1. **Install and Login**
   ```bash
   # Install Azure CLI (if not already installed)
   # Follow: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli
   
   # Login to Azure
   az login
   
   # Set your subscription
   az account set --subscription "your-subscription-id"
   ```

2. **Setup Local Authentication**
   ```bash
   # Run the backend authentication setup script
   cd backend
   ./scripts/setup-azure-auth.sh
   ```

### Azure Services Configuration

The application integrates with these Azure services:

- **Azure Cosmos DB** - NoSQL database for user profiles and trip data
- **Azure AI Foundry** - AI agent for hiking recommendations  
- **Azure Active Directory B2C** - User authentication
- **Azure App Service** - Backend API hosting
- **Azure Static Web Apps** - Frontend hosting
- **Azure Blob Storage** - File storage for trail images
- **Azure Application Insights** - Monitoring and analytics

### Local Development with Azure

**Option 1: Mock Services (Recommended for initial development)**
```bash
# Use mock data for local development
export USE_MOCK_DATA=true
npm run dev
```

**Option 2: Real Azure Services**
```bash
# Configure .env with real Azure credentials
# See backend/.env.example for required variables
npm run dev
```

### Azure Resource Management

**Create Development Resources**
```bash
# Deploy development environment
./scripts/deploy.sh --environment dev --resource-group rg-hike-planner-dev

# Validate infrastructure templates
./scripts/validate.sh --environment dev
```

**Cleanup Resources**
```bash
# Delete development resources (be careful!)
az group delete --name rg-hike-planner-dev --yes
```

## 🔄 Pull Request Process

### Branch Naming

Use descriptive branch names with prefixes:

- `feature/` - New features (`feature/trail-search-ui`)
- `fix/` - Bug fixes (`fix/auth-token-refresh`)
- `refactor/` - Code refactoring (`refactor/user-service-cleanup`)
- `docs/` - Documentation (`docs/api-documentation`)
- `test/` - Test improvements (`test/azure-integration-tests`)

### Commit Messages

Follow conventional commit format:

```
type(scope): description

feat(frontend): add trail search filters
fix(backend): resolve Cosmos DB connection timeout
docs(readme): update Azure setup instructions
test(unit): add user service test coverage
refactor(api): simplify error handling middleware
```

### Pull Request Checklist

Before submitting a PR, ensure:

- [ ] Code follows project style guidelines
- [ ] All linting passes (`npm run lint`)
- [ ] All tests pass (`npm test`)
- [ ] New features include tests
- [ ] Documentation updated if needed
- [ ] Azure resources tested (if applicable)
- [ ] No sensitive data in commits
- [ ] PR description explains changes and reasoning

### PR Description Template

```markdown
## Description
Brief description of changes and motivation.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Tested with Azure services
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Tests pass locally
- [ ] Documentation updated
```

### Review Process

1. **Automated Checks**: GitHub Actions will run linting, tests, and security scans
2. **Code Review**: At least one maintainer will review your code
3. **Testing**: Changes will be tested in a development environment
4. **Approval**: PR must be approved before merging
5. **Merge**: Use "Squash and merge" for clean history

## 🔨 Build and Deployment

### Local Build Commands

```bash
# Build backend
cd backend
npm run build

# Build frontend  
cd frontend
npm run build

# Lint backend
cd backend
npm run lint
npm run lint:fix  # Auto-fix issues

# Lint frontend
cd frontend
npm run lint

# Test entire project (from root)
npm test
npm run test:unit
npm run test:integration
```

> **Note**: There may be existing build or test issues in the project. Focus on ensuring your changes don't introduce new issues, and feel free to fix existing ones if they're related to your work.

### Deployment Process

**Development Environment**
```bash
# Deploy to Azure development environment
./scripts/deploy.sh --environment dev --resource-group rg-hike-planner-dev
```

**Production Deployment**
```bash
# Deploy to production (requires approval)
./scripts/deploy.sh --environment prod --resource-group rg-hike-planner-prod
```

**Azure Developer CLI (Alternative)**
```bash
# Deploy using azd
azd up
```

### Infrastructure Validation

```bash
# Validate Bicep templates
./scripts/validate.sh --template-type bicep --environment dev

# Validate entire infrastructure
./scripts/validate.sh --template-type all --environment dev
```

## 🆘 Getting Help

### Resources

- **Project Documentation**: `/docs` folder
- **API Documentation**: `docs/api.md`
- **Deployment Guide**: `docs/deployment.md`
- **Demo Guide**: `docs/demo.md`

### Communication

- **Issues**: Use GitHub Issues for bugs and feature requests
- **Discussions**: Use GitHub Discussions for questions and ideas
- **Code Review**: Comment on PRs for code-specific discussions

### Common Issues

**Azure Authentication Problems**
```bash
# Re-login to Azure CLI
az login --use-device-code

# Check current account
az account show

# List available subscriptions
az account list --output table
```

**TypeScript Compilation Errors**
```bash
# Clear TypeScript cache
rm -rf node_modules/.cache
rm -rf dist/

# Reinstall dependencies
npm install
```

**Test Failures**
```bash
# Run tests in verbose mode
npm test -- --verbose

# Run specific test file
npm test -- user.service.test.ts
```

## 🎯 Development Philosophy

Our development approach prioritizes:

1. **Speed and Simplicity** - Deliver working solutions quickly
2. **Scalability** - Design for growth but start simple
3. **Type Safety** - Use TypeScript effectively
4. **Azure Integration** - Leverage Azure services efficiently
5. **User Experience** - Focus on practical hiking trip planning
6. **Code Quality** - Maintain high standards through review and testing

---

Thank you for contributing to Agentic Hike Planner! Your contributions help create better hiking experiences for outdoor enthusiasts worldwide. 🥾✨