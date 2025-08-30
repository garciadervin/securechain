// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title AuditorAICertification
 * @dev Contrato NFT para certificaciones de auditoría de seguridad de contratos inteligentes
 * @notice Permite a los usuarios acuñar NFTs que certifican los resultados de una auditoría
 */
contract AuditorAICertification is ERC721, ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    
    Counters.Counter private _tokenIdCounter;
    
    // Estructura para almacenar los datos de certificación
    struct AuditCertification {
        address contractAudited;    // Dirección del contrato auditado
        uint256 auditScore;         // Puntuación de seguridad (1-100)
        uint256 auditTimestamp;     // Fecha de la auditoría
        string ipfsHash;            // Hash IPFS del reporte completo
        bool isRevoked;             // Indica si la certificación fue revocada
    }
    
    // Mapeo de tokenId a datos de certificación
    mapping(uint256 => AuditCertification) public auditCertifications;
    
    // Mapeo de dirección de contrato auditado a tokenId (para evitar duplicados)
    mapping(address => uint256) public contractToTokenId;
    
    // Eventos
    event CertificationMinted(
        uint256 indexed tokenId,
        address indexed to,
        address contractAudited,
        uint256 auditScore,
        string ipfsHash
    );
    
    event CertificationRevoked(
        uint256 indexed tokenId,
        address revokedBy,
        string reason
    );
    
    /**
     * @dev Constructor del contrato NFT
     * @param name Nombre del NFT
     * @param symbol Símbolo del NFT
     */
    constructor(string memory name, string memory symbol) ERC721(name, symbol) {}
    
    /**
     * @dev Función para acuñar un nuevo NFT de certificación
     * @param to Dirección que recibirá el NFT
     * @param contractAudited Dirección del contrato auditado
     * @param auditScore Puntuación de seguridad (1-100)
     * @param ipfsHash Hash IPFS del reporte completo
     * @param tokenURI URI del token (metadatos)
     */
    function mintCertification(
        address to,
        address contractAudited,
        uint256 auditScore,
        string memory ipfsHash,
        string memory tokenURI
    ) external onlyOwner returns (uint256) {
        require(contractAudited != address(0), "Direccion de contrato invalida");
        require(auditScore >= 1 && auditScore <= 100, "Puntuacion debe estar entre 1-100");
        require(bytes(ipfsHash).length > 0, "Hash IPFS requerido");
        require(contractToTokenId[contractAudited] == 0, "Contrato ya certificado");
        
        // Incrementar contador de tokens
        _tokenIdCounter.increment();
        uint256 tokenId = _tokenIdCounter.current();
        
        // Acuñar el NFT
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);
        
        // Almacenar datos de certificación
        auditCertifications[tokenId] = AuditCertification({
            contractAudited: contractAudited,
            auditScore: auditScore,
            auditTimestamp: block.timestamp,
            ipfsHash: ipfsHash,
            isRevoked: false
        });
        
        // Registrar mapeo de contrato a tokenId
        contractToTokenId[contractAudited] = tokenId;
        
        // Emitir evento
        emit CertificationMinted(tokenId, to, contractAudited, auditScore, ipfsHash);
        
        return tokenId;
    }
    
    /**
     * @dev Función para revocar una certificación (solo owner)
     * @param tokenId ID del token a revocar
     * @param reason Razón de la revocación
     */
    function revokeCertification(uint256 tokenId, string memory reason) external onlyOwner {
        require(_exists(tokenId), "Token no existe");
        require(!auditCertifications[tokenId].isRevoked, "Certificacion ya revocada");
        
        auditCertifications[tokenId].isRevoked = true;
        
        // Emitir evento
        emit CertificationRevoked(tokenId, msg.sender, reason);
    }
    
    /**
     * @dev Función para verificar si un contrato está certificado
     * @param contractAddress Dirección del contrato a verificar
     * @return bool True si el contrato está certificado y no revocado
     */
    function isContractCertified(address contractAddress) external view returns (bool) {
        uint256 tokenId = contractToTokenId[contractAddress];
        if (tokenId == 0) return false;
        
        AuditCertification memory cert = auditCertifications[tokenId];
        return !cert.isRevoked;
    }
    
    /**
     * @dev Función para obtener información de certificación de un contrato
     * @param contractAddress Dirección del contrato
     * @return certification Datos de certificación
     */
    function getCertificationInfo(address contractAddress) 
        external 
        view 
        returns (AuditCertification memory certification) 
    {
        uint256 tokenId = contractToTokenId[contractAddress];
        require(tokenId != 0, "Contrato no certificado");
        
        return auditCertifications[tokenId];
    }
    
    /**
     * @dev Función para obtener información de certificación por tokenId
     * @param tokenId ID del token
     * @return certification Datos de certificación
     */
    function getCertificationInfoById(uint256 tokenId) 
        external 
        view 
        returns (AuditCertification memory certification) 
    {
        require(_exists(tokenId), "Token no existe");
        return auditCertifications[tokenId];
    }
    
    /**
     * @dev Sobrescribe la función _burn para incluir lógica de ERC721URIStorage
     */
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }
    
    /**
     * @dev Devuelve el URI del token
     */
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
    
    /**
     * @dev Devuelve el total de certificaciones emitidas
     */
    function totalCertifications() external view returns (uint256) {
        return _tokenIdCounter.current();
    }
}