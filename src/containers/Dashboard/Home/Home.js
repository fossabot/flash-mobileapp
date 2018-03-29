/**
 * Home Container
 */

import React, { Component } from 'react';
import {
    View,
    Image,
    Modal,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Dimensions
} from 'react-native';
import {
    Container,
    Content,
    Header,
    HeaderLeft,
    HeaderTitle,
    HeaderRight,
    TransactionTab,
    Icon,
    Button,
    Loader,
    Text,
    Toast,
    QRCode
} from '@components';
import moment from 'moment-timezone';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { ActionCreators } from '@actions';
import { satoshiToFlash, flashNFormatter } from '@lib/utils';
import { PROFILE_URL } from '@src/config';
const { height, width } = Dimensions.get('window');
const styles = require("@styles/home");

class Home extends Component<{}> {

    static navigationOptions = {
        header: null,
    }

    constructor(props) {
        super(props);
        this.state = {};
    }

    componentDidMount(){
        this.props.getBalance();
        this.props.getRecentTransactions();
        this.props.getProfile();
        this.coinmarketcapValue = setInterval(this.props.getCoinMarketCapDetail, 60000);
    }

    componentWillUnMount(){
        clearInterval(this.coinmarketcapValue);
    }

    render() {
        console.log(this.props.txns);
        return (
            <Container>
                <Header>
                    <HeaderLeft>
                        <TouchableOpacity style={{padding:5}} onPress={()=>this.props.navigation.navigate('MyAccount')}>
                            <Image style={{width:34,height:34, borderRadius: 17}}
                                defaultSource={require('@images/user-profile-icon-white.png')}
                                source={this.props.profile.profile_pic_url?
                                    {uri: PROFILE_URL+this.props.profile.profile_pic_url}
                                    :require('@images/user-profile-icon-white.png')}
                            />
                        </TouchableOpacity>
                    </HeaderLeft>
                    <HeaderTitle>
                        <Image style={{resizeMode: 'contain'}}
                            source={require('@images/app-text-icon-white.png')}/>
                    </HeaderTitle>
                    <HeaderRight>
                        <TouchableOpacity>
                            <Icon style={styles.headerFAIcon} onPress={this.props.showQR} name='qrcode' />
                        </TouchableOpacity>
                    </HeaderRight>
                </Header>
                <Content bounces={false}
                    refreshControl={
                        <RefreshControl
                            colors={['#191714']}
                            tintColor='#191714'
                            refreshing={!!this.props.refreshing}
                            onRefresh={()=>this.props.refreshingHome()}/>
                    }>
                    <View style={styles.balanceBox}>
                        <TouchableOpacity style={styles.balanceRefresh} onPress={()=>this.props.getBalance(true)}>
                            {this.props.balanceLoader?<ActivityIndicator size="large" color="#FFFFFF" />:
                            <Icon style={styles.balanceRefreshIcon} name='refresh' />}
                        </TouchableOpacity>
                        <Text style={styles.balanceLabel}>Your Balance</Text>
                        <Text style={styles.balanceText}>{flashNFormatter(satoshiToFlash(this.props.balance),2)} FLASH</Text>
                        <Text style={styles.otherBalanceText}>≈ {this.props.balance_in_btc} BTC</Text>
                        <Text style={styles.otherBalanceText}>≈ {this.props.balance_in_usd} USD</Text>
                    </View>
                    <View style={styles.txnList}>
                        <Text style={styles.recentTxnLabel}>Recent Transactions</Text>
                        {
                            this.props.txns.map((txn,index)=>
                                <TransactionTab txn={txn} key={'_txn_'+txn.transaction_id+'_'+index} />
                            )
                        }
                        {this.props.txns.length == 0?<Text style={styles.txnListEmpty}>
                            There is no recent transactions.
                        </Text>:null}
                        <Loader transparent show={this.props.loading}/>
                    </View>
                </Content>
                <Modal
                    transparent={true}
                    visible={this.props.show_qr}
                    onRequestClose={this.props.hideQR}>
                    <View style={styles.qrCodeModal}>
                        <Text style={styles.qrCodeModalTitle}>Wallet Address</Text>
                        <View style={{
                            borderWidth: 10,
                            borderColor: '#FFFFFF',
                        }}>
                            <QRCode
                                value={'flashcoin:'+this.props.wallet_address}
                                size={width-80}
                                bgColor='#191714'
                                fgColor='#FFFFFF'/>
                        </View>
                        <View style={styles.qrCodeModalWalletAddress}>
                            <Text selectable={true} style={styles.qrCodeModalWalletAddressText}>
                                {this.props.wallet_address}
                            </Text>
                        </View>
                        <View>
                            <Button onPress={this.props.hideQR} style={styles.qrCodeModalCloseBtn} value='Close' />
                        </View>
                    </View>
                </Modal>
            </Container>
        );
    }
}

function mapStateToProps({params}) {
    return {
        profile: params.profile,
        loading: params.recentTxns_loading || false,
        balanceLoader: params.balanceLoader || false,
        refreshing: params.refreshingHome || false,
        isLoggedIn: params.isLoggedIn,
        errorMsg: params.errorMsg || null,
        successMsg: params.successMsg || null,
        currency_type: params.currency_type,
        balance: params.balance || 0,
        txns: params.recentTxns || [],
        wallet_address: params.wallet_address || null,
        show_qr: params.show_qr || false,
        balance_in_btc: params.balance_in_btc || '0.00000000',
        balance_in_usd: params.balance_in_usd || '0.00000000',
    };
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators(ActionCreators, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(Home);
