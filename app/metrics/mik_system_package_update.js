import client from 'prom-client';

import Mikrotik from '../api/mikrotik.js';
import {getCurrentFilename} from '../helpers/paths.js';

export default new client.Gauge({
    name: getCurrentFilename(import.meta.url),
    help: 'system/package/update',
    labelNames: ['type', 'value'],

    async collect() {
        this.reset();

        const [systemPackageUpdate] = await Mikrotik.systemPackageUpdate();

        this.labels('channel', systemPackageUpdate.channel).set(1);
        this.labels('installed-version', systemPackageUpdate['installed-version']).set(1);
        this.labels('latest-version', systemPackageUpdate['latest-version']).set(1);
    },
});
