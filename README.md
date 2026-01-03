# Grow

A beautiful savings goals tracker for iOS. Set financial targets, track your progress, and watch your savings grow.

## Features

- **Savings Goals** — Create accounts with target amounts and track your progress visually
- **Deposits & Withdrawals** — Log money in and out with a delightful numeric keypad
- **Transfers** — Move funds between accounts seamlessly
- **Transaction History** — View all activity for each account
- **Archive** — Completed or paused goals can be archived and restored
- **Multi-Device Sync** — Sync data between devices using peer-to-peer connections
- **Legacy Import** — Import accounts and transactions from the previous version of Grow

## Screenshots

_Coming soon_

## Tech Stack

- [Expo](https://expo.dev) SDK 55 (New Architecture)
- [React Native](https://reactnative.dev) 0.83
- [expo-router](https://docs.expo.dev/router/introduction/) — File-based routing
- [expo-sqlite](https://docs.expo.dev/versions/latest/sdk/sqlite/) — Local SQLite database
- [expo-nearby-connections](https://github.com/jonstuebe/expo-nearby-connections) — Peer-to-peer sync
- [TanStack Query](https://tanstack.com/query) — Async state management
- [XState](https://xstate.js.org) — State machine for sync protocol
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
│   ├── archived.tsx        # Archived accounts
│   ├── sync.tsx            # Multi-device sync
│   └── import.tsx          # Legacy data import
├── components/             # Reusable UI components
├── context/                # React contexts
│   └── nearby-connections.tsx  # P2P connection management
├── db/                     # Database layer
│   ├── hooks.ts            # React Query hooks
│   ├── queries.ts          # SQL queries
│   ├── migrations/         # SQL migration files
│   ├── provider.tsx        # Database context provider
│   ├── sync.ts             # Sync message types & merge logic
│   └── import.ts           # Legacy backup import
├── hooks/                  # Custom React hooks
│   ├── syncMachine.ts      # XState sync state machine
│   ├── useSyncMachine.ts   # Sync machine React hook
│   └── useBackgroundAdvertising.tsx  # Background P2P advertising
├── theme/                  # Design tokens & theming
├── utils/                  # Utility functions
└── assets/                 # App icons & images
```

## Multi-Device Sync

Grow supports syncing data between multiple iOS devices using peer-to-peer connections via the Multipeer Connectivity framework.

### How It Works

1. Open the Sync screen on both devices
2. Devices automatically advertise their presence while the app is in the foreground
3. Tap "Start Discovery" to find nearby devices
4. Select a device and tap "Sync" to initiate
5. The sync uses a latest-wins merge strategy based on `updated_at` timestamps

### Sync Protocol

The sync uses a 4-message handshake:

1. **SYNC_REQUEST** — Device A initiates sync
2. **SYNC_RESPONSE** — Device B sends its accounts and transactions
3. **SYNC_DATA** — Device A merges, then sends its data back
4. **SYNC_ACK** — Device B merges and confirms completion

Both devices end up with the same merged data set.

## Legacy Import

If you're upgrading from a previous version of Grow, you can import your existing data:

1. Export a backup from the old app (`.db.json` file)
2. Open Grow and navigate to Import
3. Select your backup file
4. Preview and confirm the import

## Building for Production

### iOS (TestFlight)

The quickest way to deploy to TestFlight is with the `npx testflight` command:

```bash
npx testflight
```

This interactive wizard handles everything in one step:

- Apple Developer sign-in and credentials
- Distribution certificates and provisioning profiles
- Production build
- App Store Connect submission

For more control, you can run the EAS commands separately:

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
