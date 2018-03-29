/**
 * My Account Navigation Component
 */

import React from 'react';
import {
    View,
    Text,
    Platform
} from 'react-native';
import {
    TabNavigator,
    TabBarTop,
    NavigationActions
} from 'react-navigation';
import {
    Container,
    Content,
    Header,
    HeaderLeft,
    HeaderTitle,
    HeaderRight,
    Icon,
} from '@components';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { ActionCreators } from '@actions';

import Profile from './Profile';
import Fountain from './Fountain';
import SecurityQuestion from './SecurityQuestion';
import Settings from './Settings';

const styles = require("@styles/myAccount");

const TabNav = TabNavigator({
    Profile: { screen: Profile },
    // Fountain: { screen: Fountain },
    // 'Security Question': { screen: SecurityQuestion },
    Settings: { screen: Settings },
},{
    navigationOptions: ({ navigation }) => ({
    }),
    tabBarOptions: {
        activeTintColor: '#E0AE27',
        indicatorStyle:{
            backgroundColor: '#E0AE27',
            height: 3,
        },
        style: {
            backgroundColor: '#191714',
            ...Platform.select({
                ios: {
                    shadowColor: 'rgba(0,0,0, 0.5)',
                    shadowOffset: { height: 1, width: 0 },
                    shadowOpacity: 0.7,
                },
                android: {
                    elevation: 10,
                },
            }),
        },
        labelStyle: {
            fontSize: 16,
            fontFamily: 'Microsoft Tai Le',
        },
    },
    showIcon: false,
    tabBarComponent: TabBarTop,
    tabBarPosition: 'top',
    animationEnabled: true,
    swipeEnabled: true,
});

class MyAccount extends React.Component {
    static navigationOptions = {
        header: null,
    }

    constructor(props) {
        super(props);
    }

    render() {
        return (
            <View style={{
                flex: 1,
                ...Platform.select({
                    ios: {
                        paddingTop: 77,
                    },
                    android: {
                        paddingTop: 55
                    },
                }),
            }}>
                <Header>
                    <HeaderLeft>
                        <Icon onPress={()=>this.props.navigation.goBack()} style={styles.headerBackIcon} name='angle-left' />
                    </HeaderLeft>
                    <HeaderTitle>My Account</HeaderTitle>
                    <HeaderRight>
                        <Icon style={styles.headerFAIcon} onPress={this.props.logout} name='power-off' />
                    </HeaderRight>
                </Header>
                <TabNav />
            </View>
        );
    }
}

function mapStateToProps({params}) {
  return {
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(ActionCreators, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(MyAccount);
