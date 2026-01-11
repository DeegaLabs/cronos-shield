# Architecture

Technical architecture and design decisions for Cronos Shield.

## System Overview

Cronos Shield is built as a modular, microservices-inspired architecture consolidated into a single backend for hackathon submission.

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐│
│  │Dashboard │  │Risk Oracle│  │  Vaults  │  │Divergence││
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘│
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP/REST
┌──────────────────────▼──────────────────────────────────┐
│              Unified Backend (Express.js)                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Risk Service │  │Divergence Svc│  │Observability │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                  │                  │          │
│  ┌──────▼──────────────────▼──────────────────▼──────┐  │
│  │         x402 Payment Middleware                    │  │
│  │         Facilitator Service                        │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
┌───────▼──────┐ ┌────▼────┐ ┌──────▼──────┐
│  Cronos EVM  │ │Crypto.com│ │  VVS Finance │
│  (Smart       │ │ Exchange │ │    (DEX)     │
│   Contracts)  │ │   (CEX)  │ │              │
└───────────────┘ └──────────┘ └──────────────┘
```

## Components

### Frontend

**Technology:** React 19, TypeScript, Vite, Tailwind CSS

**Key Features:**
- React Router for navigation
- React Query for data fetching
- MetaMask integration for wallet connection
- Real-time updates via polling

**Structure:**
```
frontend/src/
├── components/     # Reusable UI components
├── pages/          # Page-level components
├── lib/            # Utilities (API client, wallet)
├── hooks/          # Custom React hooks
└── types/          # TypeScript definitions
```

### Backend

**Technology:** Node.js, TypeScript, Express.js

**Architecture Pattern:** MVC (Model-View-Controller)

**Key Components:**

1. **Controllers** - Handle HTTP requests/responses
2. **Services** - Business logic
3. **Routes** - API endpoint definitions
4. **Middleware** - x402 payment enforcement
5. **Utils** - Shared utilities (logging, etc.)

**Service Layer:**
- **Risk Service**: Analyzes contract risk, generates Proof of Risk
- **Divergence Service**: Compares CEX/DEX prices, calculates divergence
- **Observability Services**: Logging and metrics aggregation

### Smart Contracts

**Technology:** Solidity 0.8.20, Hardhat

**Contracts:**

1. **RiskOracle.sol**
   - Stores risk analysis results
   - Verifies Proof of Risk signatures
   - Manages authorized oracles

2. **ShieldedVault.sol**
   - Protected token vault
   - Risk-based transaction blocking
   - Emergency withdrawal functions

## Data Flow

### Risk Analysis Flow

```
1. Client → GET /api/risk/risk-analysis?contract=0x...
2. Backend → Returns 402 Payment Required
3. Client → Generates payment via Facilitator SDK
4. Client → POST /api/risk/pay (settle payment)
5. Backend → Verifies payment, records entitlement
6. Backend → Risk Service analyzes contract
7. Backend → Generates Proof of Risk
8. Backend → (Optional) Stores on-chain via RiskOracle contract
9. Backend → Logs event to Observability
10. Backend → Returns analysis result
```

### Observability Flow

```
1. Service → logEvent() called
2. Logger Utility → LogService.addLog()
3. LogService → Stores in-memory (POC) or database
4. LogService → Generates human-readable translation
5. LogService → Updates metrics
6. Frontend → Polls /api/observability/logs
7. Frontend → Displays in Dashboard
```

## Payment Flow (x402)

```
1. Request → Protected endpoint
2. Middleware → Checks for x-payment-id header
3. If missing → Returns 402 with payment challenge
4. Client → Uses Facilitator SDK to generate payment
5. Client → Sends payment to Facilitator contract
6. Client → POST /api/*/pay with payment proof
7. Backend → Verifies payment via Facilitator SDK
8. Backend → Records payment ID
9. Client → Subsequent requests include x-payment-id
10. Middleware → Validates payment ID, allows access
```

## Storage

### Current (POC)

- **In-Memory**: Logs and metrics stored in memory
- **On-Chain**: Risk results stored in RiskOracle contract

### Production Recommendations

- **Database**: PostgreSQL or MongoDB for logs/metrics
- **Cache**: Redis for payment entitlements
- **Blockchain**: Continue using smart contracts for critical data

## Security Considerations

1. **Private Keys**: Never commit private keys, use environment variables
2. **Payment Verification**: All payments verified via Facilitator SDK
3. **Proof of Risk**: Cryptographic signatures prevent tampering
4. **Rate Limiting**: Handled by x402 payment requirements
5. **CORS**: Configured for frontend origin only

## Scalability

### Current Limitations

- In-memory storage (not persistent)
- Single backend instance
- No load balancing

### Production Recommendations

- Database for persistent storage
- Horizontal scaling with load balancer
- Redis for distributed caching
- Message queue for async processing

## Monitoring

- **Metrics**: Aggregated in Observability service
- **Logs**: Human-readable translations for debugging
- **Health Check**: `/health` endpoint for monitoring

## Future Enhancements

1. **ML Models**: Replace mock analysis with real ML
2. **Database**: Persistent storage for logs/metrics
3. **WebSockets**: Real-time updates instead of polling
4. **Multi-chain**: Support for other EVM chains
5. **SDK**: Developer SDK for easy integration
