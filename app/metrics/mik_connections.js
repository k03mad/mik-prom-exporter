import client from 'prom-client';

import IPinfo from '../api/ipinfo.js';
import Mikrotik from '../api/mikrotik.js';
import {countDupsBy} from '../helpers/object.js';
import {getCurrentFilename} from '../helpers/paths.js';

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

        connections.forEach(elem => {
            const ip = elem['src-address'].split(':')[0];
            countDupsBy(dhcpIpToName[ip] || ip, bySrc);
            countDupsBy(elem.protocol, byProtocol);
            countDupsBy(elem.fasttrack, byFasttrack);
        });

        Object.entries(bySrc).forEach(([key, value]) => {
            this.labels('src-name', key).set(value);
        });

        Object.entries(byProtocol).forEach(([key, value]) => {
            this.labels('protocol', key).set(value);
        });

        Object.entries(byFasttrack).forEach(([key, value]) => {
            this.labels('fasttrack', key).set(value);
        });

        const byDstHost = {};
        const byDstCountry = {};
        const byDstCity = {};
        const byDstOrg = {};

        await Promise.all(connections.map(async elem => {
            const ip = elem['dst-address'].split(':')[0];
            let ipinfo = {};

            try {
                ipinfo = await IPinfo.req(ip);
            } catch {}

            const host = dnsIpToName[ip] || ipinfo.hostname;
            host && countDupsBy(host, byDstHost);
            ipinfo.org && countDupsBy(ipinfo.org.replace(/^AS\d+\s+/, ''), byDstOrg);

            if (ipinfo.country) {
                countDupsBy(ipinfo.country, byDstCountry);
                ipinfo.city && countDupsBy(`${ipinfo.country} ${ipinfo.city}`, byDstCity);
            }
        }));

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
