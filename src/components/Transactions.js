import { useDispatch, useSelector } from "react-redux";
import { myFilledOrdersSelector, myOpenOrdersSelector } from "../store/selectors";
import Banner from "./Banner";
import Sort from '../assets/sort.svg'
import { useRef, useState } from "react";
import { cancelOrder } from "../store/interactions";

const Transactions = () => {
  const [showMyOrders, setShowMyOrders] = useState(true)
  const openOrders = useSelector(myOpenOrdersSelector)
  const myFilledOrders = useSelector(myFilledOrdersSelector)
  const symbols = useSelector(state => state.tokens.symbols)
  const provider = useSelector(state => state.provider.connection)
  const exchange = useSelector(state => state.exchange.contract)
  const dispatch = useDispatch()

  const ordersRef = useRef(null)
  const tradesRef = useRef(null)

  const tabHandler = (e) => {
    if (e.target.className !== tradesRef.current.className) {
        tradesRef.current.className = 'tab'
        setShowMyOrders(true)
    } else {
        ordersRef.current.className = 'tab'
        setShowMyOrders(false)
    }
    e.target.className = 'tab tab--active'
  }

  const cancelHandler = (order) => {
    cancelOrder(provider, exchange, order, dispatch)
  }

  return (
    <div className="component exchange__transactions">
      {
        showMyOrders ? (
          <div>
            <div className='component__header flex-between'>
              <h2>My Orders</h2>

              <div className='tabs'>
                <button onClick={tabHandler} ref={ordersRef} className='tab tab--active'>Orders</button>
                <button onClick={tabHandler} ref={tradesRef} className='tab'>Trades</button>
              </div>
            </div>
              {
                openOrders && openOrders.length > 0 ? (
                    <table>
                      <thead>
                        <tr>
                          <th>{symbols && symbols[0]}<img src={Sort} alt='Sort'/></th>
                          <th>{symbols && `${symbols[0]}/${symbols[1]}`}<img src={Sort} alt='Sort'/></th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {
                          openOrders.map((order, index) => {
                              return (
                                <tr key={index}>
                                  <td style={{ color: `${order.orderTypeClass}`}}>{order.token0Amount}</td>
                                  <td>{order.price}</td>
                                  <td><button className="button--sm" onClick={() => cancelHandler(order)}>Cancel</button></td>
                                </tr>
                              )
                          })
                        }
                      </tbody>
                    </table>
      
                ) : (
                  <Banner text='No Transaction' />
                )
              }
          </div>
        ) : (
          <div>
            <div className='component__header flex-between'>
              <h2>My Transactions</h2>

              <div className='tabs'>
                <button onClick={tabHandler} ref={ordersRef} className='tab tab--active'>Orders</button>
                <button onClick={tabHandler} ref={tradesRef} className='tab'>Trades</button>
              </div>
            </div>
            {
              myFilledOrders && myFilledOrders.length > 0 ? (
                <table>
                  <thead>
                    <tr>
                      <th>Time<img src={Sort} alt="Sort" /></th>
                      <th>{symbols && symbols[0]}<img src={Sort} alt="Sort" /></th>
                      <th>{symbols && symbols[0]}/{symbols && symbols[1]}<img src={Sort} alt="Sort" /></th>
                    </tr>
                  </thead>
                  <tbody>
                  {
                    myFilledOrders.map((order, index) => {
                      return(
                        <tr key={index}>
                          <td>{order.formatedTimestamp}</td>
                          <td style={{ color: `${order.orderClass}` }}>{order.orderSign}{order.token0Amount}</td>
                          <td>{order.price}</td>
                        </tr>
                      )
                    })
                  }
                  </tbody>
                </table>
              ) : (
                <Banner text='No Transaction' />
              )
            }
          </div>
        )
      }

    </div>
  )
}

export default Transactions;