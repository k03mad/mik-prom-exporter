import {Netmask} from 'netmask';
import client from 'prom-client';

import Mikrotik from '../api/mikrotik.js';
import {countDupsBy} from '../helpers/object.js';
import {getCurrentFilename} from '../helpers/paths.js';

export default new client.Gauge({
    name: getCurrentFilename(import.meta.url),
    help: 'ip/firewall/address-list',
    labelNames: ['type', 'name'],

    async collect() {
        this.reset();

        const [
            ipFirewallAddressList,
            ipDnsCache,
        ] = await Promise.all([
            Mikrotik.ipFirewallAddressList(),
            Mikrotik.ipDnsCache(),
        ]);

        const listsNames = {};

        ipFirewallAddressList.forEach(elem => {
            countDupsBy(elem.list, listsNames);
        });

        Object.entries(listsNames).forEach(([key, value]) => {
            this.labels('count', key).set(value);
        });

        const listsDataMasks = ipFirewallAddressList.filter(elem => elem.address.includes('/'));
        const matchedDomains = new Set();

        ipDnsCache.forEach(entry => {
            listsDataMasks.forEach(mask => {
                if (entry.type === 'A' && new Netmask(mask.address).contains(entry.data)) {
                    matchedDomains.add(entry.name);
                }
            });
        });

        [...matchedDomains].forEach((domain, i) => {
            this.labels('domain-from-dns-by-list-mask', domain).set(++i);
        });
    },
});
