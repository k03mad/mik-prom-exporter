import client from 'prom-client';

import IPinfo from '../api/ipinfo.js';
import Mikrotik from '../api/mikrotik.js';
import {countDupsBy} from '../helpers/object.js';
import {getCurrentFilename} from '../helpers/paths.js';

// 1 MB
const CONNECTIONS_MIN_BYTES = 1_048_576;

export default new client.Gauge({
    name: getCurrentFilename(import.meta.url),
    help: 'Firewall Connections',
    labelNames: ['type', 'name'],

    async collect() {
        this.reset();

        const [
            connections,
            dhcpIpToName,
            dnsIpToName,
        ] = await Promise.all([
            Mikrotik.firewallConnections(),
            Mikrotik.dhcpLeaseIpToName(),
            Mikrotik.dnsCacheIpToName(),
        ]);

        const bySrc = {};
        const byProtocol = {};
        const byFasttrack = {};
        const byDstHost = {};

        await Promise.all(connections.map(async elem => {
            const bytes = Number(elem['orig-bytes']) + Number(elem['repl-bytes']);

            const srcIp = elem['src-address'].split(':')[0];
            countDupsBy(dhcpIpToName[srcIp] || srcIp, bySrc);
            countDupsBy(elem.protocol, byProtocol);
            countDupsBy(elem.fasttrack, byFasttrack);

            if (bytes > CONNECTIONS_MIN_BYTES) {
                const ip = elem['dst-address'].split(':')[0];
                let host = dnsIpToName[ip];

                if (!host) {
                    try {
                        const ipinfo = await IPinfo.req(ip);
                        host = ipinfo.hostname;
                    } catch {}
                }

                host && countDupsBy(host, byDstHost, bytes);
            }
        }));

        Object.entries(bySrc).forEach(([key, value]) => {
            this.labels('src-name-count', key).set(value);
        });

        Object.entries(byProtocol).forEach(([key, value]) => {
            this.labels('protocol-count', key).set(value);
        });

        Object.entries(byFasttrack).forEach(([key, value]) => {
            this.labels('fasttrack-count', key).set(value);
        });

        Object.entries(byDstHost).forEach(([key, value]) => {
            this.labels('dst-host-bytes', key).set(value);
        });
    },
});
