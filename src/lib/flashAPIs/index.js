import * as login from './login';
import * as account from './account';
import * as transactions from './transactions';
import * as send from './send';
import * as request from './request';
import * as coinmarketcap from './coinmarketcap';
import * as messages from './messages';
import * as migrateAccount from './migrateAccount';
import * as payoutCode from './payoutCode';
import * as sharingCode from './sharingCode';

module.exports = {
    ...login,
    ...account,
    ...send,
    ...request,
    ...transactions,
    ...coinmarketcap,
    ...messages,
    ...migrateAccount,
    ...payoutCode,
    ...sharingCode,
}
