/**
 * Outgoing Requests Container Tab
 */

import React, { Component } from 'react';
import {
  View,
  FlatList,
  RefreshControl
} from 'react-native';
import {
    Loader,
    Button,
    Text,
    RequestTab
} from '@components';
import moment from 'moment-timezone';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { ActionCreators } from '@actions';

class OutgoingRequests extends Component<{}> {

    static navigationOptions = ({ navigation, screenProps }) =>{
        return ({
            title:'Outgoing'+(screenProps.outReqs_total > 0?` (${screenProps.outReqs_total})` :''),
        })
    }

    constructor(props) {
        super(props);
        this.state = {};
    }

    markCancelledMoneyRequests(req){
        this.props.markCancelledMoneyRequests(req.id,req.receiver_email);
    }

    render() {
        const styles = (this.props.nightMode?require('@styles/nightMode/pending'):require('@styles/pending'));
        return (
            <View style={{flex:1}}>
                <FlatList
                    refreshControl={
                        <RefreshControl
                            colors={['#191714']}
                            tintColor='#191714'
                            refreshing={false}
                            onRefresh={()=>this.props.getOutgoingRequests(0,true)}/>
                    }
                    style={styles.reqList}
                    showsVerticalScrollIndicator={false}
                    data={this.props.reqs}
                    keyExtractor={(req, index) => (index+'_'+req.id)}
                    onEndReachedThreshold={5}
                    onEndReached={()=>(this.props.reqs.length < this.props.total_reqs) &&
                        this.props.getOutgoingRequests(this.props.reqs.length)}
                    renderItem={({item, index})=>
                        <RequestTab
                            outgoing={true}
                            timezone={this.props.timezone}
                            req={item}
                            nightMode={this.props.nightMode}
                            fiat_currency={this.props.fiat_currency}
                            fiat_per_value={this.props.fiat_per_value}
                            onCancel={this.markCancelledMoneyRequests.bind(this)}
                            style={[!index && {marginTop:10}]} />
                    }
                    ListEmptyComponent={()=>
                        <View>
                            <Text style={styles.reqListEmpty}>
                                There are no request in this date range.
                            </Text>
                            <Button value='Show All Requests'
                                onPress={()=>this.props.updateRequestReportDate(this.props.minDate,
                                    this.props.maxDate)}/>
                        </View>
                    }
                />
                <Loader show={this.props.loading} />
            </View>
        );
    }
}

function mapStateToProps({params}) {
  return {
      reqs: params.outReqs || [],
      fiat_currency: params.fiat_currency,
      fiat_balance: params.fiat_balance,
      fiat_per_value: params.fiat_per_value,
      total_reqs: params.outReqs_total || 0,
      loading: params.outReqs_loading || params.loading,
      timezone: params.profile.timezone || moment.tz.guess(),
      minDate: moment(params.profile.created_ts),
      maxDate: moment(),
      nightMode: params.nightMode,
  };
}


function mapDispatchToProps(dispatch) {
  return bindActionCreators(ActionCreators, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(OutgoingRequests);
