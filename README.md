# Grow

A beautiful savings goals tracker for iOS. Set financial targets, track your progress, and watch your savings grow.

## Features

- **Savings Goals** — Create accounts with target amounts and track your progress visually
- **Deposits & Withdrawals** — Log money in and out with a delightful numeric keypad
- **Transfers** — Move funds between accounts seamlessly
- **Transaction History** — View all activity for each account
- **Archive** — Completed or paused goals can be archived and restored

## Screenshots

_Coming soon_

## Tech Stack

- [Expo](https://expo.dev) SDK 55 (New Architecture)
- [React Native](https://reactnative.dev) 0.83
- [expo-router](https://docs.expo.dev/router/introduction/) — File-based routing
- [expo-sqlite](https://docs.expo.dev/versions/latest/sdk/sqlite/) — Local SQLite database
- [TanStack Query](https://tanstack.com/query) — Async state management
- [Zod](https://zod.dev) — Schema validation
- [expo-glass-effect](https://docs.expo.dev/versions/latest/sdk/glass-effect/) — iOS glass blur effects
- [Vitest](https://vitest.dev) — Unit testing

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) (recommended) or Node.js 18+
- [Xcode](https://developer.apple.com/xcode/) 15+ (for iOS development)
- [EAS CLI](https://docs.expo.dev/eas/) (`npm install -g eas-cli`)

### Installation

```bash
# Clone the repository
git clone https://github.com/jonstuebe/grow.git
cd grow

# Install dependencies
bun install
```

### Development

```bash
# Start the development server
bun start

# Run on iOS simulator
bun ios

# Run on Android emulator
bun android
```

### Testing

```bash
# Run tests in watch mode
bun test

# Run tests once
bun test:run
```

## Project Structure

```
grow/
├── app/                    # Screens (file-based routing)
│   ├── _layout.tsx         # Root layout with providers
│   ├── index.tsx           # Home screen - account list
│   ├── [id].tsx            # Account detail/edit
│   ├── new.tsx             # Create new account
│   ├── deposit.tsx         # Make a deposit
│   ├── withdrawal.tsx      # Make a withdrawal
│   ├── transfer.tsx        # Transfer between accounts
│   ├── transactions.tsx    # Transaction history
│   └── archived.tsx        # Archived accounts
├── components/             # Reusable UI components
├── db/                     # Database layer
│   ├── hooks.ts            # React Query hooks
│   ├── queries.ts          # SQL queries
│   ├── migrations/         # SQL migration files
│   └── provider.tsx        # Database context provider
├── hooks/                  # Custom React hooks
├── theme/                  # Design tokens & theming
├── utils/                  # Utility functions
└── assets/                 # App icons & images
```

## Building for Production

### iOS (TestFlight)

```bash
# Build for production
eas build --platform ios --profile production

# Submit to App Store Connect
eas submit --platform ios
```

## Database

The app uses SQLite for local data persistence. Monetary values are stored in cents (integers) to avoid floating-point precision issues.

### Schema

- **accounts** — Savings goals with name, target amount, and archive status
- **transactions** — Deposits, withdrawals, and transfers with full history

Migrations are located in `db/migrations/` and run automatically on app start.

## License

MIT © [Jon Stuebe](https://jonstuebe.com)

