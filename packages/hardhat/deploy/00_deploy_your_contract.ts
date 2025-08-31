import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

/**
 * Deploys the ProofOfAudit contract using the deployer account.
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployProofOfAudit: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  // Deploy the ProofOfAudit contract
  const deployment = await deploy("ProofOfAudit", {
    from: deployer,
    args: [deployer], // Initial admin address
    log: true,
    autoMine: true, // Speeds up deployment on local networks
  });

  console.log(`✅ ProofOfAudit deployed at: ${deployment.address}`);
  console.log(`👤 Initial admin: ${deployer}`);
};

export default deployProofOfAudit;

// Run this deploy script with: yarn deploy --tags ProofOfAudit
deployProofOfAudit.tags = ["ProofOfAudit"];
