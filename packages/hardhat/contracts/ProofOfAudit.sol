// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

/*
  Proof-of-Audit NFT (ERC721)

  - Guarda metadatos inmutables por token:
    * auditedContract (address)
    * chainId (uint256)
    * score (uint8, 1..100)
    * cid (string, IPFS CID del JSON del reporte)
    * auditor (address)
    * timestamp (uint64)
    * revoked (bool)  -> flag de estado, los metadatos no cambian

  - tokenURI: "ipfs://{cid}"

  - Mint:
    * mintAudit(): sólo AUDITOR_ROLE
    * mintAuditWithSig(): EIP-712, el auditor firma y cualquier usuario puede acuñar pagando gas

  - Índices:
    * auditsByContract[contract] -> tokenIds[]
    * auditOfToken[tokenId] -> AuditData

  Pensado para desplegarse en Polygon, Base, u otra EVM chain usando Hardhat/Scaffold-ETH 2.
*/

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

contract ProofOfAudit is ERC721, AccessControl, EIP712 {
  using Strings for uint256;

  // --- Roles ---
  bytes32 public constant AUDITOR_ROLE = keccak256("AUDITOR_ROLE");

  // --- Contador simple de IDs ---
  uint256 private _nextId = 1;

  // --- Datos por NFT ---
  struct AuditData {
    address auditedContract;
    uint256 chainId;
    uint8 score;        // 1..100
    string cid;         // IPFS CID del JSON del reporte
    address auditor;    // quién emitió/firmó la auditoría
    uint64 timestamp;   // bloque en el que se acuñó
    bool revoked;       // estado de revocación
  }

  mapping(uint256 => AuditData) public auditOfToken;
  mapping(address => uint256[]) private _auditsByContract;

  // --- EIP-712 mint con firma del auditor ---
  // MintAudit(address to,address auditedContract,uint256 chainId,uint8 score,string cid,uint256 nonce,uint256 deadline)
  bytes32 private constant MINT_TYPEHASH = keccak256(
    "MintAudit(address to,address auditedContract,uint256 chainId,uint8 score,string cid,uint256 nonce,uint256 deadline)"
  );
  mapping(address => uint256) public nonces; // nonce por destinatario (to)

  // --- Eventos ---
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

  constructor(address admin)
    ERC721("Proof of Audit", "PoA")
    EIP712("ProofOfAudit", "1")
  {
    _grantRole(DEFAULT_ADMIN_ROLE, admin);
  }

  // --- Mint directo (rol de auditor) ---
  function mintAudit(
    address to,
    address auditedContract,
    uint256 chainId_,
    uint8 score,
    string calldata cid
  ) external onlyRole(AUDITOR_ROLE) returns (uint256 tokenId) {
    _validateScore(score);
    tokenId = _mintAndStore(to, auditedContract, chainId_, score, cid, msg.sender);
  }

  // --- Mint con firma EIP-712 del auditor ---
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
    require(block.timestamp <= deadline, "Firma expirada");

    uint256 nonce = nonces[to]++;
    bytes32 structHash = keccak256(
      abi.encode(
        MINT_TYPEHASH,
        to,
        auditedContract,
        chainId_,
        score,
        keccak256(bytes(cid)),
        nonce,
        deadline
      )
    );
    bytes32 digest = _hashTypedDataV4(structHash);
    address signer = ECDSA.recover(digest, signature);
    require(hasRole(AUDITOR_ROLE, signer), "Firma no autorizada");

    tokenId = _mintAndStore(to, auditedContract, chainId_, score, cid, signer);
  }

  // --- Revocación (opcional) ---
  // Puede revocar el auditor que emitió esa auditoría o el admin.
  function revoke(uint256 tokenId) external {
    AuditData storage data = auditOfToken[tokenId];
    require(_ownerOf(tokenId) != address(0), "Token inexistente");
    require(
      msg.sender == data.auditor || hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
      "No autorizado"
    );
    require(!data.revoked, "Ya revocado");
    data.revoked = true;
    emit AuditRevoked(tokenId, msg.sender);
  }

  // --- Getters auxiliares ---
  function getAuditsByContract(address target) external view returns (uint256[] memory) {
    return _auditsByContract[target];
  }

  function latestAuditOf(address target) external view returns (uint256 tokenId) {
    uint256 len = _auditsByContract[target].length;
    require(len > 0, "Sin auditorias");
    return _auditsByContract[target][len - 1];
  }

  function tokenURI(uint256 tokenId) public view override returns (string memory) {
    require(_ownerOf(tokenId) != address(0), "Token inexistente");
    // Devuelve el CID como URI IPFS "ipfs://{cid}"
    return string(abi.encodePacked("ipfs://", auditOfToken[tokenId].cid));
  }

  // --- Internals ---
  function _mintAndStore(
    address to,
    address auditedContract,
    uint256 chainId_,
    uint8 score,
    string calldata cid,
    address auditor_
  ) internal returns (uint256 tokenId) {
    require(auditedContract != address(0), "Contrato invalido");
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
    require(score >= 1 && score <= 100, "Score fuera de rango");
  }

  // --- Soporte de interfaces ---
  function supportsInterface(bytes4 interfaceId)
    public
    view
    override(ERC721, AccessControl)
    returns (bool)
  {
    return super.supportsInterface(interfaceId);
  }

  // --- Helpers de lectura humana (opcionales) ---
  function auditSummary(uint256 tokenId)
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
    require(_ownerOf(tokenId) != address(0), "Token inexistente");
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
}