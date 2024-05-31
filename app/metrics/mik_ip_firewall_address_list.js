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

            const vpnList = ipFirewallAddressList
                .filter(elem => elem.list === env.mikrotik.toVpnList);

            const dnsEntriesWithoutVpnDomains = ipDnsCache
                .filter(
                    entry => entry.type === 'A'
                    && !vpnList.map(elem => elem.address).includes(entry.name),
                );

            for (const entry of dnsEntriesWithoutVpnDomains) {
                for (const elem of vpnList) {
                    if (
                        elem.address.includes('/')
                        && new Netmask(elem.address).contains(entry.data)
                    ) {
                        matchedDomains.add(`${entry.name} (${elem.address})`);
                        break;
                    }
                }
            }

            [...matchedDomains].forEach((domain, i) => {
                ctx.labels('dynamic-to-vpn-domains-list', domain).set(i + 1);
            });
        }

        if (env.mikrotik.honeypotList) {
            const countries = {};
            const isps = {};

            await Promise.all(ipFirewallAddressList.map(async elem => {
                if (elem.list === env.mikrotik.honeypotList) {
                    const {country, countryEmoji = '', connectionIsp} = await ip2geo({
                        ip: elem.address,
                        cacheDir: env.geoip.cacheDir,
                        cacheMapMaxEntries: env.geoip.cacheMapMaxEntries,
                    });

                    if (country) {
                        countDupsBy(`${countryEmoji} ${country}`.trim(), countries);
                    }

                    if (connectionIsp) {
                        countDupsBy(connectionIsp, isps);
                    }
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
