// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title RiskOracle
 * @dev Smart contract for storing and verifying risk analysis results
 * 
 * This contract stores risk analysis results from the Risk Oracle backend
 * and allows on-chain verification of Proof of Risk signatures.
 */
contract RiskOracle {
    /**
     * @dev Structure to store risk analysis result
     */
    struct RiskResult {
        uint256 score;          // Risk score (0-100)
        bytes32 proof;          // Proof of Risk (hash of signature)
        uint256 timestamp;      // When the analysis was performed
        address oracle;         // Address of the oracle that signed
        bool exists;            // Whether this result exists
    }

    /**
     * @dev Mapping from contract hash to risk result
     * contractHash = keccak256(contractAddress, timestamp)
     */
    mapping(bytes32 => RiskResult) public results;

    /**
     * @dev Mapping to track oracle addresses (authorized signers)
     */
    mapping(address => bool) public authorizedOracles;

    /**
     * @dev Owner of the contract
     */
    address public owner;

    /**
     * @dev Events
     */
    event RiskResultStored(
        bytes32 indexed contractHash,
        address indexed contractAddress,
        uint256 score,
        bytes32 proof,
        uint256 timestamp
    );

    event OracleAuthorized(address indexed oracle);
    event OracleRevoked(address indexed oracle);

    /**
     * @dev Modifier to restrict access to owner
     */
    modifier onlyOwner() {
        require(msg.sender == owner, "RiskOracle: caller is not owner");
        _;
    }

    /**
     * @dev Modifier to restrict access to authorized oracles
     */
    modifier onlyOracle() {
        require(authorizedOracles[msg.sender], "RiskOracle: caller is not authorized oracle");
        _;
    }

    /**
     * @dev Constructor
     * Sets the deployer as owner and first authorized oracle
     */
    constructor() {
        owner = msg.sender;
        authorizedOracles[msg.sender] = true;
        emit OracleAuthorized(msg.sender);
    }

    /**
     * @dev Store risk analysis result
     * @param contractAddress The contract address that was analyzed
     * @param score Risk score (0-100)
     * @param proofHash Hash of the Proof of Risk signature
     * @param timestamp When the analysis was performed
     */
    function storeResult(
        address contractAddress,
        uint256 score,
        bytes32 proofHash,
        uint256 timestamp
    ) external onlyOracle {
        require(score <= 100, "RiskOracle: invalid score (must be 0-100)");
        require(contractAddress != address(0), "RiskOracle: invalid contract address");
        
        // Create unique hash for this contract + timestamp combination
        bytes32 contractHash = keccak256(
            abi.encodePacked(contractAddress, timestamp)
        );

        results[contractHash] = RiskResult({
            score: score,
            proof: proofHash,
            timestamp: timestamp,
            oracle: msg.sender,
            exists: true
        });

        emit RiskResultStored(
            contractHash,
            contractAddress,
            score,
            proofHash,
            timestamp
        );
    }

    /**
     * @dev Get risk result for a contract
     * @param contractAddress The contract address to query
     * @param timestamp The timestamp of the analysis
     * @return score Risk score
     * @return proofHash Proof of Risk hash
     * @return resultTimestamp When the analysis was performed
     * @return oracleAddress Address of the oracle that signed
     * @return exists Whether the result exists
     */
    function getResult(
        address contractAddress,
        uint256 timestamp
    ) external view returns (
        uint256 score,
        bytes32 proofHash,
        uint256 resultTimestamp,
        address oracleAddress,
        bool exists
    ) {
        bytes32 contractHash = keccak256(
            abi.encodePacked(contractAddress, timestamp)
        );
        
        RiskResult memory result = results[contractHash];
        return (
            result.score,
            result.proof,
            result.timestamp,
            result.oracle,
            result.exists
        );
    }

    /**
     * @dev Verify if a proof hash matches a stored result
     * @param contractAddress The contract address
     * @param timestamp The timestamp of the analysis
     * @param proofHash The proof hash to verify
     * @return valid Whether the proof is valid
     */
    function verifyProof(
        address contractAddress,
        uint256 timestamp,
        bytes32 proofHash
    ) external view returns (bool valid) {
        bytes32 contractHash = keccak256(
            abi.encodePacked(contractAddress, timestamp)
        );
        
        RiskResult memory result = results[contractHash];
        
        if (!result.exists) {
            return false;
        }
        
        return result.proof == proofHash;
    }

    /**
     * @dev Authorize a new oracle address
     * @param oracle Address of the oracle to authorize
     */
    function authorizeOracle(address oracle) external onlyOwner {
        require(oracle != address(0), "RiskOracle: invalid oracle address");
        require(!authorizedOracles[oracle], "RiskOracle: oracle already authorized");
        
        authorizedOracles[oracle] = true;
        emit OracleAuthorized(oracle);
    }

    /**
     * @dev Revoke oracle authorization
     * @param oracle Address of the oracle to revoke
     */
    function revokeOracle(address oracle) external onlyOwner {
        require(authorizedOracles[oracle], "RiskOracle: oracle not authorized");
        
        authorizedOracles[oracle] = false;
        emit OracleRevoked(oracle);
    }

    /**
     * @dev Transfer ownership
     * @param newOwner Address of the new owner
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "RiskOracle: invalid new owner");
        owner = newOwner;
    }
}
