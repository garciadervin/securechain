import { expect } from "chai";
import { ethers } from "hardhat";
import { ProofOfAudit } from "../typechain-types";

/**
 * Test suite for the ProofOfAudit smart contract.
 */
describe("ProofOfAudit", function () {
  let proofOfAudit: ProofOfAudit;
  let owner: any;
  let auditor: any;
  let user: any;

  /**
   * Deploy the contract and assign roles before running tests.
   */
  before(async () => {
    [owner, auditor, user] = await ethers.getSigners();
    const proofOfAuditFactory = await ethers.getContractFactory("ProofOfAudit");
    proofOfAudit = (await proofOfAuditFactory.deploy(owner.address)) as ProofOfAudit;
    await proofOfAudit.waitForDeployment();

    // Assign AUDITOR_ROLE to the auditor account
    const AUDITOR_ROLE = await proofOfAudit.AUDITOR_ROLE();
    await proofOfAudit.connect(owner).grantRole(AUDITOR_ROLE, auditor.address);
  });

  describe("Deployment", function () {
    it("Should assign DEFAULT_ADMIN_ROLE to the owner", async function () {
      const DEFAULT_ADMIN_ROLE = await proofOfAudit.DEFAULT_ADMIN_ROLE();
      expect(await proofOfAudit.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.equal(true);
    });
  });

  describe("Audit minting", function () {
    it("Should allow an auditor to mint an audit NFT", async function () {
      const tx = await proofOfAudit.connect(auditor).mintAudit(
        user.address,
        "0x000000000000000000000000000000000000dEaD", // dummy audited contract
        31337, // local chainId
        95, // score
        "QmHashDeEjemplo", // IPFS CID
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

    it("Should revert if a non-auditor tries to mint", async function () {
      await expect(
        proofOfAudit
          .connect(user)
          .mintAudit(user.address, "0x000000000000000000000000000000000000dEaD", 31337, 80, "QmOtroHash"),
      ).to.be.revertedWith("AccessControl: account"); // or use .to.be.revertedWithCustomError if defined
    });
  });
});
