import client from 'prom-client';

import Mikrotik from '../api/mikrotik.js';
import {getCurrentFilename} from '../helpers/paths.js';

export default new client.Gauge({
    name: getCurrentFilename(import.meta.url),
    help: 'ip/firewall/raw',
    labelNames: ['type', 'name'],

    async collect() {
        this.reset();

        const ipFirewallRaw = await Mikrotik.ipFirewallRaw();

        ipFirewallRaw.forEach(elem => {
            !Mikrotik.ipFirewallIsDummyRule(elem) && this.labels('bytes', elem.comment).set(Number(elem.bytes));
        });
    },
});
