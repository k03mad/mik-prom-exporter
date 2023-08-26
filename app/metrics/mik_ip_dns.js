import client from 'prom-client';

import Mikrotik from '../api/mikrotik.js';
import {getCurrentFilename} from '../helpers/paths.js';

export default new client.Gauge({
    name: getCurrentFilename(import.meta.url),
    help: 'ip/dns',
    labelNames: ['type'],

    async collect() {
        this.reset();

        const [ipDns] = await Mikrotik.ipDns();

        this.labels('cache-used').set(Number(ipDns['cache-used']));
    },
});
