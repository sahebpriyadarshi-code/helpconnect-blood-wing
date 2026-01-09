# HelpConnect Blood Wing

## Emergency Blood Coordination System

**A decentralized platform for matching blood donors with recipients in emergency situations.**

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Installation](#installation)
- [Development](#development)
- [Deployment](#deployment)
- [Testing](#testing)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

**HelpConnect Blood Wing** is an emergency blood coordination system designed to rapidly connect blood donors with patients in critical need. The platform uses advanced auto-matching algorithms to identify compatible donors and streamline the blood donation process.

### Problem Statement
Emergency situations often require immediate blood transfusions, but finding compatible donors is time-consuming and critical. HelpConnect solves this by:
- Automating donor-recipient matching based on blood type compatibility
- Providing real-time notifications to eligible donors
- Maintaining a registry of available donors by location
- Ensuring rapid response times in emergencies

### Solution
A decentralized platform built on Internet Computer that:
- Matches donors with recipients using sophisticated algorithms
- Respects privacy with blockchain-based verification
- Provides instant notifications to eligible donors
- Maintains accurate, up-to-date donor registries
- Works even in offline-first scenarios

---

## Features

### Donor Features
- ✅ **Donor Registration**: Register with blood type, location, and availability
- ✅ **Profile Management**: Update health status, contact information, and preferences
- ✅ **Auto-Matching Notifications**: Receive instant alerts for compatible blood requests
- ✅ **Donation Tracking**: Track past donations and schedule future donations
- ✅ **Public Discovery**: Be discoverable by the system for urgent requests
- ✅ **Dashboard**: Monitor requests and donation history

### Recipient Features
- ✅ **Blood Request Creation**: Post urgent blood requests with specific requirements
- ✅ **Auto-Matching**: System automatically finds compatible donors
- ✅ **Donor Communication**: Direct contact with matched donors
- ✅ **Request Status Tracking**: Monitor request fulfillment status
- ✅ **Request History**: View past donations received

### System Features
- ✅ **Blood Type Compatibility Rules**:
  - O- (Universal Donor): Can donate to all
  - O+ (Common Donor): Can donate to all positive types
  - A+/A-: Compatible with A and AB
  - B+/B-: Compatible with B and AB
  - AB+/AB-: Can only receive from AB (Universal Recipient)

- ✅ **Auto-Matching Algorithm**: 
  - Real-time donor matching
  - Compatibility scoring
  - Location-based prioritization
  - Availability consideration

- ✅ **Authorization & Security**:
  - Role-based access control (Donor, Recipient, Admin)
  - Data encryption
  - Privacy-preserving matching

---

## Tech Stack

### Frontend
- **React 18+** - UI framework
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **React Query** - Data fetching and state management
- **Internet Computer Agent** - Canister communication

### Backend
- **Motoko** - Internet Computer canister language
- **Internet Computer** - Decentralized deployment platform
- **Candid** - Interface Description Language (IDL)

### Development Tools
- **dfx** - Internet Computer SDK
- **Node.js 16+** - Runtime environment
- **npm/yarn** - Package management

### Code Distribution
- **71.7%** TypeScript
- **23.5%** Motoko
- **2.8%** JavaScript
- **1.8%** CSS
- **0.2%** HTML

---

## Project Structure

```
helpconnect-blood-wing/
├── src/
│   ├── components/
│   │   ├── Header.tsx              # Navigation header
│   │   ├── Footer.tsx              # Footer component
│   │   ├── Layout.tsx              # Main layout wrapper
│   │   └── ProfileSetupModal.tsx   # Profile setup modal
│   ├── pages/
│   │   ├── App.tsx                 # App initialization & routing
│   │   ├── LandingPage.tsx         # Home/landing page
│   │   ├── DonorRegistrationPage.tsx # Donor signup
│   │   ├── DonorPage.tsx           # Donor home
│   │   ├── DonorDashboardPage.tsx  # ✅ Donor dashboard (FIXED)
│   │   ├── RequestBloodPage.tsx    # Request blood form
│   │   ├── RequestStatusPage.tsx   # Track requests
│   │   ├── StatusTrackingPage.tsx  # Status updates
│   │   └── FinalOutcomePage.tsx    # Outcome confirmation
│   ├── hooks/
│   │   ├── useQueries.ts           # ✅ Query hooks (FIXED)
│   │   ├── useEditor.ts            # Editor functionality
│   │   └── custom hooks
│   ├── styles/
│   │   └── index.css               # Global styles
│   ├── main.tsx                    # React entry point
│   └── App.tsx                     # App router & config
├── canisters/
│   └── main.mo                     # ✅ Motoko backend (FIXED)
├── public/
│   └── index.html                  # HTML entry point
├── config/
│   ├── tailwind.config.js          # Tailwind CSS config
│   ├── dfx.json                    # Internet Computer config
│   └── access-control.mo           # Authorization module
├── docs/
│   ├── spec.md                     # Technical specifications
│   ├── DEPLOYMENT.md               # Deployment guide
│   ├── CONTRIBUTING.md             # Contributing guidelines
│   ├── API.md                      # API documentation
│   └── TESTING.md                  # Testing guide
├── migrations/
│   └── migration.mo                # Database migrations
├── README.md                       # This file
├── package.json                    # Dependencies
└── dfx.json                        # DFX configuration
```

---

## Getting Started

### Prerequisites

```bash
# Check Node.js version (16+)
node --version

# Install Node.js from https://nodejs.org/
# Install Internet Computer SDK from https://sdk.dfinity.org/
```

### Quick Start (5 minutes)

```bash
# 1. Clone repository
git clone https://github.com/sahebpriyadarshi-code/helpconnect-blood-wing.git
cd helpconnect-blood-wing

# 2. Start local Internet Computer
dfx start --background

# 3. Deploy to local network
dfx deploy

# 4. Get canister URLs from output
# Frontend: http://localhost:3000
# Backend: Check dfx output for canister URL

# 5. Start development server
npm install
npm start
```

The app will open at `http://localhost:3000`

---

## Installation

### Step 1: Install Dependencies

```bash
# Install Internet Computer SDK (macOS/Linux)
sh -ci "$(curl -fsSL https://sdk.dfinity.org/install.sh)"

# For Windows, download from: https://sdk.dfinity.org/

# Verify installation
dfx --version
```

### Step 2: Clone Repository

```bash
git clone https://github.com/sahebpriyadarshi-code/helpconnect-blood-wing.git
cd helpconnect-blood-wing
```

### Step 3: Install Node Packages

```bash
npm install
# or
yarn install
```

### Step 4: Configure dfx

```bash
# Initialize identity (if new)
dfx identity new
dfx identity use default
```

---

## Development

### Start Local Development Environment

```bash
# Terminal 1: Start Internet Computer replica
dfx start

# Terminal 2: In project directory
dfx deploy

# Terminal 3: Start React dev server
npm start
```

### Development Commands

```bash
# Build frontend
npm run build

# Run tests
npm test

# Format code
npm run format

# Lint code
npm run lint

# Watch files and rebuild
npm run watch
```

### API Development

```bash
# View Motoko canister code
cat src/main.mo

# Deploy updates to canister
dfx deploy main

# Test canister functions
dfx canister call main someFunction
```

---

## Deployment

### Deploy to Internet Computer Mainnet

See `DEPLOYMENT.md` for detailed instructions on:
- Creating Internet Computer principal
- Obtaining cycles (ICP tokens)
- Deploying to mainnet
- Custom domain setup
- Monitoring and maintenance

### Quick Deploy to Mainnet

```bash
# 1. Create production identity
dfx identity new production
dfx identity use production

# 2. Get cycles from https://dashboard.dfinity.org/

# 3. Deploy to mainnet
dfx deploy --ic

# 4. Get your canister ID
dfx canister id main --ic

# Access at: https://<CANISTER_ID>.icp0.io/
```

---

## Testing

### Automated Testing

```bash
# Run all tests
npm test

# Run specific test suite
npm test DonorDashboard

# Run with coverage
npm test -- --coverage
```

### Manual Testing Checklist

See `TESTING.md` for comprehensive testing guide including:
- ✅ Donor registration flow
- ✅ Blood request creation
- ✅ Auto-matching algorithm
- ✅ Blood type compatibility rules
- ✅ Dashboard functionality
- ✅ Authorization checks
- ✅ UI/UX testing

### Test Scenarios

```
1. Donor Registration
   - Register new donor
   - Select blood type
   - Verify email
   - Complete profile

2. Blood Request
   - Create urgent request
   - System finds compatible donors
   - Notify donors
   - Track fulfillment

3. Auto-Matching
   - Verify blood type rules
   - Check compatibility scoring
   - Validate location matching
   - Test notification system
```

---

## API Documentation

See `API.md` for complete API documentation

### Key Endpoints

```
Donor Management:
  POST /api/donors/register
  GET /api/donors/:id
  PUT /api/donors/:id
  GET /api/donors/search

Blood Requests:
  POST /api/requests/create
  GET /api/requests
  GET /api/requests/:id
  PUT /api/requests/:id/status

Matching:
  POST /api/matching/find-donors
  GET /api/matching/results/:requestId
  POST /api/matching/notify

User Management:
  POST /api/users/login
  POST /api/users/logout
  GET /api/users/profile
```

See `API.md` for detailed endpoint documentation with examples.

---

## Contributing

See `CONTRIBUTING.md` for detailed guidelines

### Quick Start for Contributors

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards

- Use TypeScript for type safety
- Follow existing code style
- Add tests for new features
- Update documentation
- Use meaningful commit messages

---

## License

This project is licensed under the MIT License - see LICENSE file for details.

---

## Support & Feedback

- **GitHub Issues**: Report bugs and request features
- **Discussions**: Ask questions and discuss features
- **Email**: Contact us at support@helpconnect.io
- **Documentation**: See `/docs` folder for detailed guides

---

## Recent Updates (January 2026)

### ✅ Fixed Issues
1. **Donor Dashboard** - Authorization and blood type filtering now working
2. **Auto-Matching Algorithm** - Full implementation with 4 query hooks
3. **Blood Type Compatibility** - All rules implemented and tested
4. **Repository Cleanup** - Removed unnecessary files (.mdm)

### 🔧 Recent Changes
- PR #1: Auto-matching algorithm implementation
- PR #2: Blood type compatibility rules
- PR #3: Query hooks for data management
- PR #4: Repository cleanup

### 📊 Current Status
- **Build Status**: ✅ Passing
- **Tests**: ✅ Passing
- **Documentation**: ✅ Complete
- **Ready for Production**: ✅ Yes

---

## Links

- **GitHub**: https://github.com/sahebpriyadarshi-code/helpconnect-blood-wing
- **Documentation**: See `/docs` folder
- **Issues**: https://github.com/sahebpriyadarshi-code/helpconnect-blood-wing/issues

---

**Built with ❤️ for emergency blood coordination**

*Last Updated: January 9, 2026*
