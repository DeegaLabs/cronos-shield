# Cronos Shield AI/ML Component

## Overview

This directory contains the AI/ML components for Cronos Shield. The AI system provides intelligent risk analysis, anomaly detection, and decision-making capabilities for the Shield platform.

## Current Status

**Phase: Pre-trained Models**

Currently, the system uses pre-trained models for risk analysis and decision-making. No database is required at this stage as the models operate on real-time on-chain data.

## Architecture

### Current Implementation

- **Pre-trained Models**: Risk analysis models that operate on real-time blockchain data
- **On-chain Data**: Models use data directly from smart contracts and blockchain state
- **No Database Required**: Models perform inference without requiring historical data storage

### Future Implementation (Training/Retraining)

When implementing model training and retraining capabilities, the following will be needed:

#### Database Requirements

- **PostgreSQL**: Recommended for structured training data
  - Historical risk analysis results (features + labels)
  - Transaction outcomes (blocked/allowed)
  - Model performance metrics
  - Training datasets

- **Alternative Options**:
  - **MongoDB**: If training data is unstructured or document-based
  - **Time-series DB** (InfluxDB/TimescaleDB): For temporal pattern analysis
  - **Data Lake** (S3 + Athena): For large-scale datasets

#### Training Pipeline

1. **Data Collection**: Gather historical on-chain data and analysis results
2. **Feature Engineering**: Extract relevant features from blockchain state
3. **Model Training**: Train models on historical data
4. **Model Evaluation**: Validate model performance
5. **Model Deployment**: Deploy updated models to production

## Decision: Database for AI/ML

**Current Decision**: **No database required**

- Start with pre-trained models
- Use real-time on-chain data for inference
- Implement database when training/retraining is needed

**Future Decision**: **PostgreSQL** (when training is implemented)

- Use the same PostgreSQL instance as Observability
- Store training datasets and model performance metrics
- Enable model retraining and continuous improvement

## Integration Points

### Risk Oracle

The AI/ML component integrates with the Risk Oracle to provide:
- Contract risk scoring
- Anomaly detection
- Pattern recognition

### Shielded Vaults

AI models help determine:
- Transaction risk levels
- Circuit breaker triggers
- Optimal withdrawal strategies

### CEX-DEX Synergy

ML models assist with:
- Price divergence analysis
- Arbitrage opportunity detection
- Market anomaly identification

## Development Roadmap

### Phase 1: Pre-trained Models (Current)
- ✅ Basic risk analysis models
- ✅ Real-time inference
- ✅ On-chain data integration

### Phase 2: Training Infrastructure (Future)
- ⏳ PostgreSQL integration for training data
- ⏳ Data collection pipeline
- ⏳ Model training scripts
- ⏳ Model versioning system

### Phase 3: Continuous Learning (Future)
- ⏳ Automated retraining pipeline
- ⏳ A/B testing framework
- ⏳ Model performance monitoring
- ⏳ Feedback loop implementation

## Notes

- The AI/ML component is designed to be modular and can be developed independently
- Database requirements will be determined based on training needs
- PostgreSQL is recommended for consistency with Observability system
- Consider data privacy and compliance when storing training data
