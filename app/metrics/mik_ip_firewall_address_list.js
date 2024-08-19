import {ip2geo} from '@k03mad/ip2geo';

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

        const ipFirewallAddressList = await Mikrotik.ipFirewallAddressList();

        const listsNames = {};

        ipFirewallAddressList.forEach(elem => {
            countDupsBy(elem.list, listsNames);
        });

        Object.entries(listsNames).forEach(([key, value]) => {
            ctx.labels('count', key).set(value);
        });

        if (env.mikrotik.toVpnList) {
            const vpnList = ipFirewallAddressList
                .filter(elem => elem.list === env.mikrotik.toVpnList && elem.disabled !== 'true');

            // created domains by dns
            const createdByDnsRe = /^created for (.+)\./;

            const vpnListCreatedByDns = new Set(vpnList
                .filter(elem => createdByDnsRe.test(elem.comment))
                .map(elem => elem.comment.match(createdByDnsRe)[1]),
            );

            [...vpnListCreatedByDns].forEach((domain, i) => {
                ctx.labels('dns-to-vpn-domains-list', domain).set(i + 1);
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
