import { useDispatch, useSelector } from "react-redux";
import Sort from '../assets/sort.svg'
import { orderBookSelector } from "../store/selectors";
import { fillOrder } from '../store/interactions'

const OrderBook = () => {
    const symbols = useSelector(state => state.tokens.symbols)
    const orderBook = useSelector(orderBookSelector)
    const provider = useSelector(state => state.provider.connection)
    const exchange = useSelector(state => state.exchange.contract)
    const dispatch = useDispatch()

    const fillOrderHandler = (order) => {
        fillOrder(provider, exchange, order, dispatch)
    }
    return (
      <div className="component exchange__orderbook">
        <div className='component__header flex-between'>
          <h2>Order Book</h2>
        </div>
  
        <div className="flex">
          {
            orderBook && orderBook.sellOrders.length !== 0 ? (
                <table className='exchange__orderbook--sell'>
                    <caption>Selling</caption>
                    <thead>
                    <tr>
                        <th>{symbols && symbols[0]}<img src={Sort} alt='Sort'/></th>
                        <th>{symbols && symbols[0]}/{symbols && symbols[1]}<img src={Sort} alt='Sort'/></th>
                        <th>{symbols && symbols[1]}<img src={Sort} alt='Sort'/></th>
                    </tr>
                    </thead>
                    <tbody>
                        {
                            orderBook.sellOrders.map((order,index) => {
                                return (
                                    <tr key={index} onClick={() => fillOrderHandler(order)}>
                                        <td>{order.token0Amount}</td>
                                        <td style={{ color: `${order.orderTypeClass}`}}>{order.price}</td>
                                        <td>{order.token1Amount}</td>
                                    </tr>
                                )
                            })
                        }
                    </tbody>
                </table>
            ) : (
                <p className='flex-center'>No Sell Orders</p>
            )
          }
  
          <div className='divider'></div>
          {
            orderBook && orderBook.buyOrders.length !== 0 ? (
                <table className='exchange__orderbook--buy'>
                    <caption>Buying</caption>
                    <thead>
                    <tr>
                        <th>{symbols && symbols[1]}<img src={Sort} alt='Sort'/></th>
                        <th>{symbols && symbols[0]}/{symbols && symbols[1]}<img src={Sort} alt='Sort'/></th>
                        <th>{symbols && symbols[0]}<img src={Sort} alt='Sort'/></th>
                    </tr>
                    </thead>
                    <tbody>
                        {
                            orderBook.buyOrders.map((order,index) => {
                                return (
                                    <tr key={index} onClick={() => fillOrderHandler(order)}>
                                        <td>{order.token0Amount}</td>
                                        <td style={{ color: `${order.orderTypeClass}`}}>{order.price}</td>
                                        <td>{order.token1Amount}</td>
                                    </tr>
                                )
                            })
                        }
                    </tbody>
                </table>
            ) : (
                <p className='flex-center'>No Buy Orders</p>
            )
          }
        </div>
      </div>
    );
  }
  
  export default OrderBook;