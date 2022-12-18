import { useSelector } from "react-redux";
import { filledOrdersSelector } from "../store/selectors";
import Sort from '../assets/sort.svg'
import Banner from "./Banner";

const Trades = () => {
    const filledOrders = useSelector(filledOrdersSelector)
    const symbols = useSelector(state => state.tokens.symbols)

    return (
      <div className="component exchange__trades">
        <div className='component__header flex-between'>
          <h2>Trades</h2>
        </div>
        {
            filledOrders && filledOrders.length > 0 ? (
                <table>
                    <thead>
                        <tr>
                            <th>Time<img src={Sort} alt='Sort'/></th>
                            <th>{symbols && symbols[0]}<img src={Sort} alt='Sort'/></th>
                            <th>{symbols && `${symbols[0]}/${symbols[1]}`}<img src={Sort} alt='Sort'/></th>
                        </tr>
                    </thead>
                    <tbody>
                        {
                            filledOrders.map((order, index) => {
                                return (
                                    <tr key={index}>
                                        <td>{order.formatedTimestamp}</td>
                                        <td style={{ color: `${order.tokenPriceClass}`}}>{order.token0Amount}</td>
                                        <td>{order.price}</td>
                                    </tr>
                                )
                            })
                        }
                    </tbody>
                </table>
            ) : (
                <Banner text='No Transaction'/>
            )
        }
  
      </div>
    );
  }
  
export default Trades;