import env from '../../env.js';
import Mikrotik from '../api/mikrotik.js';
import {countDupsBy} from '../helpers/object.js';
import {getCurrentFilename} from '../helpers/paths.js';

const DOMAINS_INCLUDES_TOVPN_LIST = [
    'facebook',
    'fbcdn',
    'instagram',
    'twimg',
    'twitter',
];

export default {
    name: getCurrentFilename(import.meta.url),
    help: 'ip/dns/cache',
    labelNames: ['type', 'record'],

    async collect(ctx) {
        ctx.reset();

        const [
            ipFirewallAddressList,
            ipDnsCache,
        ] = await Promise.all([
            Mikrotik.ipFirewallAddressList(),
            Mikrotik.ipDnsCache(),
        ]);

        const dnsCacheTypes = {};
        const dnsCacheDomainsToVpn = {};

        ipDnsCache.forEach(elem => {
            elem.type && countDupsBy(elem.type, dnsCacheTypes);
        });

        ipDnsCache.forEach(elem => {
            if (
                DOMAINS_INCLUDES_TOVPN_LIST.some(domain => elem.name.includes(domain))
                && !ipFirewallAddressList.some(list => list.list === env.mikrotik.toVpnList && list.address === elem.name)
            ) {
                countDupsBy(elem.name, dnsCacheDomainsToVpn);
            }
        });

        Object.entries(dnsCacheTypes).forEach(([key, value]) => {
            ctx.labels('records', key).set(value);
        });

        Object.entries(dnsCacheDomainsToVpn).forEach(([key, value]) => {
            ctx.labels('domainsToVpn', key).set(value);
        });
    },
};
