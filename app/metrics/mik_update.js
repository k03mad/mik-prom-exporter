import client from 'prom-client';

import Mikrotik from '../api/mikrotik.js';
import {getCurrentFilename} from '../helpers/paths.js';

export default new client.Gauge({
    name: getCurrentFilename(import.meta.url),
    help: 'Update',
    labelNames: ['type', 'value'],

    async collect() {
        this.reset();

        const [update] = await Mikrotik.update();

        this.labels('channel', update.channel).set(1);
        this.labels('installed-version', update['installed-version']).set(1);
        this.labels('latest-version', update['latest-version']).set(1);
    },
});
