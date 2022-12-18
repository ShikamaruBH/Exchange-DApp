import config from '../config.json'
import { useDispatch, useSelector } from 'react-redux'
import { loadTokens } from '../store/interactions'

const Markets = () => {
    const chainId = useSelector(state => state.provider.chainId)
    const provider = useSelector(state => state.provider.connection)
    const dispatch = useDispatch()

    const marketHandler = async (e) => {
        await loadTokens(e.target.value.split(','), provider, dispatch)
    }
    return(
        <div className='component exchange__markets'>
          <div className='component__header'>
            <h2>Select Market</h2>
          </div>   
          <hr />
          {
            chainId && config[chainId] ?
            (
                <select
                    name="markets"
                    id="markets"
                    onChange={marketHandler}
                >
                    <option value={`${config[chainId].QUY.address},${config[chainId].WIBU.address}`}>QUY / WIBU</option>
                    <option value={`${config[chainId].QUY.address},${config[chainId].SBH.address}`}>QUY / SBH</option>
                </select>
            ) : (
                <p>No data</p>
            )
          }
        </div>
      )
}

export default Markets