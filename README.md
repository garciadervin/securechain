```markdown
# 🔐 SecureChain

**SecureChain** is a decentralized platform for auditing and certifying smart contracts on blockchain. It enables auditors to issue verifiable NFT certificates linked to IPFS reports, providing transparency, traceability, and trust for smart contract security.

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

The core contract is [`ProofOfAudit.sol`](./contracts/ProofOfAudit.sol), which includes:

- `mintAudit`: Direct minting by auditors
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
- Revert conditions for unauthorized actions

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

## 📚 Documentation

- [Smart Contract Audit Flow](./docs/audit-flow.md)
- [API Reference](./docs/api.md)
- [Architecture Overview](./docs/architecture.md)

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

```
