import {Netmask} from 'netmask';
import client from 'prom-client';

import env from '../../env.js';
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

        if (env.mikrotik.toVpnList) {
            const matchedDomains = new Set();

            ipDnsCache.forEach(entry => {
                ipFirewallAddressList.forEach(elem => {
                    if (elem.list === env.mikrotik.toVpnList) {
                        if (
                            elem.timeout
                            && elem.address === entry.data
                        ) {
                            matchedDomains.add(entry.name);
                        }

                        if (
                            elem.address.includes('/')
                            && entry.type === 'A'
                            && new Netmask(elem.address).contains(entry.data)
                        ) {
                            matchedDomains.add(entry.name);
                        }
                    }
                });
            });

            [...matchedDomains].forEach((domain, i) => {
                this.labels('dynamic-to-vpn-domains-list', domain).set(++i);
            });
        }
    },
});
