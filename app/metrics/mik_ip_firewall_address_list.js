import {Netmask} from 'netmask';

import env from '../../env.js';
import Mikrotik from '../api/mikrotik.js';
import {isValidIPv4} from '../helpers/net.js';
import {countDupsBy} from '../helpers/object.js';
import {getCurrentFilename} from '../helpers/paths.js';

const MERGE_DOMAINS = [
    'akamai.net',
    'cdninstagram.com',
    'cloudfront.net',
    'facebook.com',
    'fbcdn.net',
    'googlevideo.com',
    'gvt1.com',
    'instagram.com',
    'rbxcdn.com',
    'roblox.com',
];

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
            const domains = new Set();
            const mergedDomains = new Set();

            // mask to domains from dns cache
            const vpnListMasks = ipFirewallAddressList
                .map(elem => {
                    if (
                        elem.list === env.mikrotik.toVpnList
                        && elem.address.includes('/')
                    ) {
                        return elem.address;
                    }
                })
                .filter(Boolean);

            const dnsEntries = ipDnsCache.filter(entry => entry.type === 'A' && entry.data);

            for (const mask of vpnListMasks) {
                const maskData = new Netmask(mask);

                for (const entry of dnsEntries) {
                    if (maskData.contains(entry.data)) {
                        domains.add(entry.name);
                    }
                }
            }

            // domains from comment
            ipFirewallAddressList.forEach(elem => {
                if (
                    elem.list === env.mikrotik.toVpnList
                    && elem.comment
                    && isValidIPv4(elem.address)
                ) {
                    domains.add(elem.comment);
                }
            });

            // merge
            for (const domain of domains) {
                if (MERGE_DOMAINS.some(rule => domain.endsWith(rule))) {
                    const splitted = domain.split('.');
                    mergedDomains.add(`*.${splitted.at(-2)}.${splitted.at(-1)}`);
                } else {
                    mergedDomains.add(domain);
                }
            }

            [...mergedDomains].forEach((domain, i) => {
                ctx.labels('tovpn', domain).set(i + 1);
            });
        }
    },
};
