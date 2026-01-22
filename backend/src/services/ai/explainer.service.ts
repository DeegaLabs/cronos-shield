/**
 * AI Decision Explainer Service
 * 
 * Provides human-readable explanations for AI decisions
 * Uses Crypto.com AI SDK if available, otherwise falls back to rule-based explanations
 */

export interface DecisionContext {
  action: 'block' | 'allow';
  riskScore: number;
  contract: string;
  reason: string;
  details?: {
    holders?: number;
    contractAge?: number;
    verified?: boolean;
    liquidity?: string;
    complexity?: string;
    transactionCount?: number;
  };
}

export class DecisionExplainer {
  private aiClient: any = null;

  constructor() {
    // Try to initialize Crypto.com AI SDK if API key is available
    // Note: For hackathon, we'll use rule-based explanations
    // In production, this would use the actual AI SDK
    if (process.env.CRYPTO_COM_AI_API_KEY) {
      try {
        // This would initialize the actual AI client
        // For now, we'll keep it null and use rule-based
        // this.aiClient = new AIClient({
        //   apiKey: process.env.CRYPTO_COM_AI_API_KEY,
        //   network: 'cronos-testnet',
        // });
        console.log('ℹ️  AI API key found, but using rule-based explanations for hackathon');
      } catch (error) {
        console.warn('⚠️  Failed to initialize AI client, using rule-based explanations:', error);
      }
    }
  }

  /**
   * Explain a decision in human-readable terms
   */
  async explainDecision(context: DecisionContext): Promise<string> {
    // If AI client is available, use it
    if (this.aiClient) {
      try {
        return await this.explainWithAI(context);
      } catch (error) {
        console.warn('AI explanation failed, using rule-based:', error);
        return this.getRuleBasedExplanation(context);
      }
    }

    // Otherwise, use rule-based explanation
    return this.getRuleBasedExplanation(context);
  }

  /**
   * Explain using AI (placeholder for future implementation)
   */
  private async explainWithAI(context: DecisionContext): Promise<string> {
    const prompt = `
      Explain this security decision in simple, human-readable terms for a non-technical user:
      
      Action: ${context.action === 'block' ? 'Transaction Blocked' : 'Transaction Allowed'}
      Risk Score: ${context.riskScore}/100
      Contract: ${context.contract}
      Reason: ${context.reason}
      
      ${context.details ? `
      Additional Context:
      - Holders: ${context.details.holders || 'Unknown'}
      - Contract Age: ${context.details.contractAge || 'Unknown'} days
      - Verified: ${context.details.verified ? 'Yes' : 'No'}
      - Liquidity: ${context.details.liquidity || 'Unknown'}
      ` : ''}
      
      Make it clear, concise, and understandable. Keep it under 100 words.
      Focus on why the decision was made and what it means for the user.
    `;

    // This would call the actual AI SDK
    // const response = await this.aiClient.chat({
    //   messages: [{ role: 'user', content: prompt }],
    //   model: 'gpt-4',
    // });
    // return response.content;

    // For now, return rule-based
    return this.getRuleBasedExplanation(context);
  }

  /**
   * Generate rule-based explanation
   */
  private getRuleBasedExplanation(context: DecisionContext): string {
    const { action, riskScore, reason, details } = context;

    if (action === 'block') {
      const explanations: string[] = [];

      // Risk score explanation
      if (riskScore >= 90) {
        explanations.push(`This contract has a very high risk score (${riskScore}/100), indicating significant security concerns.`);
      } else if (riskScore >= 70) {
        explanations.push(`This contract has a high risk score (${riskScore}/100), which raises security concerns.`);
      } else {
        explanations.push(`This contract has a moderate risk score (${riskScore}/100).`);
      }

      // Reason explanation
      if (reason) {
        explanations.push(reason);
      }

      // Details explanation
      if (details) {
        if (details.holders !== undefined && details.holders < 10) {
          explanations.push(`The contract has very few holders (${details.holders}), which may indicate low adoption or potential risks.`);
        }

        if (details.contractAge !== undefined && details.contractAge < 30) {
          explanations.push(`The contract is relatively new (${details.contractAge} days old), which means it hasn't been battle-tested yet.`);
        }

        if (details.verified === false) {
          explanations.push('The contract source code is not verified, making it harder to audit for security issues.');
        }

        if (details.liquidity && parseFloat(details.liquidity) < 1000) {
          explanations.push('The contract has low liquidity, which may indicate limited market activity.');
        }
      }

      return `Transaction blocked. ${explanations.join(' ')} For your safety, we recommend avoiding this contract or conducting additional research.`;
    } else {
      // Allow action
      const explanations: string[] = [];

      if (riskScore < 30) {
        explanations.push(`This contract has a low risk score (${riskScore}/100), indicating good security practices.`);
      } else if (riskScore < 50) {
        explanations.push(`This contract has a moderate risk score (${riskScore}/100).`);
      } else {
        explanations.push(`This contract has been analyzed and deemed acceptable (risk score: ${riskScore}/100).`);
      }

      if (details) {
        if (details.verified === true) {
          explanations.push('The contract source code is verified, which allows for better security auditing.');
        }

        if (details.contractAge !== undefined && details.contractAge > 180) {
          explanations.push(`The contract has been active for ${details.contractAge} days, showing a track record of operation.`);
        }

        if (details.holders !== undefined && details.holders > 100) {
          explanations.push(`The contract has ${details.holders} holders, indicating good adoption.`);
        }
      }

      return `Transaction allowed. ${explanations.join(' ')} However, always exercise caution when interacting with smart contracts.`;
    }
  }
}
