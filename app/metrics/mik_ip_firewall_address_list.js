import path from 'node:path';

import {Netmask} from 'netmask';

import env from '../../env.js';
import Mikrotik from '../api/mikrotik.js';
import {getMainDomain, saveDomainsHtml} from '../helpers/domains.js';
import {isValidIPv4} from '../helpers/net.js';
import {countDupsBy} from '../helpers/object.js';
import {getCurrentFilename} from '../helpers/paths.js';

const domains = new Set();

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
            const ipDnsCache = await Mikrotik.ipDnsCache();

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

            const mainDomains = new Set();

            [...domains].forEach((domain, i) => {
                ctx.labels('tovpn', domain).set(i + 1);

                const mainDomain = getMainDomain(domain);

                if (!mainDomains.has(mainDomain)) {
                    ctx.labels('tovpnMain', mainDomain).set(i + 1);
                    mainDomains.add(mainDomain);
                }
            });

            await saveDomainsHtml(
                domains,
                path.join(env.server.static, 'domains.html'),
            );
        }
    },
};
