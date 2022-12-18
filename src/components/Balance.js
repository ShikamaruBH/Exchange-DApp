import { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import sbh from '../assets/sbh.svg'
import eth from '../assets/eth.svg'
import { loadBalances, transferToken } from '../store/interactions';

const Balance = () => {
  const [token1Amount, setToken1Amount] = useState(0)
  const [token2Amount, setToken2Amount] = useState(0)
  const [isDeposit, setIsDeposit] = useState(true)
  const symbols = useSelector(state => state.tokens.symbols)
  const tokens = useSelector(state => state.tokens.contracts)
  const exchange = useSelector(state => state.exchange.contract)
  const account = useSelector(state => state.provider.account)
  const provider = useSelector(state => state.provider.connection)
  const dispatch = useDispatch()

  const tokenBalances = useSelector(state => state.tokens.balances)
  const exchangeBalances = useSelector(state => state.exchange.balances)
  const transferInProgress = useSelector(state => state.exchange.transferInProgress)

  const depositRef = useRef(null)
  const withdrawRef = useRef(null)

  const tabHandler = (e) => {
    if (e.target.className !== depositRef.current.className) {
      depositRef.current.className = 'tab'
      setIsDeposit(false)
    } else {
      withdrawRef.current.className = 'tab'
      setIsDeposit(true)
    }
    e.target.className = 'tab tab--active'
  }
 
  const amountHandler = (e, token) => {
    switch (token.address) {
        case tokens[0].address:
            return setToken1Amount(e.target.value)
        case tokens[1].address:
            return setToken2Amount(e.target.value)
    }
  }

  const depositHandler = (e, token) => {
    e.preventDefault()
    switch (token.address) {
        case tokens[0].address:
            transferToken(provider, exchange, 'Deposit', token, token1Amount, dispatch)
            return setToken1Amount(0)
        case tokens[1].address:
            transferToken(provider, exchange, 'Deposit', token, token2Amount, dispatch)
            return setToken2Amount(0)
    }
  }

  const withdrawHandler = (e, token) => {
    e.preventDefault()
    switch (token.address) {
        case tokens[0].address:
            transferToken(provider, exchange, 'Withdraw', token, token1Amount, dispatch)
            return setToken1Amount(0)
        case tokens[1].address:
            transferToken(provider, exchange, 'Withdraw', token, token2Amount, dispatch)
            return setToken2Amount(0)
    }
  }
  useEffect(() => {
    async function fetchData() {
        if (exchange && tokens[0] && tokens[1] && account)
            return await loadBalances(exchange, tokens, account, dispatch)
    }
    fetchData()
  }, [exchange, tokens, account, dispatch, transferInProgress])

  return (
    <div className='component exchange__transfers'>
      <div className='component__header flex-between'>
        <h2>Balance</h2>
        <div className='tabs'>
          <button onClick={tabHandler} ref={depositRef} className='tab tab--active'>Deposit</button>
          <button onClick={tabHandler} ref={withdrawRef} className='tab'>Withdraw</button>
        </div>
      </div>

      {/* Deposit/Withdraw Component 1 (DApp) */}

      <div className='exchange__transfers--form'>
        <div className='flex-between'>
            <p><small>Token</small><br /><img src={sbh} alt="Token Logo" className='logo'/>{symbols && symbols[0]}</p>
            <p><small>Wallet</small><br />{tokenBalances && tokenBalances[0]}</p>
            <p><small>Exchange</small><br />{exchangeBalances && exchangeBalances[0]}</p>
        </div>

        <form onSubmit={isDeposit ? (e) => depositHandler(e, tokens[0]) : (e) => withdrawHandler(e, tokens[0]) }>
          <label htmlFor="token0">{symbols && symbols[0]} Amount</label>
          <input
            type="text"
            id='token0'
            placeholder='0.0000'
            value={token1Amount === 0 ? '' : token1Amount}
            onChange={(e) => amountHandler(e, tokens[0])}
          />

          <button className='button' type='submit'>
            { isDeposit ? <span>Deposit</span> : <span>Withdraw</span> }
          </button>
        </form>
      </div>

      <hr />

      {/* Deposit/Withdraw Component 2 (mETH) */}

      <div className='exchange__transfers--form'>
        <div className='flex-between'>
            <p><small>Token</small><br /><img src={eth} alt="Token Logo" className='logo'/>{symbols && symbols[1]}</p>
            <p><small>Wallet</small><br />{tokenBalances && tokenBalances[1]}</p>
            <p><small>Exchange</small><br />{exchangeBalances && exchangeBalances[1]}</p>
        </div>

        <form onSubmit={isDeposit ? (e) => depositHandler(e, tokens[1]) : (e) => withdrawHandler(e, tokens[1]) }>
          <label htmlFor="token1">{symbols && symbols[1]} Amount</label>
          <input
            type="text"
            id='token1'
            placeholder='0.0000'
            value={token2Amount === 0 ? '' : token2Amount}
            onChange={(e) => amountHandler(e, tokens[1])}
          />

          <button className='button' type='submit'>
            { isDeposit ? <span>Deposit</span> : <span>Withdraw</span> }
          </button>
        </form>
      </div>

      <hr />
    </div>
  );
}

export default Balance;