import client from 'prom-client';

import Mikrotik from '../api/mikrotik.js';
import {countDupsBy} from '../helpers/object.js';
import {getCurrentFilename} from '../helpers/paths.js';

export default new client.Gauge({
    name: getCurrentFilename(import.meta.url),
    help: 'DNS',
    labelNames: ['type', 'record'],

    async collect() {
        this.reset();

        const [[dns], dnsCache] = await Promise.all([
            Mikrotik.dns(),
            Mikrotik.dnsCache(),
        ]);

        const dnsCacheTypes = {};

        dnsCache.forEach(elem => {
            elem.type && countDupsBy(elem.type, dnsCacheTypes);
        });

        Object.entries(dnsCacheTypes).forEach(([key, value]) => {
            this.labels('records', key).set(value);
        });

        this.labels('cache-used', null).set(Number(dns['cache-used']));
    },
});
