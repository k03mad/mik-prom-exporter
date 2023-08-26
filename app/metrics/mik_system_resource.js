import client from 'prom-client';

import Mikrotik from '../api/mikrotik.js';
import {getCurrentFilename} from '../helpers/paths.js';

export default new client.Gauge({
    name: getCurrentFilename(import.meta.url),
    help: 'system/resource',
    labelNames: ['type', 'value'],

    async collect() {
        this.reset();

        const [systemResource] = await Mikrotik.systemResource();

        // mhz => hz
        this.labels('cpu-frequency', null).set(Number(systemResource['cpu-frequency']) * 1_000_000);
        this.labels('cpu-load', null).set(Number(systemResource['cpu-load']));

        const totalMemory = Number(systemResource['total-memory']);
        this.labels('total-memory', null).set(totalMemory);
        this.labels('used-memory', null).set(totalMemory - Number(systemResource['free-memory']));

        const totalHdd = Number(systemResource['total-hdd-space']);
        this.labels('total-hdd-space', null).set(totalHdd);
        this.labels('used-hdd-space', null).set(totalHdd - Number(systemResource['free-hdd-space']));

        this.labels('uptime', systemResource.uptime.replaceAll(/([a-z])/g, '$1 ').trim()).set(1);
    },
});
