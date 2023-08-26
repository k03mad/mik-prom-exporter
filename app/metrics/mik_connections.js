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
        const byDstCountry = {};
        const byDstCity = {};
        const byDstOrg = {};

        await Promise.all(connections.map(async elem => {
            const bytes = Number(elem['orig-bytes']) + Number(elem['repl-bytes']);

            const srcIp = elem['src-address'].split(':')[0];
            countDupsBy(dhcpIpToName[srcIp] || srcIp, bySrc, bytes);
            countDupsBy(elem.protocol, byProtocol, bytes);
            countDupsBy(elem.fasttrack, byFasttrack, bytes);

            if (bytes > CONNECTIONS_MIN_BYTES) {
                const ip = elem['dst-address'].split(':')[0];
                let ipinfo = {};

                try {
                    ipinfo = await IPinfo.req(ip);
                } catch {}

                const host = dnsIpToName[ip] || ipinfo.hostname;
                host && countDupsBy(host, byDstHost, bytes);
                ipinfo.org && countDupsBy(ipinfo.org.replace(/^AS\d+\s+/, ''), byDstOrg, bytes);

                if (ipinfo.country) {
                    countDupsBy(ipinfo.country, byDstCountry, bytes);
                    ipinfo.city && countDupsBy(`${ipinfo.country} ${ipinfo.city}`, byDstCity, bytes);
                }
            }
        }));

        Object.entries(bySrc).forEach(([key, value]) => {
            this.labels('src-name', key).set(value);
        });

        Object.entries(byProtocol).forEach(([key, value]) => {
            this.labels('protocol', key).set(value);
        });

        Object.entries(byFasttrack).forEach(([key, value]) => {
            this.labels('fasttrack', key).set(value);
        });

        Object.entries(byDstHost).forEach(([key, value]) => {
            this.labels('dst-host', key).set(value);
        });

        Object.entries(byDstCountry).forEach(([key, value]) => {
            this.labels('dst-country', key).set(value);
        });

        Object.entries(byDstCity).forEach(([key, value]) => {
            this.labels('dst-city', key).set(value);
        });

        Object.entries(byDstOrg).forEach(([key, value]) => {
            this.labels('dst-org', key).set(value);
        });
    },
});
