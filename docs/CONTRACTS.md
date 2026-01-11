# Smart Contracts

Documentation for Cronos Shield smart contracts.

## Overview

Cronos Shield uses Solidity smart contracts deployed on Cronos EVM for on-chain verification and protected vault functionality.

## Contracts

### RiskOracle.sol

Stores and verifies risk analysis results on-chain.

**Network:** Cronos Testnet / Mainnet  
**License:** MIT

#### Functions

##### `storeResult(address contractAddress, uint256 score, bytes32 proofHash, uint256 timestamp)`

Store a risk analysis result.

**Parameters:**
- `contractAddress`: The contract that was analyzed
- `score`: Risk score (0-100)
- `proofHash`: Hash of the Proof of Risk signature
- `timestamp`: Unix timestamp of the analysis

**Access:** Only authorized oracles

**Events:**
- `RiskResultStored(bytes32 indexed contractHash, address indexed contractAddress, uint256 score, bytes32 proofHash, uint256 timestamp)`

##### `getResult(address contractAddress, uint256 timestamp)`

Retrieve a stored risk result.

**Returns:**
- `score`: Risk score
- `proofHash`: Proof hash
- `resultTimestamp`: Analysis timestamp
- `oracleAddress`: Oracle that signed
- `exists`: Whether result exists

##### `verifyProof(address contractAddress, uint256 timestamp, bytes32 proofHash)`

Verify if a proof hash matches a stored result.

**Returns:** `bool` - Whether proof is valid

##### `authorizeOracle(address oracle)`

Authorize a new oracle address.

**Access:** Only owner

##### `revokeOracle(address oracle)`

Revoke oracle authorization.

**Access:** Only owner

#### Deployment

```bash
cd contracts
pnpm deploy
```

After deployment, authorize the backend's signing address:

```bash
pnpm authorize-oracle --oracle 0xYourBackendAddress
```

### ShieldedVault.sol

Protected vault with risk-based transaction blocking.

**Network:** Cronos Testnet / Mainnet  
**License:** MIT

#### Functions

##### `deposit()`

Deposit native tokens (CRO) into the vault.

**Payable:** Yes

**Events:**
- `Deposited(address indexed user, uint256 amount)`

##### `withdraw(uint256 amount)`

Withdraw deposited native tokens.

**Parameters:**
- `amount`: Amount to withdraw

**Events:**
- `Withdrawn(address indexed user, uint256 amount)`

##### `executeWithRiskCheck(address target, bytes calldata callData, uint256 value, uint256 riskScore, bytes calldata proof)`

Execute a transaction with risk validation.

**Parameters:**
- `target`: Target contract address
- `callData`: Transaction calldata
- `value`: Native token value
- `riskScore`: Risk score from backend
- `proof`: Proof of Risk signature

**Returns:** `bool` - Whether transaction was allowed

**Events:**
- `TransactionBlocked(address indexed user, address indexed target, uint256 riskScore, string reason)`
- `TransactionAllowed(address indexed user, address indexed target, uint256 riskScore)`

##### `setMaxRiskScore(uint256 newMaxRiskScore)`

Update maximum allowed risk score.

**Access:** Only owner

**Parameters:**
- `newMaxRiskScore`: New maximum risk score (0-100)

##### `pause()`

Pause all vault operations.

**Access:** Only owner

##### `unpause()`

Resume vault operations.

**Access:** Only owner

##### `emergencyWithdraw(address user)`

Emergency withdrawal for a user.

**Access:** Only owner

#### Deployment

```bash
cd contracts
pnpm deploy --vault
```

**Constructor Parameters:**
- `_riskOracleAddress`: Address of deployed RiskOracle contract
- `_maxRiskScore`: Initial maximum risk score (e.g., 70)
- `_backendUrl`: Backend URL for risk analysis

## Testing

Run contract tests:

```bash
cd contracts
pnpm test
```

## Verification

Verify contracts on Cronoscan:

```bash
pnpm verify --contract RiskOracle --address 0x...
```

## Security Considerations

1. **Access Control**: Only authorized oracles can store results
2. **Ownership**: Critical functions restricted to owner
3. **Pausability**: Emergency stop mechanism via pause/unpause
4. **Input Validation**: All inputs validated before processing

## Gas Optimization

- Use `uint256` for scores (efficient storage)
- Pack structs where possible
- Use events for off-chain indexing
- Minimize storage operations

## Upgradeability

Current contracts are not upgradeable. For production, consider:
- Proxy pattern (OpenZeppelin)
- Upgradeable contracts
- Governance for parameter changes
