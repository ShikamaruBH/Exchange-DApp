import { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { myEventsSelector } from "../store/selectors";
import config from '../config.json'

const Alert = () => {
    const isPending = useSelector(state => state.exchange.transaction.isPending)
    const isSuccessful = useSelector(state => state.exchange.transaction.isSuccessful)
    const isError = useSelector(state => state.exchange.transaction.isError)
    const account = useSelector(state => state.provider.account)
    const chainId = useSelector(state => state.provider.chainId)
    const alertRef = useRef(null)
    const events = useSelector(myEventsSelector)
    const explorerURL = config[chainId] ? config[chainId].explorerURL : '#'

    const alertHandler = () => {
        alertRef.current.className = 'alert alert--remove'
    }

    useEffect(() => {
        if ((isPending || isSuccessful || isError || events[0]) && account)
            alertRef.current.className = 'alert'
    }, [isPending, isSuccessful, isError, account, events])

    return (
        <div className="alert alert--remove" onClick={alertHandler} ref={alertRef}>
        {
            isPending ? (
                <h1>Transaction Pending...</h1>
            ) : isError ? (
                <h1>Transaction Will Fail</h1>
            ) : isSuccessful && events[0] ? (
                <div>
                    <h1>Transaction Successful</h1>
                    <a
                        href={`${explorerURL}tx/${events[0].transactionHash}`}
                        target='_blank'
                        rel='noreferrer'
                    >
                        {events[0].transactionHash.slice(0,6) + '...' + events[0].transactionHash.slice(60,66)}
                    </a>
                </div>
            ) : (
                <div></div>
            )
        }
        </div>
    );
}

export default Alert;