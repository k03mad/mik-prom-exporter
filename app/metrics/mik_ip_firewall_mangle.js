import client from 'prom-client';

import Mikrotik from '../api/mikrotik.js';
import {getCurrentFilename} from '../helpers/paths.js';

export default new client.Gauge({
    name: getCurrentFilename(import.meta.url),
    help: 'ip/firewall/mangle',
    labelNames: ['type', 'name'],

    async collect() {
        this.reset();

        const ipFirewallMangle = await Mikrotik.ipFirewallMangle();

        ipFirewallMangle.forEach(elem => {
            if (!Mikrotik.ipFirewallIsDummyRule(elem)) {
                this.labels('bytes', `[${elem.chain} ${elem.action}] ${elem.comment}`).set(Number(elem.bytes));
            }
        });
    },
});
