import client from 'prom-client';

import Mikrotik from '../api/mikrotik.js';
import {getCurrentFilename} from '../helpers/paths.js';

export default new client.Gauge({
    name: getCurrentFilename(import.meta.url),
    help: 'ip/firewall/filter',
    labelNames: ['type', 'name'],

    async collect() {
        this.reset();

        const ipFirewallFilter = await Mikrotik.ipFirewallFilter();

        ipFirewallFilter.forEach(elem => {
            !Mikrotik.ipFirewallIsDummyRule(elem) && this.labels('bytes', elem.comment).set(Number(elem.bytes));
        });
    },
});
