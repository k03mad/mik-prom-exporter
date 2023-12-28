/* eslint-disable unicorn/filename-case */

import Mikrotik from '../api/mikrotik.js';
import {countDupsBy} from '../helpers/object.js';
import {getCurrentFilename} from '../helpers/paths.js';

const REDIRECT_DNS_DEST_RE = /dns_redirect.+->([\d.]+)/;
const REDIRECT_DNS_SRC_RE = /dns_redirect.+ ([\d.]+):\d+/;
const REDIRECT_DNS_PROTO_RE = /dns_redirect.+proto (\w+)/;

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
        const redirectDnsDest = {};
        const redirectDnsSrc = {};
        const redirectDnsProto = {};
        const redirectDnsFull = {};

        log.forEach((item, i) => {
            ctx.labels('entries', item.time, item.topics, item.message, null).set(i + 1);
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
            ctx.labels('topics', null, null, null, key).set(value);
        });

        Object.entries(redirectDnsDest).forEach(([key, value]) => {
            ctx.labels('redirect-dns-dest', null, null, null, key).set(value);
        });

        Object.entries(redirectDnsSrc).forEach(([key, value]) => {
            ctx.labels('redirect-dns-src', null, null, null, key).set(value);
        });

        Object.entries(redirectDnsProto).forEach(([key, value]) => {
            ctx.labels('redirect-dns-proto', null, null, null, key).set(value);
        });

        Object.entries(redirectDnsFull).forEach(([key, value]) => {
            ctx.labels('redirect-dns-full', null, null, null, key).set(value);
        });
    },
};
