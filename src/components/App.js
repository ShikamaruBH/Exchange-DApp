import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { loadProvider,loadNetwork, loadAccount, loadTokens, loadExchange, subscribeToEvents, loadAllOrder } from '../store/interactions';
import Navbar from './Navbar';
import Markets from './Markets';
import Balance from './Balance';
import Order from './Order';
import OrderBook from './OrderBook';
import PriceChart from './PriceChart';
import Trades from './Trade';
import Transactions from './Transactions'
import Alert from './Alert';
const config = require('../config.json')

function App() {
  const dispatch = useDispatch()
  const loadBlockchainData = async () => {
    const provider = loadProvider(dispatch)

    window.ethereum.on('accountsChanged', () => {
      loadAccount(provider, dispatch)
    })
    window.ethereum.on('chainChanged', () => {
      window.location.reload()
    })

    const chainId = await loadNetwork(provider, dispatch)
    const QUY = config[chainId].QUY
    const WIBU = config[chainId].WIBU
    const Exchange = config[chainId].Exchange
    await loadTokens([QUY.address,WIBU.address], provider, dispatch)
    const exchange = await loadExchange(Exchange.address, provider, dispatch)

    loadAllOrder(provider, exchange, dispatch)
    subscribeToEvents(exchange, dispatch)
  }

  useEffect(() => {
    loadBlockchainData()
  })

  return (
    <div>

      <Navbar />

      <main className='exchange grid'>
        <section className='exchange__section--left grid'>
          <Markets />
          <Balance />
          <Order />
        </section>
        <section className='exchange__section--right grid'>
          <PriceChart />
          <Transactions />
          <Trades />
          <OrderBook />
        </section>
      </main>

      <Alert/>

    </div>
  );
}

export default App;
