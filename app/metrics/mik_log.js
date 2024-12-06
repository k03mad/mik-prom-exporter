import {ip2geo} from '@k03mad/ip2geo';

import env from '../../env.js';
import Mikrotik from '../api/mikrotik.js';
import {isLocalIp} from '../helpers/net.js';
import {countDupsBy} from '../helpers/object.js';
import {getCurrentFilename} from '../helpers/paths.js';

const redirectsRe = {
    dns: {
        dest: /dns_redirect.+->([\d.]+)/,
        src: /dns_redirect.+ ([\d.]+):\d+/,
        proto: /dns_redirect.+proto (\w+)/,
    },
    ntp: {
        dest: /ntp_redirect.+->([\d.]+)/,
        src: /ntp_redirect.+ ([\d.]+):\d+/,
    },
};

export default {
    name: getCurrentFilename(import.meta.url),
    help: 'log',
    labelNames: ['type', 'time', 'topics', 'message', 'key'],

    async collect(ctx) {
        ctx.reset();

        const [
            log,
            ipDhcpServerLeaseToName,
        ] = await Promise.all([
            Mikrotik.log(),
            Mikrotik.ipDhcpServerLeaseToName(),
        ]);

        const topics = {};
        const counters = {};

        await Promise.all(log.map(async (item, i) => {
            ctx.labels('entries', item.time, item.topics, item.message, null).set(i + 1);
            countDupsBy(item.topics, topics);

            await Promise.all(Object.keys(redirectsRe).map(async type => {
                if (!counters[type]) {
                    counters[type] = {};
                }

                const redirectFullArr = [];

                const src = item.message.match(redirectsRe[type].src)?.[1];

                if (src) {
                    const nameOrIp = ipDhcpServerLeaseToName[src] || src;

                    if (!counters[type].src) {
                        counters[type].src = {};
                    }

                    countDupsBy(nameOrIp, counters[type].src);
                    redirectFullArr.push(nameOrIp);
                }

                const address = item.message.match(redirectsRe[type].dest)?.[1];

                if (address) {
                    if (!counters[type].dest) {
                        counters[type].dest = {};
                    }

                    let addressDomain = address;

                    if (
                        address.includes('.')
                        && !globalThis.ip2geoLimitExceed
                        && !isLocalIp(address)
                    ) {
                        const {connectionDomain} = await ip2geo({
                            ip: address,
                            cacheDir: env.geoip.cacheDir,
                            cacheMapMaxEntries: env.geoip.cacheMapMaxEntries,
                        });

                        if (connectionDomain) {
                            addressDomain += ` / ${connectionDomain}`;
                        }
                    }

                    countDupsBy(addressDomain, counters[type].dest);
                    redirectFullArr.push('=>', addressDomain);
                }

                const proto = item.message.match(redirectsRe[type].proto)?.[1];

                if (proto) {
                    if (!counters[type].proto) {
                        counters[type].proto = {};
                    }

                    countDupsBy(proto, counters[type].proto);
                    redirectFullArr.push(`(${proto})`);
                }

                if (redirectFullArr.length > 0) {
                    if (!counters[type].full) {
                        counters[type].full = {};
                    }

                    countDupsBy(redirectFullArr.join(' '), counters[type].full);
                }
            }));
        }));

        Object.entries(topics).forEach(([key, value]) => {
            ctx.labels('topics', null, null, null, key).set(value);
        });

        Object.entries(counters).forEach(([type, obj]) => {
            Object.entries(obj).forEach(([key, data]) => {
                Object.entries(data).forEach(([src, value]) => {
                    ctx.labels(`redirect-${type}-${key}`, null, null, null, src).set(value);
                });
            });
        });
    },
};
