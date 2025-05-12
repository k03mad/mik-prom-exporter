import {ip2geo} from '@k03mad/ip2geo';

import env from '../../env.js';
import Mikrotik from '../api/mikrotik.js';
import {isLocalIp} from '../helpers/net.js';
import {countDupsBy} from '../helpers/object.js';
import {getCurrentFilename} from '../helpers/paths.js';

const MERGE_DOMAINS = [
    'cdninstagram.com',
    'facebook.com',
    'fbcdn.net',
    'googlevideo.com',
    'gvt1.com',
    'instagram.com',
];

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
            const matchedDomains = new Set();

            ipFirewallAddressList.forEach(elem => {
                if (elem.list === env.mikrotik.toVpnList) {
                    const domain = elem.comment?.match(/^created for (?<domain>.+)\.$/)?.groups?.domain;

                    if (domain) {
                        if (MERGE_DOMAINS.some(rule => domain.endsWith(rule))) {
                            const splitted = domain.split('.');

                            matchedDomains.add(`*.${splitted.at(-2)}.${splitted.at(-1)}`);
                        } else {
                            matchedDomains.add(domain);
                        }
                    }
                }
            });

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
