import client from 'prom-client';

import Mikrotik from '../api/mikrotik.js';
import {getCurrentFilename} from '../helpers/paths.js';

export default new client.Gauge({
    name: getCurrentFilename(import.meta.url),
    help: 'Resources',
    labelNames: ['type', 'value'],

    async collect() {
        this.reset();

        const resources = await Mikrotik.resources();

        // mhz => hz
        this.labels('cpu-frequency', null).set(Number(resources['cpu-frequency']) * 1_000_000);
        this.labels('cpu-load', null).set(Number(resources['cpu-load']));

        const totalMemory = Number(resources['total-memory']);
        this.labels('total-memory', null).set(totalMemory);
        this.labels('used-memory', null).set(totalMemory - Number(resources['free-memory']));

        const totalHdd = Number(resources['total-hdd-space']);
        this.labels('total-hdd-space', null).set(totalHdd);
        this.labels('used-hdd-space', null).set(totalHdd - Number(resources['free-hdd-space']));

        this.labels('uptime', resources.uptime).set(1);
        this.labels('version', resources.version).set(1);
    },
});
