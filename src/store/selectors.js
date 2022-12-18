import { createSelector } from "reselect";
import { get, groupBy, maxBy, minBy, reject } from 'lodash'
import { ethers } from "ethers";
import moment from "moment";

const GREEN = '#25CE8F'
const RED = '#F45353'

const tokens = state => get(state, 'tokens.contracts')
const events = state => get(state, 'exchange.events', [])
const account = state => get(state, 'provider.account')
const allOrders = state => get(state, 'exchange.allOrders.data', [])
const cancelledOrders = state => get(state, 'exchange.cancelledOrders.data', [])
const filledOrders = state => get(state, 'exchange.filledOrders.data', [])

const openOrders = state => {
    const all = allOrders(state)
    const cancelled = cancelledOrders(state)
    const filled = filledOrders(state)

    const openOrders = reject(all, (order) => {
        const orderFilled = filled.some(o => o.id.toString() === order.id.toString())
        const orderCancelled = cancelled.some(o => o.id.toString() === order.id.toString())
        return orderFilled || orderCancelled
    })

    return openOrders
}

const decoratorOrder = (order, tokens) => {
    let token0Amount, token1Amount
    const precision = 100000

    if (order.tokenGive === tokens[1].address) {
        token0Amount = order.amountGive
        token1Amount = order.amountGet
    } else {
        token0Amount = order.amountGet
        token1Amount = order.amountGive    
    }

    token0Amount = ethers.utils.formatUnits(token0Amount, 'ether')
    token1Amount = ethers.utils.formatUnits(token1Amount, 'ether')
    const price = Math.round(token1Amount / token0Amount * precision) / precision
    const formatedTimestamp = moment.unix(order.timestamp).format('h:mm:ssa d MMM D')

    return {
        ...order,
        token0Amount,
        token1Amount,
        price,
        formatedTimestamp
    }
}
const decoratorOrderBookOrders = (orders, tokens) => {
    return orders.map((order) => decoratorOrderBookOrder(decoratorOrder(order, tokens), tokens))
}

const decoratorOrderBookOrder = (order, tokens) => {
    const orderType = order.tokenGive === tokens[1].address ? 'buy' : 'sell'
    const orderTypeClass = orderType === 'buy' ? GREEN : RED
    const orderFillAction = orderType === 'buy' ? 'sell' : 'buy'

    return {
        ...order,
        orderType,
        orderTypeClass,
        orderFillAction
    }
}

export const orderBookSelector = createSelector(
    openOrders,
    tokens, 
    (orders, tokens) => {
        if (!tokens[0] || !tokens[1]) return
        orders = orders.filter(o => o.tokenGive === tokens[0].address || o.tokenGive === tokens[1].address)
        orders = orders.filter(o => o.tokenGet === tokens[0].address || o.tokenGet === tokens[1].address)
        orders = decoratorOrderBookOrders(orders, tokens)
        orders = groupBy(orders, 'orderType')
        const buyOrders = get(orders, 'buy', [])
        const sellOrders = get(orders, 'sell', [])

        buyOrders.sort((a,b) => b.price - a.price)
        sellOrders.sort((a,b) => b.price - a.price)

        orders = {
            ...orders,
            buyOrders,
            sellOrders
        }

        return orders
})

export const priceChartSelector = createSelector(
    filledOrders,
    tokens,
    (orders, tokens) => {
        if (!tokens[0] || !tokens[1]) return

        orders = orders.filter(o => o.tokenGive === tokens[0].address || o.tokenGive === tokens[1].address)
        orders = orders.filter(o => o.tokenGet === tokens[0].address || o.tokenGet === tokens[1].address)
        orders = orders.map(o => decoratorOrder(o,tokens))
        orders = orders.sort((a,b) => a.timestamp - b.timestamp)

        const data = buildGraphData(orders)
        const [secondLastOrder, lastOrder] = orders.slice(orders.length-2,orders.length)
        const lastPrice = get(lastOrder, 'price', 0)
        const secondLastPrice = get(secondLastOrder, 'price', 0)

        return {
            lastPrice,
            lastPriceChange: lastPrice >= secondLastPrice ? '+' : '-', 
            series: [{
                data
            }]
        }
    }
)

const buildGraphData = (orders) => {
    orders = groupBy(orders, o => { return moment.unix(o.timestamp).startOf('day').format() })

    const hours = Object.keys(orders)
    const graphData = hours.map(hour => {
        const group = orders[hour]
        const open = group[0].price
        const high = maxBy(group, 'price').price
        const low = minBy(group, 'price').price
        const close = group[group.length - 1].price

        return {
            x: new Date(hour),
            y: [open,high,low,close]
        }
    })

    return graphData
}

export const filledOrdersSelector = createSelector(
    filledOrders,
    tokens,
    (orders, tokens) => {
        if (!tokens[0] || !tokens[1]) return

        orders = orders.filter(o => o.tokenGive === tokens[0].address || o.tokenGive === tokens[1].address)
        orders = orders.filter(o => o.tokenGet === tokens[0].address || o.tokenGet === tokens[1].address)
        orders = orders.sort((a,b) => a.timestamp - b.timestamp)

        orders = decoratorFilledOrders(orders, tokens)
        orders = orders.sort((a,b) => b.timestamp - a.timestamp)

        return orders
    }
)

const decoratorFilledOrders = (orders, tokens) => {
    let previousOrder = orders[0]
    return orders.map(order => {
        order = decoratorOrder(order, tokens)
        order = decoratorFilledOrder(order, previousOrder)
        previousOrder = order
        return order
    })
}

const decoratorFilledOrder = (order, previousOrder) => {
    return {
        ...order,
        tokenPriceClass: order.price > previousOrder.price ? GREEN : RED
    }
}

export const myOpenOrdersSelector = createSelector(
    account,
    openOrders,
    tokens,
    (account, orders, tokens) => {
        if (!tokens[0] || !tokens[1]) return
        orders = orders.filter(o => o.user === account)
        orders = orders.filter(o => o.tokenGive === tokens[0].address || o.tokenGive === tokens[1].address)
        orders = orders.filter(o => o.tokenGet === tokens[0].address || o.tokenGet === tokens[1].address)
        
        orders = decoratorMyOpenOrders(orders, tokens)
        orders = orders.sort((a,b) => b.timestamp - a.timestamp)
        return orders 
    }
)

const decoratorMyOpenOrders = (orders, tokens) => {
    return orders.map(order => {
        order = decoratorOrder(order, tokens)
        order = decoratorOrderBookOrder(order, tokens)
        return order
    })
}

export const myFilledOrdersSelector = createSelector(
    account,
    filledOrders,
    tokens,
    (account, orders, tokens) => {
        if (!tokens[0] || !tokens[1]) return
        orders = orders.filter(o => o.user === account || o.creator === account)
        orders = orders.filter(o => o.tokenGive === tokens[0].address || o.tokenGive === tokens[1].address)
        orders = orders.filter(o => o.tokenGet === tokens[0].address || o.tokenGet === tokens[1].address)
        
        orders = orders.sort((a,b) => b.timestamp - a.timestamp)
        orders = decoratorMyFilledOrders(account, orders, tokens)
        return orders
    }
)

const decoratorMyFilledOrders = (account, orders, tokens) => {
    return orders.map(order => {
        order = decoratorOrder(order, tokens)
        order = decoratorMyFilledOrder(account, order, tokens)
        return order
    })
}

const decoratorMyFilledOrder = (account, order, tokens) => {
    const myOrder = order.creator === account
    let orderType

    if (myOrder)    orderType = order.tokenGive === tokens[1].address ? 'buy' : 'sell'
    else    orderType = order.tokenGive === tokens[1].address ? 'sell' : 'buy'

    const orderSign = orderType === 'sell' ? '-' : '+'
    const orderClass = orderType === 'sell' ? RED : GREEN

    return {
        ...order,
        orderType,
        orderClass,
        orderSign
    }
}

export const myEventsSelector = createSelector(
    account,
    events,
    (account, events) => {
        events = events.filter(event => event.args.user === account)
        return events
    }
)