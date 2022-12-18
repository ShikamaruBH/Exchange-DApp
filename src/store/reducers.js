export const provider = (state = {}, action) => {
    switch (action.type) {
        case 'PROVIDER_LOADED':
            return {
                ...state,
                connection: action.connection
            }
        case 'NETWORK_LOADED':
            return {
                ...state,
                chainId: action.chainId
            }
        case 'ACCOUNT_LOADED':
            return {
                ...state,
                account: action.account
            }
        case 'ETHER_BALANCE_LOADED':
            return {
                ...state,
                balance: action.balance
            }
        default:
            return state
    }
}

const DEFAULT_TOKENS_STATE = {
    loaded: false,
    contracts: [],
    symbols: [],
    balances: []
}
export const tokens = (state = DEFAULT_TOKENS_STATE, action) => {
    switch (action.type) {
        case 'TOKEN_2_LOADED':
            return {
                loaded: true,
                contracts: [...state.contracts, action.token],
                symbols: [...state.symbols, action.symbol]
            }
        case 'TOKEN_1_LOADED':
            return {
                loaded: true,
                contracts: [action.token],
                symbols: [action.symbol]
            }
        case 'TOKEN_1_BALANCE_LOADED':
            return {
                ...state,
                balances: [action.balance]
            }
        case 'TOKEN_2_BALANCE_LOADED':
            return {
                ...state,
                balances: [...state.balances,action.balance]
            }
        default:
            return state
    }
}

const EXCHANGE_DEFAULT_STATE = { 
    loaded: false,
    contract: {},
    transaction: {
        isSuccessful: false,
    },
    allOrders: {
        data: [],
    },
    filledOrders: {
        data: [],
    },
    cancelledOrders: {
        data: [],
    },
    events: [],
}
export const exchange = (state = EXCHANGE_DEFAULT_STATE, action) => {
    let index, data
    switch (action.type) {
        case 'EXCHANGE_LOADED':
            return {
                ...state,
                loaded: true,
                contract: action.exchange
            }
        case 'EXCHANGE_TOKEN_1_BALANCE_LOADED':
            return {
                ...state,
                balances: [action.balance]
            }
        case 'EXCHANGE_TOKEN_2_BALANCE_LOADED':
            return {
                ...state,
                balances: [...state.balances,action.balance]
            }
        case 'TRANSFER_REQUEST':
            return {
                ...state,
                transaction: {
                    transactionType: 'Transfer',
                    isPending: true,
                    isSuccessful: false,
                },
                transferInProgress: true
            }
        case 'TRANSFER_SUCCESS':
            return {
                ...state,
                transaction: {
                    transactionType: 'Transfer',
                    isPending: false,
                    isSuccessful: true,
                },
                transferInProgress: false,
                events: [action.event, ...state.events]
            }
        case 'TRANSFER_FAIL':
            return {
                ...state,
                transaction: {
                    transactionType: 'Transfer',
                    isPending: false,
                    isSuccessful: false,
                    isError: true,
                },
                transferInProgress: false,
            }
        case 'NEW_ORDER_REQUEST':
            return {
                ...state,
                transaction: {
                    transactionType: 'New Order',
                    isPending: true,
                    isSuccessful: false,
                },
            }
        case 'NEW_ORDER_SUCCESS':
            index = state.allOrders.data.findIndex(order => order.id.toString() === action.order.id.toString())
            if (index === -1) 
                data = [...state.allOrders.data, action.order]
            else
                data = state.allOrders.data

            return {
                ...state,
                allOrders: {
                    ...state.allOrders,
                    data,
                },
                transaction: {
                    transactionType: 'New Order',
                    isPending: false,
                    isSuccessful: true,
                },
                events: [action.event, ...state.events]
            }
        case 'NEW_ORDER_FAIL':
            return {
                ...state,
                transaction: {
                    transactionType: 'New Order',
                    isPending: false,
                    isSuccessful: false,
                    isError: true,
                },
            }
        case 'ALL_ORDER_LOADED':
            return {
                ...state,
                allOrders: {
                    loaded: true,
                    data: action.allOrders
                }
            }
        case 'CANCELLED_ORDER_LOADED':
            return {
                ...state,
                cancelledOrders: {
                    loaded: true,
                    data: action.cancelledOrders
                }
            }
        case 'FILLED_ORDER_LOADED':
            return {
                ...state,
                filledOrders: {
                    loaded: true,
                    data: action.filledOrders
                }
            }
        case 'CANCEL_ORDER_REQUEST':
            return {
                ...state,
                transaction: {
                    transactionType: 'Cancel',
                    isPending: true,
                    isSuccessful: false,
                },
                transferInProgress: true
            }
        case 'CANCEL_ORDER_FAIL':
            return {
                ...state,
                transaction: {
                    transactionType: 'Cancel',
                    isPending: false,
                    isSuccessful: false,
                    isError: true
                },
            }
        case 'CANCEL_ORDER_SUCCESS':
            return {
                ...state,
                transaction: {
                    transactionType: 'Cancel',
                    isPending: false,
                    isSuccessful: true,
                },
                cancelledOrders: {
                    ...state.cancelledOrders,
                    data: [
                        ...state.cancelledOrders.data,
                        action.order
                    ]
                },
                events: [action.event, ...state.events]
            }
        case 'FILL_ORDER_REQUEST':
            return {
                ...state,
                transaction: {
                    transactionType: 'Fill',
                    isPending: true,
                    isSuccessful: false,
                },
                transferInProgress: true
            }
        case 'FILL_ORDER_FAIL':
            return {
                ...state,
                transaction: {
                    transactionType: 'Fill',
                    isPending: false,
                    isSuccessful: false,
                    isError: true
                },
            }
        case 'FILL_ORDER_SUCCESS':
            index = state.filledOrders.data.findIndex(order => order.id.toString() === action.order.id.toString())
            if (index === -1) 
                data = [...state.filledOrders.data, action.order]
            else
                data = state.filledOrders.data
            return {
                ...state,
                transaction: {
                    transactionType: 'Fill',
                    isPending: false,
                    isSuccessful: true,
                },
                filledOrders: {
                    ...state.filledOrders,
                    data
                },
                events: [action.event, ...state.events]
            }
        default:
            return state
    }
}