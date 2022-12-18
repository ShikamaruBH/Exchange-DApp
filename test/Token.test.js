const { expect } = require("chai");
const { ethers } = require("hardhat");

function wei(n) {
    return ethers.utils.parseUnits(n.toString(), 'ether')
}
describe('Token', () => {
    let token, deployer, receiver, exchange
    before(async () => {
        const Token = await ethers.getContractFactory('Token')
        token = await Token.deploy('SBH Token', 'SBH', 1000000)
        await token.deployed()

        const accounts = await ethers.getSigners()
        deployer = accounts[0]
        receiver = accounts[1]
        exchange = accounts[2]
    })

    describe('Deployment', () => {
        it('should has address', () => {
            const address = token.address
            expect(address).to.not.equal('0x0')
            expect(address).to.not.equal('')
            expect(address).to.not.equal(null)
            expect(address).to.not.equal(undefined)
        })
        it('should has a name', async () => {
            expect(await token.name()).to.equal('SBH Token')
        })
        it('should has a symbol', async () => {
            expect(await token.symbol()).to.equal('SBH')
        })
        it('should has decimals', async () => {
            expect(await token.decimals()).to.equal(18)
        })
        it('should has total supply', async () => {
            expect(await token.totalSupply()).to.equal(wei(1000000))
        })
        it('should assign total supply to deployer', async () => {
            const totalSupply = await token.totalSupply()
            expect(await token.balanceOf(deployer.address)).to.equal(totalSupply)
        })
    })

    describe('Transfer', () => {
        let result
        it('should allow transfer token', async () => {
            const deployerBalanceBefore = await token.balanceOf(deployer.address)
            const receiverBalanceBefore = await token.balanceOf(receiver.address)
            let transaction = await token.connect(deployer).transfer(receiver.address, wei(500000))
            result = await transaction.wait()
            const deployerBalanceAfter = await token.balanceOf(deployer.address)
            const receiverBalanceAfter = await token.balanceOf(receiver.address)
            const expectedDeployerBalance = deployerBalanceBefore.sub(ethers.BigNumber.from(wei(500000)))
            const expectedReceiverBalance = receiverBalanceBefore.add(ethers.BigNumber.from(wei(500000)))
            expect(deployerBalanceAfter).to.equal(expectedDeployerBalance)
            expect(receiverBalanceAfter).to.equal(expectedReceiverBalance)
        })
        it('should emit Transfer event', () => {
            const event = result.events[0].args
            expect(event._from).to.equal(deployer.address)
            expect(event._to).to.equal(receiver.address)
            expect(event._value).to.equal(wei(500000))
        })
        it('should revert insufficient balances', async () => {
            await expect(token.connect(deployer)
            .transfer(receiver.address, wei(10000000))).to.be.reverted
        })
        it('should revert invalid recipent', async () => {
            await expect(token.connect(deployer)
            .transfer('0x0', wei(100000))).to.be.reverted
        })
    })

    describe('Approving Token', () => {
        let result, amount
        before(async () => {
            amount = wei(500000)
            let transaction = await token.connect(deployer)
            .approve(exchange.address, amount)
            result = await transaction.wait()
        })
        it('should allocates an allowance for delegate token spending', async () => {
            expect(await token.allowance(deployer.address, exchange.address)).to.equal(amount)
        })
        it('should emit Approval event', () => {
            const event = result.events[0].args
            expect(event.owner).to.equal(deployer.address)
            expect(event.spender).to.equal(exchange.address)
            expect(event.value).to.equal(amount)
        })
        it('should revert invalid recipent', async () => {
            await expect(token.connect(deployer)
            .approve('0x0', wei(100000))).to.be.reverted
        })
    })

    describe('Delegated Token Transfer', () => {
        let result, amount
        before(async () => {
            amount = wei(600000)
            let transaction = await token.connect(deployer)
            .approve(exchange.address, amount)
            await transaction.wait()
        })
        it('should allow delegate token transfer', async () => {
            const deployerBalanceBefore = await token.balanceOf(deployer.address)
            const receiverBalanceBefore = await token.balanceOf(receiver.address)
            let transaction = await token.connect(exchange)
            .transferFrom(deployer.address,receiver.address, wei(500000))
            result = await transaction.wait()
            const deployerBalanceAfter = await token.balanceOf(deployer.address)
            const receiverBalanceAfter = await token.balanceOf(receiver.address)
            const expectedDeployerBalance = deployerBalanceBefore.sub(ethers.BigNumber.from(wei(500000)))
            const expectedReceiverBalance = receiverBalanceBefore.add(ethers.BigNumber.from(wei(500000)))
            expect(deployerBalanceAfter).to.equal(expectedDeployerBalance)
            expect(receiverBalanceAfter).to.equal(expectedReceiverBalance)
        })
        it('should rests the allowance', async () => {
            expect(await token.allowance(deployer.address, exchange.address)).to.equal(wei(100000))
        })
        it('should emit Transfer event', () => {
            const event = result.events[0].args
            expect(event._from).to.equal(deployer.address)
            expect(event._to).to.equal(receiver.address)
            expect(event._value).to.equal(wei(500000))
        })
        it('should revert insufficient allowance balances', async () => {
            await expect(token.connect(exchange)
            .transferFrom(deployer.address,receiver.address, wei(10000000))).to.be.reverted
        })
        it('should revert insufficient balances', async () => {
            await expect(token.connect(exchange)
            .transferFrom(deployer.address,receiver.address, wei(600000))).to.be.reverted
        })
        it('should revert invalid recipent', async () => {
            await expect(token.connect(exchange)
            .transferFrom(deployer.address,'0x0', wei(500000))).to.be.reverted
        })
    })
})