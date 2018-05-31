/**
 * Home Container
 */

import React, { Component } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Image,
  Clipboard,
  Modal,
  Dimensions
} from 'react-native';
import {
    Container,
    Header,
    HeaderLeft,
    HeaderRight,
    Content,
    Icon,
    Text,
    Button,
    Loader,
    WalletMenu,
    WalletFooter,
    Toast
} from '@components';
import Camera from 'react-native-camera';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { ActionCreators } from '@actions';
import * as Validation from '@lib/validation';
import * as utils from '@lib/utils';
import * as constants from '@src/constants';
import { PROFILE_URL } from '@src/config';
import Premium from 'Premium';

const { width } = Dimensions.get('window');
const styles = require("@styles/send");

class Send extends Component<{}> {

    static navigationOptions = {
        header: null,
    }

    componentWillReceiveProps(nextProps){
        if(nextProps){
            if(nextProps.sendTxnSuccess){
                this.setState({sendTxnSuccess:nextProps.sendTxnSuccess, visibleMsg: true, isConfirm: false});
                this.props.resetMessages();
            }
            if(nextProps.search_wallet && this.state.term &&
                this.state.term.toLowerCase() == nextProps.search_wallet.email.toLowerCase()){
                this.setState({
                    isVerify:true,
                    search_wallet:nextProps.search_wallet,
                    publicAddress:nextProps.search_wallet.address
                });
            }
            if(!nextProps.loading && this.props.loading !== nextProps.loading){
                this.resetState();
            }
            if(nextProps.decryptedWallets && this.props.decryptedWallets !== nextProps.decryptedWallets){
                this.sendMoney(true);
            }
        }
    }

    constructor(props) {
        super(props);
        let publicAddress = !!props.navigation.state.params?
            props.navigation.state.params.publicAddress: null;
        this.state = {
            term: publicAddress || null,
            publicAddress: publicAddress || null,
            fee: utils.calcFee(0,this.props.currency_type, this.props.bcMedianTxSize,
                this.props.satoshiPerByte, this.props.fixedTxnFee),
            fiat_amount_fee: 0,
            isVerify: false,
            isAmtVerify: false,
            isAddressVerify: false,
            search_wallet: null,
            sendTxnSuccess: null,
        };
    }

    componentDidMount(){

        if(this.props.currency_type !== constants.CURRENCY_TYPE.FLASH && this.props.currency_type !== constants.CURRENCY_TYPE.DASH){
            this.props.setBcMedianTxSize();
            this.props.setSatoshiPerByte();
        }
        if(this.props.currency_type !== constants.CURRENCY_TYPE.FLASH)
            this.props.setThresholdAmount();

        if(this.props.currency_type === constants.CURRENCY_TYPE.DASH)
            this.props.setFixedTxnFee();

        // this.refs._input_fiat_amount.focus();
    }

    resetState(){
        this.setState({
            term:'',
            amount:'',
            fiat_amount:'',
            note:'',
            fee: utils.calcFee(0,this.props.currency_type, this.props.bcMedianTxSize,
                this.props.satoshiPerByte, this.props.fixedTxnFee),
            fiat_amount_fee: 0,
            isVerify: false,
            isAddressVerify: false,
            isAmtVerify: false,
            search_wallet: null,
            publicAddress: null,
            errorMsg: null,
        });
    }

    verifyAmount(){
        this.setState({isAmtVerify: false});
        if(!this.state.amount) return false;
        let amount = utils.toOrginalNumber(this.state.amount);
        let fiat_amount = utils.toOrginalNumber(this.state.fiat_amount);
        let res = Validation.amount(amount);
        if(!res.success){
            return Toast.errorTop(res.message);
        }
        this.setState({
            isAmtVerify: true,
            amount:utils.formatAmountInput(res.amount),
            fiat_amount: utils.formatAmountInput(fiat_amount),
            fee: utils.calcFee(res.amount, this.props.currency_type,
                this.props.bcMedianTxSize, this.props.satoshiPerByte, this.props.fixedTxnFee)
        });
    }

    verifyAddress(){
        if(this.state.term === this.props.profile.email ||
            this.state.term === this.props.wallet_address) return false;
        if(this.state.search_wallet &&
            this.state.search_wallet.email === this.state.term) return false;

        this.setState({isVerify:false, isAddressVerify:false,
            search_wallet:null, publicAddress: null});

        if(!this.state.term) return false;

        let res = Validation.email(this.state.term);
        if(res.success){
            return this.props.searchWallet(this.state.term);
        }

        res =Validation.cryptoAddress(this.state.term, this.props.currency_type);
        if(!res.success){
            return Toast.errorTop("Address is invalid!");
        }else{
            this.setState({isAddressVerify:true, publicAddress: this.state.term});
        }
    }

    confirmRequest(){
        if(!this.state.isVerify && !this.state.isAddressVerify){
            return Toast.errorTop("Address is invalid!");
        }
        let amount = utils.toOrginalNumber(this.state.amount);
        if(!this.state.isAmtVerify){
            let res = Validation.amount(amount);
            if(!res.success){
                return Toast.errorTop(res.message);
            }
            amount = utils.toOrginalNumber(res.amount);
            this.setState({isAmtVerify: true, amount});
        }
        if(!amount.toString().match(/^(\d+\.?\d*|\.\d+)$/)){
            return Toast.errorTop("Amount must be a number");
        }
        let fee = utils.calcFee(amount, this.props.currency_type,
            this.props.bcMedianTxSize, this.props.satoshiPerByte, this.props.fixedTxnFee);

        if(this.props.currency_type === constants.CURRENCY_TYPE.FLASH){
            if(amount < 1){
                return Toast.errorTop("Amount must be at least 1");
            }
            if(utils.flashToSatoshi(amount+fee) > this.props.balance){
                return Toast.errorTop("You do not have enough fee to make this payment");
            }
        }else{
            if(amount < this.props.thresholdAmount){
                return Toast.errorTop("Amount is less than threshold value");
            }
            if((amount+fee) > this.props.balance){
                return Toast.errorTop("You do not have enough fee to make this payment");
            }
        }

        let fiat_amount_fee = utils.toOrginalNumber(
            utils.cryptoToOtherCurrency(fee, this.props.fiat_per_value, 0)
        );

        this.setState({visible:true, fee, fiat_amount_fee});
    }

    sendMoney(force=false){
        if(!force && !this.props.decryptedWallets)
            return this.setState({visible:false, visibleGetPassword: true, password: '', errorMsg: ''});
        if(!this.state.isConfirm) return ;
        this.setState({visible:false, visibleGetPassword:false, isConfirm: false}, ()=>{
            let receiver_bare_uid =
                this.state.search_wallet?
                this.state.search_wallet.email:null;
            let receiver_id =
                this.state.search_wallet?
                this.state.search_wallet.username:null;
            let amount = utils.toOrginalNumber(this.state.amount);
            let fee = utils.toOrginalNumber(this.state.fee);
            this.props.rawTransaction(amount, fee, this.state.publicAddress,
                this.state.note, receiver_bare_uid, receiver_id);
        })
    }

    decryptWallets(){
        if(!this.state.password){
            return this.setState({errorMsg:'Password is invalid!'});
        }

        try{
            Premium.xaesDecrypt(this.state.password, this.props.profile.privateKey);
        }catch(e){
            return this.setState({errorMsg:'Password is invalid!'});
        }
        this.props.customAction({loading:true});
        this.setState({visibleGetPassword:false, errorMsg:''},()=>
            setTimeout(()=>this.props.decryptWallets(this.state.password,true),0));
    }

    onBarCodeRead(e){
        this.setState({scanQR:false});
        let data = e.data;
        let amount = null;
        if(!data){
            Toast.errorTop('Invalid qr code!');
            return false;
        }

        let containsColumn = data.indexOf(':');
        if (containsColumn >= 0) {
            data = data.substring(containsColumn + 1, data.length);
        }

        //check for qt wallet
        let containsQueMark = data.indexOf('?');
        if (containsQueMark >= 0) {
            data = data.substring(0, containsQueMark);
        }

        if(data.length < 25 || data.length > 34){
            Toast.errorTop('Invalid qr code!');
            return false;
        }

        this.setState({term:data},this.verifyAddress);

        //check for amount
        let containsAmtMark = e.data.indexOf('amount=');
        if(containsAmtMark > 0){
            amount = e.data.substring(containsAmtMark+7);
            let containsAndMark = amount.indexOf('&');
            if(containsAndMark > -1){
                amount = amount.substring(0,containsAndMark);
            }
        }
        if(amount !== null){
            amount = utils.toOrginalNumber(amount);
            let fiat_amount = utils.toOrginalNumber(
                utils.cryptoToOtherCurrency(amount, this.props.fiat_per_value, 0)
            );
            this.setState({
                fiat_amount: fiat_amount>0?utils.formatAmountInput(fiat_amount):'',
                amount: amount>0?utils.formatAmountInput(amount):''
            });
        }

    }

    render() {
        return (
            <Container>
                <Header>
                    <HeaderLeft>
                        <TouchableOpacity>
                            <Icon onPress={()=>this.props.navigation.goBack()}
                                style={styles.headerBackIcon} name='angle-left' />
                        </TouchableOpacity>
                    </HeaderLeft>
                    <View style={styles.walletHeader}>
                        <Text style={styles.walletLabel}>Send</Text>
                        <Text style={styles.walletConversionRate}>{
                            utils.getCurrencySymbol(this.props.fiat_currency) + ' ' +
                            utils.flashNFormatter(this.props.fiat_per_value,2) + ' per ' +
                            utils.getCurrencyUnitUpcase(this.props.currency_type)}
                        </Text>
                    </View>
                    <HeaderRight>
                        <TouchableOpacity>
                            <Icon style={[styles.headerFAIcon,{paddingLeft:15}]}
                                onPress={()=>this.setState({showMenu: !this.state.showMenu})}
                                name='ellipsis-v' />
                        </TouchableOpacity>
                        {this.props.totalPending>0 && !this.state.showMenu?<View style={styles.badge}>
                            <Text style={styles.badgeText}>{this.props.totalPending}</Text>
                        </View>:null}
                    </HeaderRight>
                </Header>
                <Content bounces={false}>
                    <View style={styles.walletBalanceTab}>
                        <Text style={styles.walletBalanceLabel}>Balance</Text>
                        <TouchableOpacity style={styles.walletBalanceDetail}>
                            <Text style={styles.walletBalance}>{
                                utils.getCurrencyUnitUpcase(this.props.currency_type) + ' ' +
                                utils.flashNFormatter((this.props.currency_type == constants.CURRENCY_TYPE.FLASH?
                                    utils.satoshiToFlash(this.props.balance).toFixed(10):this.props.balance),2)}
                            </Text>
                            <Icon style={styles.exchangeIcon} name='exchange' />
                            <Text style={styles.walletBalanceInFiatCurrency}>{
                                utils.getCurrencySymbol(this.props.fiat_currency) + ' ' +
                                utils.flashNFormatter(this.props.fiat_balance,2)}
                            </Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.requestBox}>
                        <Text style={styles.requestRowLabel}>Amount</Text>
                        <View style={styles.hr}/>
                        <View style={[styles.requestRowInputBox,{flexDirection: 'row'}]}>
                            <View style={styles.requestRowAmtLabelBox}>
                                <Text style={styles.requestRowAmtLabel}>{utils.getFiatCurrencyUnit(this.props.fiat_currency)}</Text>
                            </View>
                            <TextInput
                                ref={'_input_fiat_amount'}
                                underlineColorAndroid='transparent'
                                style={[styles.requestRowInput,{paddingLeft:10}]}
                                keyboardType='numeric'
                                returnKeyType='next'
                                onSubmitEditing={()=>this.refs._input_term.focus()}
                                placeholder={'Enter amount in '+utils.getFiatCurrencyUnit(this.props.fiat_currency)}
                                value={this.state.fiat_amount || ''}
                                onBlur={this.verifyAmount.bind(this)}
                                onChangeText={(fiat_amount) => this.setState({fiat_amount},()=>{
                                    fiat_amount = utils.toOrginalNumber(fiat_amount);
                                    if(isNaN(fiat_amount)) fiat_amount=0;
                                    let amount = utils.toOrginalNumber(
                                        utils.otherCurrencyToCrypto(fiat_amount, this.props.fiat_per_value)
                                    );
                                    this.setState({
                                        amount: amount>0?utils.formatAmountInput(amount):'',
                                    });
                                })}
                            />
                        </View>
                        <View style={[styles.requestRowInputBox,{flexDirection: 'row', marginTop:5}]}>
                            <View style={styles.requestRowAmtLabelBox}>
                                <Text style={styles.requestRowAmtLabel}>{utils.getCurrencyUnitUpcase(this.props.currency_type)}</Text>
                            </View>
                            <TextInput
                                ref={'_input_amount'}
                                underlineColorAndroid='transparent'
                                style={[styles.requestRowInput,{paddingLeft:10}]}
                                keyboardType='numeric'
                                returnKeyType='next'
                                onSubmitEditing={()=>this.refs._input_term.focus()}
                                placeholder={'Enter amount in '+utils.getCurrencyUnitUpcase(this.props.currency_type)}
                                value={this.state.amount || ''}
                                onBlur={this.verifyAmount.bind(this)}
                                onChangeText={(amount) => this.setState({amount},()=>{
                                    amount = utils.toOrginalNumber(amount);
                                    if(isNaN(amount)) amount=0;
                                    let fiat_amount = utils.toOrginalNumber(
                                        utils.cryptoToOtherCurrency(amount, this.props.fiat_per_value, 0)
                                    );
                                    this.setState({
                                        fiat_amount: fiat_amount>0?utils.formatAmountInput(fiat_amount):''
                                    });
                                })}
                            />
                        </View>
                        <Text style={styles.requestRowLabel}>Fee</Text>
                        <View style={styles.hr}/>
                        <View style={[styles.requestRowInputBox,{flexDirection: 'row',backgroundColor: '#EDEDED'}]}>
                            <View style={styles.requestRowAmtLabelBox}>
                                <Text style={styles.requestRowAmtLabel}>{utils.getCurrencyUnitUpcase(this.props.currency_type)}</Text>
                            </View>
                            <TextInput
                                editable={false}
                                underlineColorAndroid='transparent'
                                style={[styles.requestRowInput,{paddingLeft:10}]}
                                placeholder='Transaction Fee'
                                value={this.state.fee.toString()}
                            />
                        </View>
                        <Text style={styles.requestRowLabel}>Email / Public address</Text>
                        <View style={styles.hr}/>
                        <View style={styles.requestRowInputBox}>
                            <TextInput
                                ref={'_input_term'}
                                underlineColorAndroid='transparent'
                                style={styles.requestRowInput}
                                keyboardType='email-address'
                                returnKeyType='next'
                                placeholder='Enter email or public address'
                                value={this.state.term}
                                onBlur={this.verifyAddress.bind(this)}
                                onSubmitEditing={()=>this.refs._input_note.focus()}
                                onChangeText={(term) => this.setState({term})}
                            />
                            {this.state.isVerify || this.state.isAddressVerify?
                                <Icon style={{
                                    color: 'green',
                                    fontSize: 30,
                                    position: 'absolute',
                                    right: 7,
                                    top :6
                                }} name='check-circle-o' />:null}
                        </View>
                        <View style={styles.requestRowActionLinkTab}>
                            <TouchableOpacity style={styles.requestRowActionLink}
                                onPress={async()=>{
                                    let term = await Clipboard.getString();
                                    if(term)this.setState({term});
                                }}>
                                <Icon style={styles.requestRowActionLinkIcon} name='paste'/>
                                <Text  style={styles.requestRowActionLinkLabel}>Paste from Clipboard</Text>
                            </TouchableOpacity>
                            <Text  style={styles.requestRowActionLinkDiv}> / </Text>
                            <TouchableOpacity style={styles.requestRowActionLink}
                                onPress={()=>this.setState({scanQR:true})}>
                                <Icon style={styles.requestRowActionLinkIcon} name='qrcode'/>
                                <Text  style={styles.requestRowActionLinkLabel}>Scan QR Code</Text>
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.requestRowLabel}>Note</Text>
                        <View style={styles.hr}/>
                        <View style={[styles.requestRowInputBox,{height: 60}]}>
                            <TextInput
                                ref={'_input_note'}
                                multiline = {true}
                                numberOfLines = {2}
                                returnKeyType='done'
                                underlineColorAndroid='transparent'
                                style={styles.requestRowInput}
                                placeholder={'Enter note (optional)'}
                                value={this.state.note || ''}
                                onChangeText={(note) => note.length <= 50 &&
                                    this.setState({note})}
                            />
                        </View>
                        <Text style={styles.requestRowNote}>Max Characters 50</Text>
                        <Button value='Send' onPress={this.confirmRequest.bind(this)}
                            style={{width: 150, alignItems:'center', marginTop:5}}/>
                    </View>
                </Content>
                <WalletMenu onPress={()=>this.setState({showMenu:false})}
                    selected='Send'
                    visible={this.state.showMenu}
                    badgePending={this.props.totalPending}
                    navigation={this.props.navigation} />
                <WalletFooter selected='Send' navigation={this.props.navigation} />
                <Loader show={this.props.loading} />
                <Modal
                    transparent={true}
                    visible={!!this.state.visible}
                    onRequestClose={()=>this.setState({visible:false})}>
                    <View style={styles.reqDetailModal}>
                        <View style={styles.reqDetailBox}>
                            <View style={styles.reqDetailHeader}>
                                <Text style={styles.reqDetailTitle}>Confirm Transaction</Text>
                                <Text style={styles.reqDetailCloseIcon}
                                    onPress={()=>this.setState({visible:false})} >X</Text>
                            </View>
                            <View style={styles.reqDetailBody}>
                                <Text style={styles.reqAmtText}>{this.state.amount} {utils.getCurrencyUnitUpcase(this.props.currency_type)}</Text>
                                <Text style={styles.reqFiatAmtText}>≈ {utils.getCurrencySymbol(this.props.fiat_currency)} {this.state.fiat_amount}</Text>
                                <Text style={styles.reqFeeText}>
                                    + {this.state.fee} {utils.getCurrencyUnitUpcase(this.props.currency_type)+' '}
                                    ({utils.getCurrencySymbol(this.props.fiat_currency)} {this.state.fiat_amount_fee}) transaction fee
                                </Text>
                                <Icon style={styles.reqDownArrow} name='arrow-down'/>
                                <View style={styles.reqDetailRow}>
                                    <Image style={styles.reqDetailIcon}
                                        source={this.state.search_wallet && this.state.search_wallet.profile_pic_url?
                                            {uri:PROFILE_URL+this.state.search_wallet.profile_pic_url}:
                                            utils.getCurrencyIcon(this.props.currency_type)} />
                                    <View>
                                        {this.state.search_wallet?
                                            <Text style={styles.reqDetailText}>
                                                {this.state.search_wallet.display_name}
                                            </Text>:null
                                        }
                                        <Text style={[styles.reqDetailText,{maxWidth: width - 150}]}>
                                            {this.state.term}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                            <View style={{flexDirection:'row'}}>
                                <Button
                                    onPress={()=>this.setState({visible:false})}
                                    style={[styles.reqBtn,{backgroundColor: '#EFEFEF'}]}
                                    textstyle={[styles.reqBtnLabel,{color:'#333'}]}
                                    value='Cancel' />
                                <Button
                                    onPress={()=>this.setState({isConfirm: true},this.sendMoney.bind(this))}
                                    style={styles.reqBtn}
                                    textstyle={styles.reqBtnLabel}
                                    value='Send' />
                            </View>
                        </View>
                    </View>
                </Modal>
                <Modal
                    transparent={true}
                    visible={!!this.state.visibleGetPassword}
                    onRequestClose={()=>this.setState({visibleGetPassword:false})}>
                    <View style={styles.reqDetailModal}>
                        <View style={styles.reqDetailBox}>
                            <View style={styles.reqDetailHeader}>
                                <Text style={styles.reqDetailTitle}>Password</Text>
                                <Text style={styles.reqDetailCloseIcon}
                                    onPress={()=>this.setState({visibleGetPassword:false})}>X</Text>
                            </View>
                            <View style={styles.reqDetailBody}>
                                <Text style={{
                                    fontSize: 15,
                                    color: '#333',
                                    textAlign: 'center',
                                    marginBottom: 15,
                                }}>
                                    For additional security check, Please enter your password.
                                </Text>
                                <View style={styles.requestRowInputBox}>
                                    <TextInput
                                        underlineColorAndroid='transparent'
                                        style={styles.requestRowInput}
                                        secureTextEntry={true}
                                        placeholder={'Enter your password'}
                                        value={this.state.password || ''}
                                        onChangeText={(password) => this.setState({password})}
                                        onSubmitEditing={this.decryptWallets.bind(this)}
                                    />
                                </View>
                                {!!this.state.errorMsg?<Text style={{
                                    fontSize: 15,
                                    color: 'red',
                                    paddingHorizontal: 10,
                                    marginTop: 5,
                                }}>{this.state.errorMsg}</Text>:null}
                            </View>
                            <View style={{flexDirection:'row'}}>
                                <Button
                                    onPress={()=>this.setState({visibleGetPassword:false})}
                                    style={[styles.reqBtn,{backgroundColor: '#EFEFEF'}]}
                                    textstyle={[styles.reqBtnLabel,{color:'#333'}]}
                                    value='Cancel' />
                                <Button
                                    onPress={this.decryptWallets.bind(this)}
                                    style={styles.reqBtn}
                                    textstyle={styles.reqBtnLabel}
                                    value='Send' />
                            </View>
                        </View>
                    </View>
                </Modal>
                <Modal
                    transparent={true}
                    visible={!!this.state.visibleMsg}
                    onRequestClose={()=>this.setState({visibleMsg:false})}>
                    <View style={styles.reqDetailModal}>
                        <View style={styles.reqDetailBox}>
                            <View style={styles.reqDetailHeader}>
                                <Text style={styles.reqDetailTitle}>Transaction Successful</Text>
                                <Text style={styles.reqDetailCloseIcon}
                                    onPress={()=>this.setState({visibleMsg:false})}>X</Text>
                            </View>
                            <View style={styles.reqDetailBody}>
                                <Text style={{
                                    fontSize: 15,
                                    color: '#333',
                                    marginBottom: 25,
                                }}>
                                    {this.props.currency_type === constants.CURRENCY_TYPE.FLASH?
                                    ('Processing time: '+(this.state.sendTxnSuccess?
                                            Number(this.state.sendTxnSuccess.processing_duration)
                                            .toFixed(3):'0.000')+" second(s)\n\n"):''}
                                    Your transaction will appear in your activity tab shortly.
                                </Text>
                                <Button
                                    onPress={()=>this.setState({visibleMsg:false,sendTxnSuccess:null, isConfirm: false})}
                                    style={styles.reqBtn}
                                    textstyle={styles.reqBtnLabel}
                                    value='Close' />
                            </View>
                        </View>
                    </View>
                </Modal>
                <Modal
                    transparent={true}
                    visible={!!this.state.scanQR}
                    onRequestClose={()=>this.setState({scanQR:false})}>
                    <View style={styles.content}>
                        <Camera
                            ref={(cam) => {
                                this.camera = cam;
                            }}
                            onBarCodeRead={this.onBarCodeRead.bind(this)}
                            notAuthorizedView={
                                <View style={styles.notAuthorizedView}>
                                    <Text  style={styles.notAuthorizedViewText}>
                                        Need permission to access Camera,{"\n"}
                                        Please go to <Text style={{fontWeight: 'bold'}}>Settings</Text> and allow{"\n"}
                                        <Text style={{fontWeight: 'bold', color:'#E0AE27'}}>FLASH</Text> to access Camera
                                    </Text>
                                    <Button
                                        style={{marginTop:15}}
                                        onPress={()=>Linking.openURL('app-settings:')}
                                        value="Go to Settings"/>
                                </View>
                            }
                            style={styles.preview}
                            aspect={Camera.constants.Aspect.fill}>
                            <Image style={styles.scanQRBoxImg} source={require('@images/scan-qr.png')} />
                        </Camera>
                    </View>
                </Modal>
            </Container>
        );
    }
}

function mapStateToProps({params}) {
    return {
        loading: params.loading,
        search_wallet: params.search_wallet || null,
        profile: params.profile || null,
        balance: params.balance || 0,
        currency_type: params.currency_type,
        fiat_currency: params.fiat_currency,
        fiat_balance: params.fiat_balance,
        fiat_per_value: params.fiat_per_value,
        bcMedianTxSize: params.bcMedianTxSize,
        satoshiPerByte: params.satoshiPerByte,
        thresholdAmount: params.thresholdAmount,
        fixedTxnFee: params.fixedTxnFee,
        wallet_address: params.wallet_address || null,
        sendTxnSuccess: params.sendTxnSuccess || null,
        decryptedWallets: params.decryptedWallets || null,
        totalPending: params.totalPending
    };
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators(ActionCreators, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(Send);
