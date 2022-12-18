const { ethers } = require("hardhat");
const config = require('../src/config.json')

function tokens(n) {
    return ethers.utils.parseUnits(n.toString(), 'ether')
}

const wait = (seconds) => {
    const milliseconds = seconds * 1000
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}

async function main() {
    const { chainId } = await ethers.provider.getNetwork()
    console.log(`Using network ID: ${chainId}`)
    const exchange = await ethers.getContractAt('Exchange', config[chainId].Exchange.address)
    const quyToken = await ethers.getContractAt('Token', config[chainId].QUY.address)
    const sbhToken = await ethers.getContractAt('Token', config[chainId].SBH.address)
    const wibuToken = await ethers.getContractAt('Token', config[chainId].WIBU.address)

    const [deployer, feeAccount, user1, user2] = await ethers.getSigners()
    const amount = tokens(10000)
    // Transfer 10000 QUY token to user1
    let transaction = await quyToken.transfer(user1.address, amount)
    await transaction.wait()
    console.log(`[Transfered] 10000 QUY token to user1`)
    // Transfer 10000 QUY token to user2
    transaction = await quyToken.transfer(user2.address, amount)
    await transaction.wait()
    console.log(`[Transfered] 10000 QUY token to user2`)
    // Transfer 10000 SBH token to user1
    transaction = await sbhToken.transfer(user1.address, amount)
    await transaction.wait()
    console.log(`[Transfered] 10000 SBH token to user1`)
    // Transfer 10000 WIBU token to user2
    transaction = await wibuToken.transfer(user2.address, amount)
    await transaction.wait()
    console.log(`[Transfered] 10000 WIBU token to user2`)
    // user1 deposit 10000 QUY token
    transaction = await quyToken.connect(user1).approve(exchange.address, amount)
    await transaction.wait()
    console.log(`[Approved] 10000 QUY token to exchange from user1`)
    transaction = await exchange.connect(user1).depositToken(quyToken.address, amount)
    await transaction.wait()
    console.log(`[Deposited] 10000 QUY token to exchange from user1`)
    // user2 deposit 10000 WIBU token
    transaction = await wibuToken.connect(user2).approve(exchange.address, amount)
    await transaction.wait()
    console.log(`[Approved] 10000 WIBU token to exchange from user2`)
    transaction = await exchange.connect(user2).depositToken(wibuToken.address, amount)
    await transaction.wait()
    console.log(`[Deposited] 10000 WIBU token to exchange from user2`)

    //////////////////////////////////////////////////////////////////////////////////
    // SEED A CANCELLED ORDER

    // user1 make order to get token
    transaction = await exchange.connect(user1).makeOrder(wibuToken.address, tokens(100), quyToken.address, tokens(10))
    let result = await transaction.wait()
    let count = result.events[0].args.id
    console.log(`[Ordered][${count}] 100 WIBU token for 10 QUY token from user1`)
    // user1 cancel order
    transaction = await exchange.connect(user1).cancelOrder(count)
    await transaction.wait()
    console.log(`[CANCELLED][${count}] order with id ${count} from user1`)
    // wait 1s
    await wait(1)

    //////////////////////////////////////////////////////////////////////////////////
    // SEED FILLED ORDER

    // user1 make order to get token
    transaction = await exchange.connect(user1).makeOrder(wibuToken.address, tokens(100), quyToken.address, tokens(10))
    result = await transaction.wait()
    count = result.events[0].args.id
    console.log(`[Ordered][${count}] 100 WIBU token for 10 QUY token from user1`)
    // user2 fill user1 order
    transaction = await exchange.connect(user2).fillOrder(count)
    await transaction.wait()
    console.log(`[FILLED][${count}] user2 filled order from user1`)
    // wait 1s
    await wait(1)

    // user1 make another order to get token
    transaction = await exchange.connect(user1).makeOrder(wibuToken.address, tokens(50), quyToken.address, tokens(2))
    result = await transaction.wait()
    count = result.events[0].args.id
    console.log(`[Ordered][${count}] 50 WIBU token for 2 QUY token from user1`)
    // user2 fill user1 order
    transaction = await exchange.connect(user2).fillOrder(count)
    await transaction.wait()
    console.log(`[FILLED][${count}] user2 filled order from user1`)
    // wait 1s
    await wait(1)

    // user1 make final order to get token
    transaction = await exchange.connect(user1).makeOrder(wibuToken.address, tokens(200), quyToken.address, tokens(25))
    result = await transaction.wait()
    count = result.events[0].args.id
    console.log(`[Ordered][${count}] 200 WIBU token for 25 QUY token from user1`)
    // user2 fill user1 order
    transaction = await exchange.connect(user2).fillOrder(count)
    await transaction.wait()
    console.log(`[FILLED][${count}] user2 filled order from user1`)
    // wait 1s
    await wait(1)

    //////////////////////////////////////////////////////////////////////////////////
    // SEED OPEN ORDERS

    // user1 make 10 orders
    for(let i=1;i<11;i++) {
        transaction = await exchange.connect(user1).makeOrder(wibuToken.address, tokens(10 * i), quyToken.address, tokens(10))
        result = await transaction.wait()
        count = result.events[0].args.id
        console.log(`[Ordered][${count}] ${10*i} WIBU token for 10 QUY token from user1`)
        await wait(1)
    }
    // user2 make 10 orders
    for(let i=1;i<11;i++) {
        transaction = await exchange.connect(user2).makeOrder(quyToken.address, tokens(10), wibuToken.address, tokens(10*i))
        result = await transaction.wait()
        count = result.events[0].args.id
        console.log(`[Ordered][${count}] 10 QUY token for ${10*i} WIBU token from user2`)
        await wait(1)
    }


}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
