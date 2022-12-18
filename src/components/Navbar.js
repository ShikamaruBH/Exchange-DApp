import logo from '../assets/sbh.svg'
import eth from '../assets/eth.svg'
import { useDispatch, useSelector } from 'react-redux'
import Blockies from 'react-blockies'
import { loadAccount } from '../store/interactions'
import config from '../config.json'

const Navbar = () => {
    const account = useSelector(state => state.provider.account)
    const balance = useSelector(state => state.provider.balance)
    const provider = useSelector(state => state.provider.connection)
    const chainId = useSelector(state => state.provider.chainId)
    const dispatch = useDispatch()

    const connectHandler = async () => {
        await loadAccount(provider, dispatch)
    }

    const networkHandler = async (e) => {
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: e.target.value }]
        })
    }

    return (    
        <div className='exchange__header grid'>
            <div className='exchange__header--brand flex'>
                <img src={logo} className='logo' alt='SBH Logo'></img>
                <h1>ShikamaruBH Token Exchange</h1>
            </div>

            <div className='exchange__header--networks flex'>
                <img src={eth} alt="ETH Logo" className='Eth Logo' />
                {
                    chainId &&
                    <select 
                        name='networks' id='networks'
                        value={
                            config[chainId] ?
                            `0x${chainId.toString(16)}` :
                            0
                        }
                        onChange={networkHandler}
                    >
                        <option value={0} disabled>Select network</option>
                        <option value='0x7a69'>Localhost</option>
                        <option value='0x5'>Goerli</option>
                    </select>
                }
            </div>

            <div className='exchange__header--account flex'>
                <p><small>My Balance</small>{
                    balance 
                    ? Number(balance).toFixed(4) 
                    : 0
                } ETH</p>
                {
                    account ? (   
                    <a 
                        href={
                            config[chainId] ?
                            `${config[chainId].explorerURL}address/${account}`:
                            '#'
                        }
                        target='_blank'
                        rel='noreferrer'
                    >
                        {account.slice(0,5) + '...' + account.slice(38,42)}
                        <Blockies               
                            seed={account}
                            size={10}
                            scale={3}
                            color="#2187D0"
                            bgColor="#F1F2F9"
                            spotColor="#767F92"
                            className="identicon"
                        />
                    </a>    
                    ) : (
                        <button 
                            className='button'
                            onClick={connectHandler}
                        >
                            Connect
                        </button>
                    ) 
                }

            </div>
        </div>
    )
}

export default Navbar