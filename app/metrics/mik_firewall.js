import client from 'prom-client';

import Mikrotik from '../api/mikrotik.js';
import {getCurrentFilename} from '../helpers/paths.js';

export default new client.Gauge({
    name: getCurrentFilename(import.meta.url),
    help: 'Firewall Rules',
    labelNames: ['type', 'name'],

    async collect() {
        this.reset();

        const [
            filter,
            nat,
            mangle,
            raw,
        ] = await Promise.all([
            Mikrotik.firewallFilter(),
            Mikrotik.firewallNat(),
            Mikrotik.firewallMangle(),
            Mikrotik.firewallRaw(),
        ]);

        filter.forEach(elem => {
            !Mikrotik.isDummyRule(elem) && this.labels('filter', elem.comment).set(Number(elem.bytes));
        });

        nat.forEach(elem => {
            !Mikrotik.isDummyRule(elem) && this.labels('nat', elem.comment).set(Number(elem.bytes));
        });

        mangle.forEach(elem => {
            !Mikrotik.isDummyRule(elem) && this.labels('mangle', elem.comment).set(Number(elem.bytes));
        });

        raw.forEach(elem => {
            !Mikrotik.isDummyRule(elem) && this.labels('raw', elem.comment).set(Number(elem.bytes));
        });
    },
});
