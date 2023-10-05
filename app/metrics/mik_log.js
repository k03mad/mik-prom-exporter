import Mikrotik from '../api/mikrotik.js';
import {countDupsBy} from '../helpers/object.js';
import {getCurrentFilename} from '../helpers/paths.js';

const REDIRECT_DNS_DEST_RE = /dstnat.+->([\d.]+):53/;
const REDIRECT_DNS_SRC_RE = /dstnat.+ ([\d.]+):\d+/;
const REDIRECT_DNS_PROTO_RE = /dstnat.+proto (\w+).+->.+:53/;

export default {
    name: getCurrentFilename(import.meta.url),
    help: 'log',
    labelNames: ['type', 'name'],

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
        const redirectDnsDest = {};
        const redirectDnsSrc = {};
        const redirectDnsProto = {};
        const redirectDnsFull = {};

        log.forEach((item, i) => {
            ctx.labels('entries', `[${item.time}] ${item.message}`).set(++i);
            countDupsBy(item.topics, topics);

            const redirectFull = [];

            const srcDns = item.message.match(REDIRECT_DNS_SRC_RE)?.[1];

            if (srcDns) {
                const nameOrIp = ipDhcpServerLeaseToName[srcDns] || srcDns;
                countDupsBy(nameOrIp, redirectDnsSrc);
                redirectFull.push(nameOrIp);
            }

            const destDns = item.message.match(REDIRECT_DNS_DEST_RE)?.[1];

            if (destDns) {
                countDupsBy(destDns, redirectDnsDest);
                redirectFull.push('=>', destDns);
            }

            const protoDns = item.message.match(REDIRECT_DNS_PROTO_RE)?.[1];

            if (protoDns) {
                countDupsBy(protoDns, redirectDnsProto);
                redirectFull.push(`(${protoDns})`);
            }

            if (redirectFull.length > 0) {
                countDupsBy(redirectFull.join(' '), redirectDnsFull);
            }
        });

        Object.entries(topics).forEach(([key, value]) => {
            ctx.labels('topics', key).set(value);
        });

        Object.entries(redirectDnsDest).forEach(([key, value]) => {
            ctx.labels('redirect-dns-dest', key).set(value);
        });

        Object.entries(redirectDnsSrc).forEach(([key, value]) => {
            ctx.labels('redirect-dns-src', key).set(value);
        });

        Object.entries(redirectDnsProto).forEach(([key, value]) => {
            ctx.labels('redirect-dns-proto', key).set(value);
        });

        Object.entries(redirectDnsFull).forEach(([key, value]) => {
            ctx.labels('redirect-dns-full', key).set(value);
        });
    },
};
