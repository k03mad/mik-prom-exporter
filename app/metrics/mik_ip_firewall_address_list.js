import {ip2geo} from '@k03mad/ip2geo';
import {Netmask} from 'netmask';

import env from '../../env.js';
import Mikrotik from '../api/mikrotik.js';
import {isLocalIp} from '../helpers/net.js';
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
                .filter(elem => elem.list === env.mikrotik.toVpnList && elem.disabled !== 'true');

            const vpnListMasks = vpnList
                .filter(elem => elem.address.includes('/'));

            const vpnListDomains = vpnList
                .filter(elem => (/\D$/).test(elem.address));

            // added domains
            vpnListDomains.forEach(elem => matchedDomains.add(elem.address));

            // found domains by mask
            const dnsEntriesWithoutVpnDomains = ipDnsCache.filter(
                entry => entry.type === 'A'
                    && !vpnList.map(elem => elem.address).includes(entry.name),
            );

            for (const entry of dnsEntriesWithoutVpnDomains) {
                for (const elem of vpnListMasks) {
                    if (new Netmask(elem.address).contains(entry.data)) {
                        matchedDomains.add(`${entry.name} (${elem.address})`);
                        break;
                    }
                }
            }

            // created domains by dns
            vpnList
                .map(elem => elem.comment?.match(/^created for (.+)\./)?.[1])
                .filter(Boolean)
                .forEach(elem => matchedDomains.add(elem));

            [...matchedDomains].forEach((domain, i) => {
                ctx.labels('tovpn', domain).set(i + 1);
            });
        }

        if (env.mikrotik.honeypotList) {
            const countries = {};
            const isps = {};

            await Promise.all(ipFirewallAddressList.map(async elem => {
                if (
                    elem.list === env.mikrotik.honeypotList
                    && !globalThis.ip2geoError
                    && !isLocalIp(elem.address)
                ) {
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
