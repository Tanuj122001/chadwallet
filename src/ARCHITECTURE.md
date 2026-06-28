# ChadWallet Production Architecture Specification

This document details the software architecture, design patterns, folder structure, and integration guidelines established for the production-ready build of **ChadWallet**.

---

## 1. Feature-First Directory Reorganization

The codebase follows a modular, feature-first clean architecture separating the Presentation Layer (UI & Hooks) from the Domain Layer (typed data schemas, exceptions, and models) and Infrastructure Layer (service abstractions, state managers, API client definitions, and secure storage adapters).

```
src/
├── api/             # API Client contract definitions
├── components/      # Global shared presentation components
├── config/          # Environment configuration, Feature Flags, and Theme tokens
├── errors/          # Custom Error wrapper exception classes
├── features/        # Feature modules containing Zustand slices and components
│   ├── auth/        # Authentication state store and flows
│   ├── market/      # Market stats and token ticker feeds
│   ├── notifications/ # Notification trackers
│   ├── portfolio/   # Wallet holdings aggregates
│   ├── settings/    # Trade slippage and priority settings
│   ├── trading/     # Dex swap quote request and execution flows
│   └── wallet/      # Embedded keys and balances managers
├── hooks/           # Stateless React Hooks bridging UI to state managers
├── models/          # Strongly typed domain entities
├── navigation/      # React Navigation parameters and routers
├── screens/         # Page layout screens (Home, Details, Splash)
├── services/        # Service abstractions (business rules layer)
├── storage/         # Secure, local, and cache storage interfaces
├── theme/           # Layout styles and custom fonts config
└── types/           # Generic API response and opaque branded types
```

---

## 2. Dependency Flow Rules (SOLID Principles)

To enforce clean separation and prevent circular dependencies, imports must always travel downwards:

```
  ┌────────────────────────────────────────────────────────┐
  │                 UI Screens / Components                │
  └───────────────────────────┬────────────────────────────┘
                              ▼
  ┌────────────────────────────────────────────────────────┐
  │                 Stateless React Hooks                  │
  └───────────────────────────┬────────────────────────────┘
                              ▼
  ┌────────────────────────────────────────────────────────┐
  │             Zustand State Stores (Features)            │
  └───────────────────────────┬────────────────────────────┘
                              ▼
  ┌────────────────────────────────────────────────────────┐
  │                  Service Interfaces                    │
  └───────────────────────────┬────────────────────────────┘
                              ▼
  ┌────────────────────────────────────────────────────────┐
  │                 API Client Contracts                   │
  └────────────────────────────────────────────────────────┘
```

1. **Interface Segregation**: State stores and hooks interact only with Service Interfaces (`src/services/`). They must never instantiate or directly depend on concrete service implementations or API clients.
2. **Branded Type Safety**: Inputs like keys, wallets, values, and symbols use branded TypeScript wrapper types (`WalletAddress`, `PublicKey`, `TokenSymbol`, etc.) to prevent parameter swap errors at compile time.

---

## 3. Data Flow Patterns

* **Queries (Read Operations)**:
  1. The UI Screen invokes a custom hook (e.g., `usePortfolio(address)`).
  2. The custom hook registers an effect calling a store action (`fetchPortfolio(address)`).
  3. The store sets `loadingState = 'loading'` and delegates network requests to the bound service implementation (e.g., `IPortfolioService`).
  4. The service fetches from the abstract API clients (`ISupabaseClient`), returns an `ApiResponse<T>`, and updates the state slices.
  5. The UI automatically triggers a re-render.

* **Commands (Write Actions / Swaps)**:
  1. The user taps the "Buy" action, invoking `executeSwap(quote)` inside `useTrade()`.
  2. The hook delegates to the Zustand `useTradeStore.executeSwap()`.
  3. The store calls `ITradingService.executeSwap(quote, wallet)`.
  4. The service signs transaction instructions via `IWalletService` and broadcasts them via `IAlchemyClient.sendTransaction()`.

---

## 4. Integration Blueprint for Future Backends

### A. Privy Authentication & Embedded Wallets
* **Hook / Store**: `useAuthStore` and `useWalletStore`.
* **API Client**: `PrivyClient`.
* **Flow**: When user triggers auth link, `PrivyClient.loginWithOAuth` is executed. On success, the secure session token is passed to `IWalletService` to provision/link the embedded Solana key pair using Privy's developer SDK.

### B. Jupiter DEX Swaps
* **Hook / Store**: `useTradeStore`.
* **API Client**: `JupiterClient`.
* **Flow**: The client queries `/quote` to fetch route plans. Upon selection, the client invokes `/swap` to retrieve the transaction envelope, which is signed by the local wallet and broadcasted via RPC.

### C. Birdeye Market Data
* **Hook / Store**: `useMarketStore`.
* **API Client**: `BirdeyeClient`.
* **Flow**: Periodic polling triggers `getMarketStats(symbol)` to update stats cards and historical candle lines.

### D. Alchemy Solana RPC
* **API Client**: `AlchemyClient`.
* **Flow**: Implements core JSON-RPC methods (`sendTransaction`, `getBalance`, `getSignaturesForAddress`) connecting directly to secure Alchemy RPC clusters.

### E. Supabase Storage
* **API Client**: `SupabaseClient`.
* **Flow**: Holds offline user states, metadata, historical trades, and watchlist syncing across accounts.

---

## 5. Storage and Security Policies
* Under no circumstances may private keys, seeds, or secret phrases be written to standard unencrypted storage (`LocalStorage` / `AsyncStorage`).
* Concrete implementations of `ISecureStorage` must use platform-specific keychains (e.g., iOS Keychain Services or Android Keystore) via `react-native-keychain` or equivalent audited wrappers.
