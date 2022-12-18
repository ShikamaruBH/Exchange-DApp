import { useSelector } from 'react-redux';
import Banner from './Banner';
import arrowDown from '../assets/down-arrow.svg'
import arrowUp from '../assets/up-arrow.svg'
import { options, series } from './PriceChart.config';
import Chart from 'react-apexcharts'
import { priceChartSelector } from '../store/selectors';

const PriceChart = () => {
    const account = useSelector(state => state.provider.account)
    const symbols = useSelector(state => state.tokens.symbols)
    const priceChart = useSelector(priceChartSelector)

    return (
      <div className="component exchange__chart">
        <div className='component__header flex-between'>
          <div className='flex'>
  
            <h2>{ symbols && `${symbols[0]}/${symbols[1]}` }</h2>
  
            <div className='flex'>
              {
                priceChart && priceChart.lastPriceChange === '+' ? (
                    <img src={arrowUp} alt="Arrow up" />
                ) : (
                    <img src={arrowDown} alt="Arrow down" />
                )
              }
              <span className='up'>{priceChart && `${priceChart.lastPrice}`}</span>
            </div>
  
          </div>
        </div>
        {/* Price chart goes here */}
        {
            priceChart && account ? (
                <Chart 
                    type='candlestick'
                    options={options}
                    series={priceChart.series ? priceChart.series : series}
                    width='100%'
                    height='100%'
                />
            ) : (
                <Banner text='Please connect to Metamask' />
            )
        }
      </div>
    );
  }
  
  export default PriceChart;