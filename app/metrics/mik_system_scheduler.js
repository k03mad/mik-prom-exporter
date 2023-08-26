import client from 'prom-client';

import Mikrotik from '../api/mikrotik.js';
import {getCurrentFilename} from '../helpers/paths.js';

export default new client.Gauge({
    name: getCurrentFilename(import.meta.url),
    help: 'system/scheduler',
    labelNames: ['type', 'name'],

    async collect() {
        this.reset();

        const systemScheduler = await Mikrotik.systemScheduler();

        systemScheduler.forEach(elem => {
            this.labels('run-count', elem.name).set(Number(elem['run-count']));
        });
    },
});
