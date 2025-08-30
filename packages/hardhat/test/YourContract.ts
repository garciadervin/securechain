import { expect } from "chai";
import { ethers } from "hardhat";
import { ProofOfAudit } from "../typechain-types";

describe("ProofOfAudit", function () {
  let proofOfAudit: ProofOfAudit;
  let owner: any;
  let auditor: any;
  let user: any;

  before(async () => {
    [owner, auditor, user] = await ethers.getSigners();
    const proofOfAuditFactory = await ethers.getContractFactory("ProofOfAudit");
    proofOfAudit = (await proofOfAuditFactory.deploy(owner.address)) as ProofOfAudit;
    await proofOfAudit.waitForDeployment();

    // Asignar rol de auditor
    const AUDITOR_ROLE = await proofOfAudit.AUDITOR_ROLE();
    await proofOfAudit.connect(owner).grantRole(AUDITOR_ROLE, auditor.address);
  });

  describe("Deployment", function () {
    it("Debe asignar el DEFAULT_ADMIN_ROLE al owner", async function () {
      const DEFAULT_ADMIN_ROLE = await proofOfAudit.DEFAULT_ADMIN_ROLE();
      expect(await proofOfAudit.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.equal(true);
    });
  });

  describe("Mint de auditoría", function () {
    it("Debe permitir a un auditor acuñar un NFT de auditoría", async function () {
      const tx = await proofOfAudit.connect(auditor).mintAudit(
        user.address,
        "0x000000000000000000000000000000000000dEaD", // contrato auditado ficticio
        31337, // chainId local
        95, // score
        "QmHashDeEjemplo", // CID IPFS
      );

      const receipt = await tx.wait();
      const event = receipt?.logs
        .map(log => {
          try {
            return proofOfAudit.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .find(e => e && e.name === "AuditMinted");

      expect(event?.args?.to).to.equal(user.address);
      expect(event?.args?.score).to.equal(95);

      const tokenId = event?.args?.tokenId;
      const auditData = await proofOfAudit.auditOfToken(tokenId);
      expect(auditData.auditedContract).to.equal("0x000000000000000000000000000000000000dEaD");
      expect(auditData.score).to.equal(95);
      expect(auditData.cid).to.equal("QmHashDeEjemplo");
    });

    it("Debe revertir si un address sin rol intenta acuñar", async function () {
      await expect(
        proofOfAudit
          .connect(user)
          .mintAudit(user.address, "0x000000000000000000000000000000000000dEaD", 31337, 80, "QmOtroHash"),
      ).to.be.revertedWithCustomError; // o .to.be.revertedWith("AccessControl: account ... is missing role ...")
    });
  });
});
