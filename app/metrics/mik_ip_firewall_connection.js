import {ip2geo} from '@k03mad/ip2geo';

import env from '../../env.js';
import Mikrotik from '../api/mikrotik.js';
import {countDupsBy} from '../helpers/object.js';
import {getCurrentFilename} from '../helpers/paths.js';

// 1 MB
const CONNECTIONS_MIN_BYTES = 1_048_576;

export default {
    name: getCurrentFilename(import.meta.url),
    help: 'ip/firewall/connection',
    labelNames: ['type', 'name'],

    async collect(ctx) {
        ctx.reset();

        const [
            ipFirewallConnection,
            ipDhcpServerLeaseToName,
            ipDnsCacheToName,
        ] = await Promise.all([
            Mikrotik.ipFirewallConnection(),
            Mikrotik.ipDhcpServerLeaseToName(),
            Mikrotik.ipDnsCacheToName(),
        ]);

        const bySrc = {};
        const byProtocol = {};
        const byFasttrack = {};
        const byDstHost = {};
        const byDstCountry = {};
        const byDstIsp = {};

        const dstAddresses = new Set();

        ipFirewallConnection.forEach(elem => {
            dstAddresses.add();
            const bytes = Number(elem['orig-bytes']) + Number(elem['repl-bytes']);

            const srcIp = elem['src-address'].split(':')[0];
            const srcName = ipDhcpServerLeaseToName[srcIp];

            if (srcName) {
                countDupsBy(srcName, bySrc);
            }

            countDupsBy(elem.protocol, byProtocol);
            countDupsBy(elem.fasttrack, byFasttrack);

            const ip = elem['dst-address'].split(':')[0];

            if (ip) {
                dstAddresses.add(ip);

                if (bytes > CONNECTIONS_MIN_BYTES) {
                    const host = ipDnsCacheToName[ip];

                    if (host) {
                        countDupsBy(host, byDstHost, bytes);
                    }
                }
            }
        });

        await Promise.all([...dstAddresses].map(async address => {
            const {country, emoji, isp} = await ip2geo(address, {
                cacheDir: env.geoip.cacheDir,
            });

            if (country) {
                countDupsBy(`${emoji} ${country}`, byDstCountry);
            }

            if (isp) {
                countDupsBy(isp, byDstIsp);
            }
        }));

        Object.entries(bySrc).forEach(([key, value]) => {
            ctx.labels('src-name-count', key).set(value);
        });

        Object.entries(byProtocol).forEach(([key, value]) => {
            ctx.labels('protocol-count', key).set(value);
        });

        Object.entries(byFasttrack).forEach(([key, value]) => {
            ctx.labels('fasttrack-count', key).set(value);
        });

        Object.entries(byDstHost).forEach(([key, value]) => {
            ctx.labels('dst-host-bytes', key).set(value);
        });

        Object.entries(byDstCountry).forEach(([key, value]) => {
            ctx.labels('dst-country', key).set(value);
        });

        Object.entries(byDstIsp).forEach(([key, value]) => {
            ctx.labels('dst-isp', key).set(value);
        });
    },
};
