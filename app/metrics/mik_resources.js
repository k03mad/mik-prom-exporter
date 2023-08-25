import client from 'prom-client';

import Mikrotik from '../api/mikrotik.js';
import {getCurrentFilename} from '../helpers/paths.js';

export default new client.Gauge({
    name: getCurrentFilename(import.meta.url),
    help: 'Resources',
    labelNames: ['type', 'value'],

    async collect() {
        this.reset();

        const numValues = [
            'cpu-frequency',
            'cpu-load',
            'free-hdd-space',
            'free-memory',
            'total-hdd-space',
            'total-memory',
            'write-sect-since-reboot',
            'write-sect-total',
        ];

        const strValues = [
            'uptime',
            'version',
        ];

        const resources = await Mikrotik.resources();

        numValues.forEach(value => {
            this.labels(value, null).set(Number(resources[value]));
        });

        strValues.forEach(value => {
            this.labels(value, resources[value]).set(1);
        });
    },
});
