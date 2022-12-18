const { ethers } = require("hardhat");

async function main() {
  console.log('Preparing deploy. . .')
  // We get the contract to deploy
  const [deployer, feeAccount] = await ethers.getSigners()
  const Token = await ethers.getContractFactory('Token')
  const Exchange = await ethers.getContractFactory('Exchange')

  const quyToken = await Token.deploy('Quy Token', 'QUY', 1000000)
  const sbhToken = await Token.deploy('SBH Token', 'SBH', 1000000)
  const wibuToken = await Token.deploy('Wibu Token', 'WIBU', 1000000)
  const exchange = await Exchange.deploy(feeAccount.address, 10)

  console.log(`Deployer: ${deployer.address}`)
  console.log(`Fee Account: ${feeAccount.address}`)
  console.log(`QUY Token deployed to ${quyToken.address}`)
  console.log(`SBH Token deployed to ${sbhToken.address}`)
  console.log(`WIBU Token deployed to ${wibuToken.address}`)
  console.log(`Exchange contract deployed to ${exchange.address}`)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
