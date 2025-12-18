# 🔐 SecureChain

**SecureChain** is a decentralized platform for auditing and certifying smart contracts on blockchain. It enables auditors to issue verifiable NFT certificates linked to IPFS reports, providing transparency, traceability, and trust for smart contract security.

> **Note**: This is a demonstration project for the Aleph Hackathon. The smart contract allows open minting for testing and demonstration purposes.

---

## 🚀 Features

- ✅ **Audit Certification as NFTs**  
  Audits are minted as ERC-721 tokens with metadata including score, contract address, chain ID, and IPFS CID.

- 🔏 **EIP-712 Signature Support**  
  Auditors can authorize off-chain minting via cryptographic signatures.

- 📦 **IPFS Integration**  
  Audit reports are stored and referenced via IPFS CIDs.

- 🧠 **Semantic Analysis & AI Chatbot**  
  Integrated AI tools for contract analysis and interactive audit Q&A.

- 🛠️ **Sourcify & Bytecode Fetching**  
  Automatically retrieves verified source code or bytecode from deployed contracts.

---

## 📄 Smart Contract

The core contract is `ProofOfAudit.sol`, which includes:

- `mintAudit`: Direct minting (open for demo purposes)
- `mintAuditWithSig`: Signature-based minting
- `revoke`: Allows revocation of audits
- `auditSummary`: Returns full audit metadata
- `tokenURI`: IPFS-based metadata resolution

---

## 🧪 Testing

Unit tests are written using Hardhat and Chai:

```bash
yarn test
```

Example test coverage includes:

- Role-based access control
- Audit minting and event emission
- Score validation
- Audit revocation

---

## 📦 Deployment

Deployment is handled via `hardhat-deploy`. To deploy the contract:

```bash
yarn deploy --tags ProofOfAudit
```

Initial admin is set via constructor. Auditor roles can be granted post-deployment.

---

## 🖥️ Frontend

The frontend is built with **Next.js**, **Tailwind CSS**, and **RainbowKit**. Key components include:

- `ResumenTab`: Displays audit metadata and QR/NFT generation
- `AnalisisTab`: Runs semantic analysis via AI
- `ChatbotTab`: Interactive audit assistant
- `ResultsPage`: Unified dashboard for audit results

---

## 🚀 Getting Started

### Prerequisites

- Node.js >= 20.18.3
- Yarn 3.2.3

### Installation

```bash
# Install dependencies
yarn install

# Start local blockchain
yarn chain

# Deploy contracts (in another terminal)
yarn deploy

# Start frontend
yarn start
```

---

## 🤝 Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

```bash
yarn lint
yarn format
```

---

## 📜 License

This project is licensed under the MIT License.

---

## 🧑‍💻 Author

Developed with 💚 by [Dervin García](https://t.me/garciadervin)  
Source code: [GitHub Repository](https://github.com/garciadervin/securechain)
