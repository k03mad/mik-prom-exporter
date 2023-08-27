import client from 'prom-client';

import Mikrotik from '../api/mikrotik.js';
import {getCurrentFilename} from '../helpers/paths.js';

export default new client.Gauge({
    name: getCurrentFilename(import.meta.url),
    help: 'interface/wireless',
    labelNames: ['type', 'name'],

    async collect() {
        this.reset();

        const interfaceWireless = await Mikrotik.interfaceWireless();

        await Promise.all(interfaceWireless.map(async iface => {
            const [data] = await Mikrotik.interfaceWirelessMonitor(iface['.id']);

            this.labels('noise-floor', iface.ssid).set(Number(data['noise-floor']));
            this.labels('overall-tx-ccq', iface.ssid).set(Number(data['overall-tx-ccq']));
            this.labels('registered-clients', iface.ssid).set(Number(data['registered-clients']));
        }));
    },
});
