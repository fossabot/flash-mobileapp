/**
 * Home Container
 */

import React, { Component } from 'react';
import {
    View,
    Image,
    Modal,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
} from 'react-native';
import {
    Container,
    Content,
    Header,
    HeaderLeft,
    HeaderRight,
    Icon,
    Text,
} from '@components';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { ActionCreators } from '@actions';
import * as utils from '@lib/utils';
import * as constants from '@src/constants';
const styles = require('@styles/home');

class Home extends Component<{}> {

    static navigationOptions = {
        header: null,
    }

    constructor(props) {
        super(props);
        this.state = {
        };
    }

    componentDidMount(){
        this.refreshingHome();
    }

    refreshingHome(){
        this.props.getBalanceV2(constants.CURRENCY_TYPE.FLASH);
        this.props.getBalanceV2(constants.CURRENCY_TYPE.BTC);
        this.props.getBalanceV2(constants.CURRENCY_TYPE.LTC);
        this.props.getBalanceV2(constants.CURRENCY_TYPE.DASH);
    }

    changeCurrency(currency_type){
        this.props.changeCurrency(currency_type);
        this.props.navigation.navigate('Wallet');
    }

    render() {
        return (
            <Container>
                <Header>
                    <HeaderLeft>
                        <Image style={styles.headerTextLogo} source={require('@images/app-text-icon-white.png')} />
                    </HeaderLeft>
                    <HeaderRight>
                        <View style={styles.headerBalanceBox}>
                            <Text style={styles.headerBalanceLabel}>total assets</Text>
                            <Text style={styles.headerBalance}>{
                                utils.getCurrencySymbol(this.props.fiat_currency) + ' ' +
                                utils.flashNFormatter(this.props.total_fiat_balance,2)}
                            </Text>
                        </View>
                    </HeaderRight>
                </Header>
                <Content contentContainerStyle={{marginHorizontal: 20}}
                    refreshControl={
                        <RefreshControl
                            colors={['#191714']}
                            tintColor='#191714'
                            refreshing={this.props.loading}
                            onRefresh={this.refreshingHome.bind(this)}/>
                    }>
                    <Text style={styles.label}>Wallets</Text>
                    <View style={styles.hr}/>
                    { this.props.balances.map(balance =>
                        <TouchableOpacity activeOpacity={0.5} onPress={()=>this.changeCurrency(balance.currency_type)}
                            key={'_wallet_'+balance.currency_type+'_'+balance.amt}
                            style={[styles.walletTab,{backgroundColor: balance.color}]}>
                            <Image style={styles.walletIcon} source={utils.getCurrencyIcon(balance.currency_type)} />
                            <View style={styles.walletTabDetail}>
                                <View>
                                    <Text style={styles.currencyLabel}>
                                        {utils.getCurrencyName(balance.currency_type)}
                                    </Text>
                                    <Text style={styles.walletConversionRate}>{
                                        utils.getCurrencySymbol(this.props.fiat_currency) + ' ' +
                                        utils.flashNFormatter(balance.per_value,2) + ' / ' +
                                        utils.getCurrencyUnitUpcase(balance.currency_type)}
                                    </Text>
                                </View>
                                <View style={styles.walletBalanceDetail}>
                                    <Text style={styles.walletBalanceInFiatCurrency}>{
                                        utils.getCurrencySymbol(this.props.fiat_currency) + ' ' +
                                        utils.flashNFormatter(balance.amt2,2)}
                                    </Text>
                                    <Text style={styles.walletBalance}>{
                                        utils.getCurrencyUnitUpcase(balance.currency_type) + ' ' +
                                        utils.flashNFormatter((balance.currency_type == constants.CURRENCY_TYPE.FLASH?
                                            utils.satoshiToFlash(balance.amt).toFixed(10):balance.amt),2)}
                                    </Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    )}
                    <Text style={styles.label}>Admin</Text>
                    <View style={styles.hr}/>
                    <TouchableOpacity style={styles.adminTab}
                        onPress={()=>this.setState({changeCurrencyModal: true})}>
                        <View style={styles.adminTabTitle}>
                            <Icon style={[styles.adminTabTitleIcon,{fontSize:20}]} name='money'/>
                            <Text style={styles.adminTabTitleLabel}>Default Currency</Text>
                        </View>
                        <View style={styles.adminTabTitle}>

                            <Text style={styles.adminTabSubTitleLabel}>{
                                constants.FIAT_CURRENCY_UNIT[this.props.fiat_currency]
                            }</Text>
                            <Icon style={styles.adminTabRightIcon} name='angle-right'/>

                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.adminTab}
                        onPress={()=>this.props.navigation.navigate('Profile')}>
                        <View style={styles.adminTabTitle}>
                            <Icon style={styles.adminTabTitleIcon} name='user'/>
                            <Text style={styles.adminTabTitleLabel}>My Profile</Text>
                        </View>
                        <Icon style={styles.adminTabRightIcon} name='angle-right'/>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.adminTab}
                        onPress={()=>this.props.navigation.navigate('Settings')}>
                        <View style={styles.adminTabTitle}>
                            <Icon style={styles.adminTabTitleIcon} name='cog'/>
                            <Text style={styles.adminTabTitleLabel}>Settings</Text>
                        </View>
                        <Icon style={styles.adminTabRightIcon} name='angle-right'/>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.adminTab}
                        onPress={()=>this.props.navigation.navigate('SecurityQuestion')}>
                        <View style={styles.adminTabTitle}>
                            <Icon style={styles.adminTabTitleIcon} name='shield'/>
                            <Text style={styles.adminTabTitleLabel}>Security Questions</Text>
                        </View>
                        <Icon style={styles.adminTabRightIcon} name='angle-right'/>
                    </TouchableOpacity>
                </Content>
                <Modal
                    transparent={true}
                    animationType="slide"
                    visible={!!this.state.changeCurrencyModal}
                    onRequestClose={()=>this.setState({changeCurrencyModal:false})}>
                    <View style={styles.overlayStyle}>
                        <View style={[styles.optionContainer,{height:'80%'}]}>
                            <ScrollView keyboardShouldPersistTaps="always">
                                <View style={{ paddingHorizontal: 10 }}>
                                    {Object.values(constants.FIAT_CURRENCY_NAME).map((cur,index) =>
                                        <TouchableOpacity key={'_que_'+cur+'_'+index}
                                            style={styles.optionStyle}
                                            onPress={()=>{
                                                if(this.props.fiat_currency !== index)
                                                    this.props.changeFiatCurrency(index);
                                                this.setState({changeCurrencyModal:false});

                                            }}>
                                            <Text style={[styles.fiatCurrencyName,
                                                this.props.fiat_currency == index && {fontWeight: '500'} ]}>
                                                {cur+' '}({constants.FIAT_CURRENCY_SYMBOL[index]})
                                            </Text>
                                            <Text style={[styles.fiatCurrencyUnit,
                                                this.props.fiat_currency == index && {fontWeight: '500'} ]}>
                                                {constants.FIAT_CURRENCY_UNIT[index]}
                                            </Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </ScrollView>
                        </View>
                        <View style={styles.cancelContainer}>
                            <TouchableOpacity onPress={()=>this.setState({changeCurrencyModal:false})}>
                                <View style={styles.cancelStyle}>
                                    <Text style={styles.canceTextStyle}>
                                        Cancel
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            </Container>
        );
    }
}

function mapStateToProps({params}) {
    return {
        isLoggedIn: params.isLoggedIn,
        profile: params.profile,
        loading: params.balanceLoader || false,
        errorMsg: params.errorMsg || null,
        successMsg: params.successMsg || null,
        balances: params.balances,
        fiat_currency: params.fiat_currency,
        total_fiat_balance: params.total_fiat_balance,
    };
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators(ActionCreators, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(Home);