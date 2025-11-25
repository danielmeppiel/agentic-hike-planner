# Agentic Hike Planner 🥾

An AI-powered hiking trip planning application that helps outdoor enthusiasts discover, plan, and organize their perfect hiking adventures. Built with TypeScript and powered by Azure AI Foundry agents.

## 🌟 Features

### For Users
- **Intelligent Trip Planning**: Chat with our AI agent to get personalized hiking recommendations
- **User Authentication**: Secure account creation and login system
- **Interactive Chat Interface**: Natural language conversations to plan your hiking trips
- **Personalized Recommendations**: AI considers your experience level, preferences, and fitness goals
- **Trip Management**: Save, modify, and organize your planned hiking trips
- **Trail Information**: Access detailed trail descriptions, difficulty levels, and safety information

### For Developers
- **TypeScript-first**: Fully typed codebase for better development experience
- **Azure Native**: Built on Azure services for scalability and reliability
- **Modern Architecture**: Clean separation of concerns with microservices approach
- **AI Integration**: Seamless integration with Azure AI Foundry for intelligent features
- **Comprehensive Testing**: Unit, integration, and end-to-end test coverage

## 🏗️ Architecture

This application demonstrates a multi-tier web architecture on Azure:

- **Frontend**: React TypeScript SPA hosted on Azure Static Web Apps
- **Backend API**: Node.js TypeScript API running on Azure App Service
- **Database**: Azure Cosmos DB for user data and trip information
- **AI Agent**: Azure AI Foundry agent for hiking recommendations
- **Authentication**: Azure Active Directory B2C for user management
- **Storage**: Azure Blob Storage for trail images and documents
- **Monitoring**: Azure Application Insights for performance tracking

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Azure subscription
- Azure CLI installed and configured
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/agentic-hike-planner.git
   cd agentic-hike-planner
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your Azure service configurations
   ```

4. **Run locally**
   ```bash
   npm run dev
   ```

### Environment Variables

```env
# Azure Configuration
AZURE_COSMOS_DB_ENDPOINT=https://your-cosmos.documents.azure.com:443/
AZURE_COSMOS_DB_KEY=your-cosmos-key
AZURE_AD_B2C_TENANT_ID=your-tenant-id
AZURE_AD_B2C_CLIENT_ID=your-client-id
AZURE_AI_FOUNDRY_ENDPOINT=https://your-ai.openai.azure.com/
AZURE_AI_FOUNDRY_KEY=your-ai-key
AZURE_STORAGE_ACCOUNT_NAME=your-storage-account
AZURE_STORAGE_ACCOUNT_KEY=your-storage-key
```

## 📁 Project Structure

```
agentic-hike-planner/
├── frontend/                 # React TypeScript frontend
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── services/        # API service layer
│   │   └── types/           # TypeScript type definitions
│   └── public/              # Static assets
├── backend/                  # Node.js TypeScript API
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   ├── services/        # Business logic
│   │   ├── models/          # Data models
│   │   ├── middleware/      # Express middleware
│   │   └── routes/          # API route definitions
│   └── tests/               # Backend tests
├── infrastructure/          # Azure infrastructure as code
│   ├── bicep/              # Azure Bicep templates
│   ├── terraform/          # Terraform configurations (alternative)
│   └── scripts/            # Deployment scripts
├── docs/                    # Documentation
│   ├── api.md              # API documentation
│   ├── deployment.md       # Deployment guide
│   └── demo.md             # Demo and testing guide
└── .github/                 # GitHub workflows and templates
    └── workflows/          # CI/CD pipelines
```

## 🤖 AI Agent Features

The Azure AI Foundry agent provides:

- **Trail Recommendations**: Based on location, difficulty, and preferences
- **Weather Integration**: Real-time weather considerations for trip planning
- **Safety Advice**: Personalized safety recommendations based on trail conditions
- **Equipment Suggestions**: AI-powered gear recommendations for specific trails
- **Route Optimization**: Intelligent route planning for multi-day hikes

## 🧪 Testing

```bash
# Run all tests
npm test

# Run frontend tests
npm run test:frontend

# Run backend tests
npm run test:backend

# Run e2e tests
npm run test:e2e
```

## 🚀 Deployment

This application can be deployed to Azure using the provided Infrastructure as Code templates:

```bash
# Deploy using Azure Bicep
az deployment group create \
  --resource-group rg-hike-planner \
  --template-file infrastructure/bicep/main.bicep \
  --parameters @infrastructure/bicep/parameters.json

# Or deploy using Azure Developer CLI
azd up
```

See [docs/deployment.md](docs/deployment.md) for detailed deployment instructions.

## 🔧 Configuration

### Azure Services Setup
1. **Azure Cosmos DB**: NoSQL database for user profiles and trip data
2. **Azure AI Foundry**: AI agent for hiking recommendations
3. **Azure Active Directory B2C**: User authentication and authorization
4. **Azure App Service**: Backend API hosting
5. **Azure Static Web Apps**: Frontend hosting
6. **Azure Blob Storage**: File storage for trail images and documents
7. **Azure Application Insights**: Monitoring and analytics

### Local Development
- Frontend runs on `http://localhost:3000`
- Backend API runs on `http://localhost:3001`
- Hot reload enabled for both frontend and backend

## 📊 Monitoring and Analytics

The application includes comprehensive monitoring:
- **Application Performance**: Azure Application Insights
- **User Analytics**: Custom telemetry for user interactions
- **AI Agent Metrics**: Azure AI Foundry usage and performance metrics
- **Infrastructure Monitoring**: Azure Monitor for resource utilization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript strict mode
- Write tests for new features
- Use conventional commit messages
- Update documentation for significant changes

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Azure AI Foundry** for providing powerful AI capabilities
- **Azure Platform** for robust cloud infrastructure
- **React Community** for excellent frontend tooling
- **TypeScript Team** for type safety and developer experience

## 💰 Cost Optimization

This repository includes tools and templates for demonstrating Azure cost optimization:

- **App Service Plan Optimization**: Right-size from Standard S3 to Basic B2 for $120/month savings (80% reduction)
- **Demo Deployments**: Intentionally inefficient configurations to showcase optimization opportunities
- **Automated Scripts**: End-to-end deployment, optimization, and testing workflows

See [docs/cost-optimization-appservice.md](docs/cost-optimization-appservice.md) for detailed instructions.

## 📞 Support

- **Documentation**: [docs/](docs/)
- **Cost Optimization Guide**: [docs/cost-optimization-appservice.md](docs/cost-optimization-appservice.md)
- **Demo Guide**: [docs/demo.md](docs/demo.md)
- **Issues**: [GitHub Issues](https://github.com/your-username/agentic-hike-planner/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/agentic-hike-planner/discussions)

---

**Happy Hiking! 🏔️**