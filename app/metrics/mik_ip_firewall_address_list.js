import fs from 'node:fs/promises';

import {Netmask} from 'netmask';

import env from '../../env.js';
import Mikrotik from '../api/mikrotik.js';
import {isValidIPv4} from '../helpers/net.js';
import {countDupsBy} from '../helpers/object.js';
import {getCurrentFilename} from '../helpers/paths.js';

const domains = new Set();

/**
 * @param {string} domain
 */
const getMainDomain = domain => {
    const parts = domain.split('.');
    return `${parts.at(-2)}.${parts.at(-1)}`;
};

/**
 * @param {string[]} domainsArr
 */
const saveDomainsLog = async domainsArr => {
    let prevMainDomain;

    const lines = domainsArr
        .toSorted((a, b) => {
            const aParts = a.split('.').toReversed();
            const bParts = b.split('.').toReversed();

            for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
                const aPart = aParts[i] || '';
                const bPart = bParts[i] || '';
                const comparison = aPart.localeCompare(bPart);

                if (comparison !== 0) {
                    return comparison;
                }
            }

            return 0;
        })
        .map((domain, i) => {
            const mainDomain = getMainDomain(domain);

            if (prevMainDomain && prevMainDomain !== mainDomain) {
                return '';
            }

            prevMainDomain = mainDomain;
            return `${i + 1}. ${domain}`;
        });

    await fs.writeFile('.vpn_domains.log', lines.join('\n'));
};

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
            const domainsArr = [...domains];

            domainsArr.forEach((domain, i) => {
                ctx.labels('tovpn', domain).set(i + 1);

                const mainDomain = getMainDomain(domain);

                if (!mainDomains.has(mainDomain)) {
                    ctx.labels('tovpnMain', mainDomain).set(i + 1);
                    mainDomains.add(mainDomain);
                }
            });

            if (domainsArr.length > 0) {
                await saveDomainsLog(domainsArr);
            }
        }
    },
};
