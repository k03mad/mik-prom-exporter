import client from 'prom-client';

import Mikrotik from '../api/mikrotik.js';
import {countDupsBy} from '../helpers/object.js';
import {getCurrentFilename} from '../helpers/paths.js';

export default new client.Gauge({
    name: getCurrentFilename(import.meta.url),
    help: 'ip/firewall/address-list',
    labelNames: ['type', 'name'],

    async collect() {
        this.reset();

        const ipFirewallAddressList = await Mikrotik.ipFirewallAddressList();

        const listsNames = {};

        ipFirewallAddressList.forEach(elem => {
            countDupsBy(elem.list, listsNames);
        });

        Object.entries(listsNames).forEach(([key, value]) => {
            this.labels('count', key).set(value);
        });
    },
});
