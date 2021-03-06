import {
    AsyncStorage
} from 'react-native';
import PushNotification from 'react-native-push-notification';
import * as types from '@actions/types';
import * as constants from '@src/constants';
import apis from '@flashAPIs';
import * as Request from '@actions/request';
import * as Transactions from '@actions/transactions';
import * as Account from '@actions/account';

export const getMessages = () => {
    return (dispatch,getState) => {
        let params = getState().params;
        let date_from = params.last_message_datetime;
        apis.getMessages(params.profile.auth_version, params.profile.sessionToken, date_from).then((d)=>{
            if(d.rc == 1 && d.messages && d.messages.length > 0){
                d.messages.forEach(msg=>{
                    let last_message_datetime = new Date(msg.created_ts).getTime()
                    if(date_from < last_message_datetime){
                        date_from = last_message_datetime;
                        dispatch({
                            type: types.GET_MESSAGES,
                            payload: {
                                last_message_datetime
                            }
                        });
                        AsyncStorage.setItem('last_message_datetime',last_message_datetime.toString())
                    }

                    let message = JSON.parse(msg.message_content);
                    switch (msg.message_type) {
                        case constants.KEYS_ADD_MONEY_REQ_RECV:
                            onBeRequested(dispatch, message);
                            break;
                        case constants.KEYS_ADD_TXN_LOG_RECV:
                            onTxAdded(dispatch, message, params);
                            break;
                        case constants.KEYS_MARK_MONEY_REQ_RECV:
                            onRequestStateChanged(dispatch, message);
                            break;
                        default:
                            break;
                    }
                });
            }
        }).catch(e=>{})
    }
}


export const onBeRequested = (dispatch, message) => {
    dispatch(Request.getIncomingRequests(0,true));
    dispatch(Request.getOutgoingRequests(0,true));
    let currencyType = message.currency ? parseInt(message.currency) : constants.CURRENCY_TYPE.FLASH;
    let currency_name = constants.CURRENCY_TYPE_UNIT_UPCASE[currencyType];
    let infoMsg = `${message.email_sender} sent you a request for ${message.amount} ${currency_name}`;
    PushNotification.localNotification({
        message: infoMsg,
    })
}

export const onTxAdded = (dispatch, message, params) => {
    let currencyType = message.currency_type ? parseInt(message.currency_type) : constants.CURRENCY_TYPE.FLASH;
    dispatch(Account.getBalanceV2(currencyType,(params.currency_type == currencyType)));
    if(params.currency_type == currencyType){
        dispatch(Transactions.getRecentTransactions());
        dispatch(Transactions.getAllTransactions(0, true));
        dispatch(Transactions.getSentTransactions(0, true));
        dispatch(Transactions.getReceivedTransactions(0, true));
    }
    if(message.sender_email != params.profile.email){
        let currency_name = constants.CURRENCY_TYPE_UNIT_UPCASE[currencyType];
        let infoMsg = `${message.sender_email} sent you ${message.amount} ${currency_name}`;
        constants.SOUND.RECEIVE.play();
        PushNotification.localNotification({
            message: infoMsg,
            playSound: false,
        })
    }
}

export const onRequestStateChanged = (dispatch, message) => {
    dispatch(Request.getIncomingRequests(0,true));
    dispatch(Request.getOutgoingRequests(0,true));
    let infoMsg = null;
    let playSound = true;
    switch (message.status) {
        case 1:
            infoMsg = 'One request of yours has been paid';
            playSound=false;
            constants.SOUND.RECEIVE.play();
            break;
        case 2:
            infoMsg = 'One request of yours has been rejected';
            break;
        case 3:
            infoMsg = 'A request sent to you has been cancelled';
            break;
        default:
            break;
    }
    if(infoMsg)
        PushNotification.localNotification({
            message: infoMsg,
            playSound
        })
}
