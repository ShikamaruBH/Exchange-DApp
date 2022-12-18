const { expect } = require("chai");
const { ethers } = require("hardhat");

function wei(n) {
    return ethers.utils.parseUnits(n.toString(), 'ether')
}

describe('Exchange', () => {
    let exchange, deployer, feeAccount, user1, user2
    const feePercent = 10
    beforeEach(async () => {
        const accounts = await ethers.getSigners()
        deployer = accounts[0]
        feeAccount = accounts[1]
        user1 = accounts[2]
        user2 = accounts[3]

        const Exchange = await ethers.getContractFactory('Exchange')
        const Token = await ethers.getContractFactory('Token')
        exchange = await Exchange.deploy(feeAccount.address, feePercent)
        sbhToken = await Token.connect(user1).deploy('SBH Token', 'SBH', 1000000)
        wibuToken = await Token.connect(user2).deploy('Wibu Token', 'WIBU', 1000000)
        await exchange.deployed()
        await sbhToken.deployed()
        await wibuToken.deployed()
    })     
    describe('Deployment', () => {
        it('should tracks the fee account', async () => {
            expect(await exchange.feeAccount()).to.equal(feeAccount.address)
        })
        it('should tracks the fee percent', async () => {
            expect(await exchange.feePercent()).to.equal(feePercent)
        })
        it('should track the owner', async () => {
            expect(await exchange.owner()).to.equal(deployer.address)
        })
    })
    describe('Change fee percent', () => {
        it('should allow change fee percent', async () => {
            const newFeePercent = 20
            await exchange.changeFeePercent(newFeePercent)
            expect(await exchange.feePercent()).to.equal(newFeePercent)
        })
        it('should be reverted if not owner', async () => {
            await expect(exchange.connect(feeAccount).changeFeePercent()).to.be.reverted
        })
    })
    describe('Deposit Token', () => {
        let transaction, result
        const amount = wei(500000)
        beforeEach(async () => {
            transaction = await sbhToken.connect(user1).approve(exchange.address, amount)
            await transaction.wait()
            transaction = await exchange.connect(user1).depositToken(sbhToken.address, amount)
            result = await transaction.wait()
        })
        it('should allow deposit token', async () => {
            expect(await sbhToken.balanceOf(exchange.address)).to.equal(amount)
            expect(await sbhToken.balanceOf(user1.address)).to.equal(amount)
            expect(await exchange.balanceOf(sbhToken.address, user1.address)).to.equal(amount)
        })
        it('should emit Deposit event', () => {
            const event = result.events[1].args
            expect(result.events[1].event).to.equal('Deposit')
            expect(event.token).to.equal(sbhToken.address)
            expect(event.user).to.equal(user1.address)
            expect(event.amount).to.equal(amount)
            expect(event.balance).to.equal(amount)
        })
        it('should fail when no token approved', async () => {
            await expect(exchange.connect(user1).depositToken(sbhToken.address, amount)).to.be.reverted
        })
    })
    describe('Order actions', () => {
        let transaction, result, count
        const amount = wei(500)
        const depositAmount = wei(1000)
        const fee = wei(10 * 500 / 100)
        beforeEach( async () => {
            transaction = await sbhToken.connect(user1).approve(exchange.address, depositAmount)
            await transaction.wait()
            transaction = await exchange.connect(user1).depositToken(sbhToken.address, depositAmount)
            await transaction.wait()

            transaction = await wibuToken.connect(user2).approve(exchange.address, depositAmount)
            await transaction.wait()
            transaction = await exchange.connect(user2).depositToken(wibuToken.address, depositAmount)
            await transaction.wait()

            transaction = await exchange.connect(user1).makeOrder(
                    wibuToken.address,
                    amount,
                    sbhToken.address,
                    amount)
            result = await transaction.wait()
            count = await exchange.ordersCount()
        })
        describe('Making Order', () => {
            it('should allow make order', async () => {
                expect(count).to.equal(1)
                const order = await exchange.orders(count)
                expect(order.id).to.equal(count)
                expect(order.user).to.equal(user1.address)
                expect(order.tokenGet).to.equal(wibuToken.address)
                expect(order.amountGet).to.equal(amount)
                expect(order.tokenGive).to.equal(sbhToken.address)
                expect(order.amountGive).to.equal(amount)
                expect(order.timestamp).to.at.least(1)
            })
            it('should emit Order event', () => {
                const event = result.events[0].args
                expect(result.events[0].event).to.equal('Order')
                expect(event.id).to.equal(count)
                expect(event.user).to.equal(user1.address)
                expect(event.tokenGet).to.equal(wibuToken.address)
                expect(event.amountGet).to.equal(amount)
                expect(event.tokenGive).to.equal(sbhToken.address)
                expect(event.amountGive).to.equal(amount)
                expect(event.timestamp).to.at.least(1)
            })
            it('should be reverted if insufficient token balance', async () => {
                await expect(exchange.connect(user1).makeOrder(
                    wibuToken.address,
                    amount,
                    sbhToken.address,
                    wei(600000))).to.be.reverted
            })
        })
        describe('Cancelling Order', () => {
            beforeEach(async () => {
                transaction = await exchange.connect(user1).cancelOrder(count)
                result = await transaction.wait()
            })
            it('should allow cancel order', async () => {
                const isOrderCancelled = await exchange.orderCancelled(count)
                expect(isOrderCancelled).to.equal(true)
            })
            it('should emit Cancel event', async () => {
                expect(result.events[0].event).to.equal('Cancel')
                const order = await exchange.orders(count)
                const event = result.events[0].args
                expect(event.id).to.equal(order.id)
                expect(event.user).to.equal(order.user)
                expect(event.tokenGet).to.equal(order.tokenGet)
                expect(event.tokenGive).to.equal(order.tokenGive)
                expect(event.amountGet).to.equal(order.amountGet)
                expect(event.amountGive).to.equal(order.amountGive)
                expect(event.timestamp).to.equal(order.timestamp)
            })
            it('should be reverted with invalid id', async () => {
                await expect(exchange.cancelOrder(10)).to.be.reverted
            })
            it('should be reverted when cancel order not belong to user', async () => {
                await expect(exchange.connect(user2).cancelOrder(1)).to.be.reverted
            })
        })
        describe('Filling Order', () => {
            describe('Success', () => {
                beforeEach(async () => {
                    transaction = await exchange.connect(user2).fillOrder(1)
                    result = await transaction.wait()
                })
                it('should excute trade and charge fee', async () => {
                    expect(await exchange.balanceOf(sbhToken.address,user1.address))
                    .to.equal(ethers.BigNumber.from(depositAmount).sub(ethers.BigNumber.from(amount)))
                    expect(await exchange.balanceOf(wibuToken.address,user1.address)).to.equal(amount)
                    expect(await exchange.balanceOf(sbhToken.address,user2.address)).to.equal(amount)
                    expect(await exchange.balanceOf(wibuToken.address,user2.address))
                    .to.equal(ethers.BigNumber.from(depositAmount).sub(ethers.BigNumber.from(amount)).sub(ethers.BigNumber.from(fee)))
                    expect(await exchange.balanceOf(wibuToken.address,feeAccount.address)).to.equal(fee)
                })
                it('should update filled order', async () => {
                    expect(await exchange.orderFilled(1)).to.equal(true)
                })
                it('should emit Trade event', async () => {
                    const event = result.events[0].args
                    expect(result.events[0].event).to.equal('Trade')
                    expect(event.id).to.equal(1)
                    expect(event.user).to.equal(user2.address)
                    expect(event.tokenGet).to.equal(wibuToken.address)
                    expect(event.tokenGive).to.equal(sbhToken.address)
                    expect(event.amountGet).to.equal(amount)
                    expect(event.amountGive).to.equal(amount)
                    expect(event.creator).to.equal(user1.address)
                    expect(event.timestamp).to.at.least(1)
                })
            })
            describe('Failure', () => {
                it('should be reverted with invalid order id', async () => {
                    await expect(exchange.connect(user2).fillOrder(10)).to.be.reverted
                })
                it('should be reverted with cancelled order', async () => {
                    await exchange.connect(user1).cancelOrder(1)
                    await expect(exchange.connect(user2).fillOrder(1)).to.be.reverted
                })
                it('should be reverted with filled order', async () => {
                    await exchange.connect(user2).fillOrder(1)
                    await expect(exchange.connect(user2).fillOrder(1)).to.be.reverted
                })
                it('should be reverted when user have insufficient token balance', async () => {
                    const amount = wei(1000)
                    transaction = await exchange.connect(user1).makeOrder(
                            wibuToken.address,
                            amount,
                            sbhToken.address,
                            amount)
                    await transaction.wait()
                    const count = await exchange.ordersCount()
                    expect(count).to.equal(2)
                    await expect(exchange.connect(user2).fillOrder(count)).to.be.reverted
                })
            })
        })
    })
    describe('Withdraw Token', () => {
        let transaction, result
        const amount = wei(500)
        beforeEach(async () => {
            transaction = await sbhToken.connect(user1).approve(exchange.address, amount)
            await transaction.wait()
            transaction = await exchange.connect(user1).depositToken(sbhToken.address, amount)
            await transaction.wait()
            transaction = await exchange.connect(user1).withdrawToken(sbhToken.address, amount)
            result = await transaction.wait()
        })
        it('should allow withdraw token', async () => {
            expect(await sbhToken.balanceOf(exchange.address)).to.equal(0)
            expect(await sbhToken.balanceOf(user1.address)).to.equal(wei(1000000))
            expect(await exchange.balanceOf(sbhToken.address, user1.address)).to.equal(0)
        })
        it('should emit Withdraw event', () => {
            const event = result.events[1].args
            expect(result.events[1].event).to.equal('Withdraw')
            expect(event.token).to.equal(sbhToken.address)
            expect(event.user).to.equal(user1.address)
            expect(event.amount).to.equal(amount)
            expect(event.balance).to.equal(0)
        })
        it('should fail when user does not have enough token in balance', async () => {
            await expect(exchange.connect(user1).withdrawToken(sbhToken.address, amount)).to.be.reverted
        })
    })
})
