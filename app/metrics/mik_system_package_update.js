import client from 'prom-client';

import Mikrotik from '../api/mikrotik.js';
import {getCurrentFilename} from '../helpers/paths.js';

export default new client.Gauge({
    name: getCurrentFilename(import.meta.url),
    help: 'system/package/update',
    labelNames: ['type', 'value'],

    async collect() {
        this.reset();

        const systemPackageUpdateCheck = await Mikrotik.systemPackageUpdateCheck();
        const lastMessage = systemPackageUpdateCheck.at(-1);

        this.labels('channel', lastMessage.channel).set(1);
        this.labels('installed-version', lastMessage['installed-version']).set(1);
        this.labels('latest-version', lastMessage['latest-version']).set(1);
        this.labels('status', lastMessage.status).set(1);
    },
});
