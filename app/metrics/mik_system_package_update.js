import client from 'prom-client';

import Mikrotik from '../api/mikrotik.js';
import {getCurrentFilename} from '../helpers/paths.js';

export default new client.Gauge({
    name: getCurrentFilename(import.meta.url),
    help: 'system/package/update',
    labelNames: ['type', 'value'],

    async collect() {
        this.reset();

        const [, systemPackageUpdateCheck] = await Mikrotik.systemPackageUpdateCheck();

        this.labels('channel', systemPackageUpdateCheck.channel).set(1);
        this.labels('installed-version', systemPackageUpdateCheck['installed-version']).set(1);
        this.labels('latest-version', systemPackageUpdateCheck['latest-version']).set(1);
        this.labels('status', systemPackageUpdateCheck.status).set(1);
    },
});
