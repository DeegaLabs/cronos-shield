// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title ShieldedVault
 * @dev A smart contract vault that protects user funds by integrating with a Risk Oracle.
 *      It can block transactions based on a configurable risk score threshold.
 * 
 * @notice This contract is part of the Cronos Shield project (POC 2).
 *         It uses the Risk Oracle (POC 1) to analyze risk before allowing transactions.
 */
contract ShieldedVault is Ownable, Pausable {
    // --- State Variables ---
    address public immutable riskOracleAddress; // Address of the Risk Oracle (POC 1)
    uint256 public maxRiskScore;                // Maximum allowed risk score for transactions (0-100)
    string public riskOracleUrl;                // URL do backend para consulta de risco (off-chain)

    // Mapping from user address to their deposited balance
    mapping(address => uint256) public balances;

    // --- Events ---
    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event TransactionBlocked(
        address indexed user, 
        address indexed target, 
        uint256 riskScore, 
        string reason
    );
    event TransactionAllowed(
        address indexed user, 
        address indexed target, 
        uint256 riskScore
    );
    event EmergencyWithdrawn(address indexed user, uint256 amount);
    event MaxRiskScoreUpdated(uint256 oldScore, uint256 newScore);
    event RiskOracleUrlUpdated(string oldUrl, string newUrl);

    // --- Constructor ---
    /**
     * @dev Initializes the vault with the Risk Oracle address and a maximum allowed risk score.
     * @param _riskOracleAddress The address of the deployed RiskOracle contract.
     * @param _maxRiskScore The initial maximum risk score allowed for transactions (0-100).
     * @param _riskOracleUrl The URL of the backend service for risk analysis.
     */
    constructor(
        address _riskOracleAddress,
        uint256 _maxRiskScore,
        string memory _riskOracleUrl
    ) Ownable(msg.sender) {
        require(_riskOracleAddress != address(0), "ShieldedVault: Invalid Risk Oracle address");
        require(_maxRiskScore <= 100, "ShieldedVault: Max risk score must be 0-100");
        require(bytes(_riskOracleUrl).length > 0, "ShieldedVault: Risk Oracle URL cannot be empty");

        riskOracleAddress = _riskOracleAddress;
        maxRiskScore = _maxRiskScore;
        riskOracleUrl = _riskOracleUrl;
    }

    // --- Deposit/Withdraw Functions ---
    /**
     * @dev Deposits native tokens (CRO) into the vault.
     */
    function deposit() public payable whenNotPaused {
        require(msg.value > 0, "ShieldedVault: Deposit amount must be greater than zero");
        balances[msg.sender] += msg.value;
        emit Deposited(msg.sender, msg.value);
    }

    /**
     * @dev Allows users to withdraw their deposited native tokens (CRO).
     * @param amount The amount of tokens to withdraw.
     */
    function withdraw(uint256 amount) public whenNotPaused {
        require(amount > 0, "ShieldedVault: Withdraw amount must be greater than zero");
        require(balances[msg.sender] >= amount, "ShieldedVault: Insufficient balance");

        balances[msg.sender] -= amount;
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "ShieldedVault: Failed to withdraw CRO");

        emit Withdrawn(msg.sender, amount);
    }

    // --- Core Protection Logic ---
    /**
     * @dev Executes a transaction only if the risk score for the target contract is below the threshold.
     *      This function is designed to be called by an AI agent or another contract.
     *      The risk score must be provided by the caller (who queries the Risk Oracle off-chain).
     * 
     * @param target The address of the contract to interact with.
     * @param callData The calldata for the transaction to be executed.
     * @param value The amount of native tokens (CRO) to send with the transaction.
     * @param riskScore The risk score obtained from the Risk Oracle (0-100).
     * @param proof The Proof of Risk signature from the Risk Oracle (for verification).
     * @return bool True if the transaction was allowed and executed, false otherwise.
     */
    function executeWithRiskCheck(
        address target,
        bytes memory callData,
        uint256 value,
        uint256 riskScore,
        bytes memory proof
    ) public payable whenNotPaused returns (bool) {
        require(target != address(0), "ShieldedVault: Invalid target address");
        require(balances[msg.sender] >= value, "ShieldedVault: Insufficient balance for value");
        require(riskScore <= 100, "ShieldedVault: Invalid risk score (must be 0-100)");

        // Check risk score against threshold
        if (riskScore > maxRiskScore) {
            emit TransactionBlocked(
                msg.sender, 
                target, 
                riskScore, 
                "Risk score exceeds maximum allowed threshold"
            );
            return false;
        }

        // Deduct native tokens from balance if value is sent
        if (value > 0) {
            balances[msg.sender] -= value;
        }

        // Execute the transaction
        (bool success, ) = target.call{value: value}(callData);
        require(success, "ShieldedVault: Transaction execution failed");

        emit TransactionAllowed(msg.sender, target, riskScore);
        return true;
    }

    /**
     * @dev Simplified version that only checks risk score (without executing transaction).
     *      Useful for testing and validation.
     * @param riskScore The risk score to check.
     * @return bool True if the risk score is acceptable, false otherwise.
     */
    function checkRiskScore(uint256 riskScore) public view returns (bool) {
        return riskScore <= maxRiskScore;
    }

    // --- Emergency Functions ---
    /**
     * @dev Allows the owner to withdraw all native tokens (CRO) from the vault in an emergency.
     * @param user The address of the user whose funds are being withdrawn.
     */
    function emergencyWithdraw(address user) public onlyOwner {
        uint256 amount = balances[user];
        require(amount > 0, "ShieldedVault: No funds to emergency withdraw for this user");

        balances[user] = 0;
        (bool success, ) = owner().call{value: amount}("");
        require(success, "ShieldedVault: Failed to emergency withdraw CRO");

        emit EmergencyWithdrawn(user, amount);
    }

    // --- Admin Functions ---
    /**
     * @dev Allows the owner to set a new maximum allowed risk score.
     * @param _newMaxRiskScore The new maximum risk score (0-100).
     */
    function setMaxRiskScore(uint256 _newMaxRiskScore) public onlyOwner {
        require(_newMaxRiskScore <= 100, "ShieldedVault: Max risk score must be 0-100");
        emit MaxRiskScoreUpdated(maxRiskScore, _newMaxRiskScore);
        maxRiskScore = _newMaxRiskScore;
    }

    /**
     * @dev Allows the owner to update the Risk Oracle URL for risk analysis.
     * @param _newRiskOracleUrl The new URL for the Risk Oracle backend service.
     */
    function setRiskOracleUrl(string memory _newRiskOracleUrl) public onlyOwner {
        require(bytes(_newRiskOracleUrl).length > 0, "ShieldedVault: Risk Oracle URL cannot be empty");
        emit RiskOracleUrlUpdated(riskOracleUrl, _newRiskOracleUrl);
        riskOracleUrl = _newRiskOracleUrl;
    }

    /**
     * @dev Pauses all operations in the vault. Only owner can pause.
     */
    function pause() public onlyOwner {
        _pause();
    }

    /**
     * @dev Unpauses all operations in the vault. Only owner can unpause.
     */
    function unpause() public onlyOwner {
        _unpause();
    }

    /**
     * @dev Receive function to accept native token deposits
     */
    receive() external payable {
        deposit();
    }
}
