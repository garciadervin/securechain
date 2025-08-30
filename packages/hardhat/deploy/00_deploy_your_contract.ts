import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

/**
 * Deploys the ProofOfAudit contract using the deployer account
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployProofOfAudit: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  // Desplegar el contrato ProofOfAudit
  const deployment = await deploy("ProofOfAudit", {
    from: deployer,
    args: [deployer], // admin inicial del contrato
    log: true,
    autoMine: true, // acelera en redes locales
  });

  console.log(`✅ ProofOfAudit desplegado en: ${deployment.address}`);
  console.log(`👤 Admin inicial: ${deployer}`);
};

export default deployProofOfAudit;

// Permite ejecutar solo este deploy con: yarn deploy --tags ProofOfAudit
deployProofOfAudit.tags = ["ProofOfAudit"];
