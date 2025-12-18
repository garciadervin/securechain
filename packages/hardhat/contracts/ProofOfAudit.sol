// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import { ERC721 } from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import { AccessControl } from "@openzeppelin/contracts/access/AccessControl.sol";
import { EIP712 } from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import { ECDSA } from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import { Strings } from "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title ProofOfAudit
 * @dev ERC721 token representing a proof of smart contract audit.
 *      Supports direct minting and EIP-712 signed minting by authorized auditors.
 *      Stores audit metadata on-chain and links to an IPFS report.
 */
contract ProofOfAudit is ERC721, AccessControl, EIP712 {
    using Strings for uint256;

    // --- Roles ---
    bytes32 public constant AUDITOR_ROLE = keccak256("AUDITOR_ROLE");

    // --- State ---
    uint256 private _nextId = 1;

    struct AuditData {
        address auditedContract;
        uint256 chainId;
        uint8 score; // 1..100
        string cid; // IPFS CID for the audit report
        address auditor;
        uint64 timestamp;
        bool revoked;
    }

    mapping(uint256 => AuditData) public auditOfToken;
    mapping(address => uint256[]) private _auditsByContract;

    // --- EIP-712 ---
    bytes32 private constant MINT_TYPEHASH =
        keccak256(
            "MintAudit(address to,address auditedContract,uint256 chainId,uint8 score,string cid,uint256 nonce,uint256 deadline)"
        );
    mapping(address => uint256) public nonces;

    // --- Events ---
    event AuditMinted(
        uint256 indexed tokenId,
        address indexed to,
        address indexed auditedContract,
        uint256 chainId,
        uint8 score,
        string cid,
        address auditor
    );

    event AuditRevoked(uint256 indexed tokenId, address indexed by);

    // --- Constructor ---
    constructor(address admin) ERC721("Proof of Audit", "PoA") EIP712("ProofOfAudit", "1") {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

    // --- Minting ---

    /**
     * @notice Direct minting of an audit NFT.
     * @dev Open minting allowed for demonstration purposes in Aleph Hackathon.
     *      For production use, consider adding onlyRole(AUDITOR_ROLE) modifier.
     * @param to Address to receive the audit NFT
     * @param auditedContract Address of the contract being audited
     * @param chainId_ Chain ID where the audited contract is deployed
     * @param score Audit score (1-100)
     * @param cid IPFS CID of the audit report
     * @return tokenId The ID of the minted audit NFT
     */
    function mintAudit(
        address to,
        address auditedContract,
        uint256 chainId_,
        uint8 score,
        string calldata cid
    ) external returns (uint256 tokenId) {
        _validateScore(score);
        tokenId = _mintAndStore(to, auditedContract, chainId_, score, cid, msg.sender);
    }

    /**
     * @notice Minting with EIP-712 signature from an authorized auditor.
     * @param deadline Expiration timestamp for the signature.
     */
    function mintAuditWithSig(
        address to,
        address auditedContract,
        uint256 chainId_,
        uint8 score,
        string calldata cid,
        uint256 deadline,
        bytes calldata signature
    ) external returns (uint256 tokenId) {
        _validateScore(score);
        require(block.timestamp <= deadline, "Signature expired");

        uint256 nonce = nonces[to]++;
        bytes32 structHash = keccak256(
            abi.encode(MINT_TYPEHASH, to, auditedContract, chainId_, score, keccak256(bytes(cid)), nonce, deadline)
        );
        bytes32 digest = _hashTypedDataV4(structHash);
        address signer = ECDSA.recover(digest, signature);
        require(hasRole(AUDITOR_ROLE, signer), "Unauthorized signature");

        tokenId = _mintAndStore(to, auditedContract, chainId_, score, cid, signer);
    }

    // --- Revocation ---

    /**
     * @notice Revoke an existing audit.
     * @dev Only the original auditor or an admin can revoke.
     */
    function revoke(uint256 tokenId) external {
        AuditData storage data = auditOfToken[tokenId];
        require(_ownerOf(tokenId) != address(0), "Nonexistent token");
        require(msg.sender == data.auditor || hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Not authorized");
        require(!data.revoked, "Already revoked");
        data.revoked = true;
        emit AuditRevoked(tokenId, msg.sender);
    }

    // --- Views ---

    function getAuditsByContract(address target) external view returns (uint256[] memory) {
        return _auditsByContract[target];
    }

    function latestAuditOf(address target) external view returns (uint256 tokenId) {
        uint256 len = _auditsByContract[target].length;
        require(len > 0, "No audits found");
        return _auditsByContract[target][len - 1];
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "Nonexistent token");
        return string(abi.encodePacked("ipfs://", auditOfToken[tokenId].cid));
    }

    /**
     * @notice Returns a summary of the audit data for a given token.
     */
    function auditSummary(
        uint256 tokenId
    )
        external
        view
        returns (
            address owner,
            address auditedContract,
            uint256 chainId_,
            uint8 score,
            string memory cid,
            address auditor_,
            uint64 timestamp,
            bool revoked
        )
    {
        require(_ownerOf(tokenId) != address(0), "Nonexistent token");
        owner = ownerOf(tokenId);
        AuditData memory d = auditOfToken[tokenId];
        auditedContract = d.auditedContract;
        chainId_ = d.chainId;
        score = d.score;
        cid = d.cid;
        auditor_ = d.auditor;
        timestamp = d.timestamp;
        revoked = d.revoked;
    }

    // --- Internal ---

    function _mintAndStore(
        address to,
        address auditedContract,
        uint256 chainId_,
        uint8 score,
        string calldata cid,
        address auditor_
    ) internal returns (uint256 tokenId) {
        require(auditedContract != address(0), "Invalid contract");
        tokenId = _nextId++;
        _safeMint(to, tokenId);

        auditOfToken[tokenId] = AuditData({
            auditedContract: auditedContract,
            chainId: chainId_,
            score: score,
            cid: cid,
            auditor: auditor_,
            timestamp: uint64(block.timestamp),
            revoked: false
        });

        _auditsByContract[auditedContract].push(tokenId);

        emit AuditMinted(tokenId, to, auditedContract, chainId_, score, cid, auditor_);
    }

    function _validateScore(uint8 score) internal pure {
        require(score >= 1 && score <= 100, "Score out of range");
    }

    // --- Overrides ---

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
