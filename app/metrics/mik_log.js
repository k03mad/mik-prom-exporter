import Mikrotik from '../api/mikrotik.js';
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

        log.forEach((item, i) => {
            ctx.labels('entries', item.time, item.topics, item.message, null).set(i + 1);
            countDupsBy(item.topics, topics);

            Object.keys(redirectsRe).forEach(type => {
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

                const dest = item.message.match(redirectsRe[type].dest)?.[1];

                if (dest) {
                    if (!counters[type].dest) {
                        counters[type].dest = {};
                    }

                    countDupsBy(dest, counters[type].dest);
                    redirectFullArr.push('=>', dest);
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
            });
        });

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
