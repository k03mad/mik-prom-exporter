import fs from 'node:fs/promises';
import path from 'node:path';

import {Netmask} from 'netmask';

import env from '../../env.js';
import Mikrotik from '../api/mikrotik.js';
import {isValidIPv4} from '../helpers/net.js';
import {countDupsBy} from '../helpers/object.js';
import {getCurrentFilename} from '../helpers/paths.js';

const domains = new Set();

const LOG_FILE = path.join(env.server.static, 'domains');
const LOG_SAVE_EVERY_MIN = 1;

let timestamp = Date.now();

/**
 * @param {string} domain
 */
const getMainDomain = domain => {
    const parts = domain.split('.');
    return `${parts.at(-2)}.${parts.at(-1)}`;
};

const saveDomainsLog = async () => {
    if (
        domains.size > 0
        && ((Date.now() - timestamp) / 60_000) > LOG_SAVE_EVERY_MIN
    ) {
        let currentContent = [];

        try {
            currentContent = await fs.readFile(LOG_FILE, {encoding: 'utf8'});
        } catch (err) {
            if (err.code !== 'ENOENT') {
                throw err;
            }
        }

        const currentContentArr = currentContent
            .split('\n')
            .map(elem => elem.split('.').slice(1).join('.').trim())
            .filter(Boolean);

        const lines = [];
        let prevMainDomain;

        [...new Set([...currentContentArr, ...domains])]
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
                    lines.push('');
                }

                lines.push(`${i + 1}. ${domain}`);
                prevMainDomain = mainDomain;
            });

        await fs.mkdir(path.dirname(LOG_FILE), {recursive: true});
        await fs.writeFile(LOG_FILE, lines.join('\n'));
    }

    timestamp = Date.now();
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

            [...domains].forEach((domain, i) => {
                ctx.labels('tovpn', domain).set(i + 1);

                const mainDomain = getMainDomain(domain);

                if (!mainDomains.has(mainDomain)) {
                    ctx.labels('tovpnMain', mainDomain).set(i + 1);
                    mainDomains.add(mainDomain);
                }
            });

            await saveDomainsLog();
        }
    },
};
