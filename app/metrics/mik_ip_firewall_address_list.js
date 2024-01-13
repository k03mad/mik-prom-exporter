import {ip2geo} from '@k03mad/ip2geo';
import {Netmask} from 'netmask';

import env from '../../env.js';
import Mikrotik from '../api/mikrotik.js';
import {countDupsBy} from '../helpers/object.js';
import {getCurrentFilename} from '../helpers/paths.js';

export default {
    name: getCurrentFilename(import.meta.url),
    help: 'ip/firewall/address-list',
    labelNames: ['type', 'name'],

    async collect(ctx) {
        ctx.reset();

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
            ctx.labels('count', key).set(value);
        });

        if (env.mikrotik.toVpnList) {
            const matchedDomains = new Set();

            ipDnsCache.forEach(entry => {
                ipFirewallAddressList.forEach(elem => {
                    if (elem.list === env.mikrotik.toVpnList
                        && (
                            (elem.timeout && elem.address === entry.data)
                            || (elem.address.includes('/') && entry.type === 'A'
                            && new Netmask(elem.address).contains(entry.data))
                        )
                    ) {
                        matchedDomains.add(`${entry.name} (${elem.address})`);
                    }
                });
            });

            [...matchedDomains].forEach((domain, i) => {
                ctx.labels('dynamic-to-vpn-domains-list', domain).set(i + 1);
            });
        }

        if (env.mikrotik.honeypotList) {
            const countries = {};
            const isps = {};

            await Promise.all(ipFirewallAddressList.map(async elem => {
                if (elem.list === env.mikrotik.honeypotList) {
                    const data = await ip2geo(elem.address, {
                        cacheDir: env.geoip.cacheDir,
                    });

                    countDupsBy(`${data.emoji} ${data.country}`, countries);
                    countDupsBy(data.isp, isps);
                }
            }));

            Object.entries(countries).forEach(([name, count]) => {
                ctx.labels('geoip_country', name).set(count);
            });

            Object.entries(isps).forEach(([name, count]) => {
                ctx.labels('geoip_isp', name).set(count);
            });
        }
    },
};
