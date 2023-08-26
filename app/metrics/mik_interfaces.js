import client from 'prom-client';

import Mikrotik from '../api/mikrotik.js';
import {getCurrentFilename} from '../helpers/paths.js';

export default new client.Gauge({
    name: getCurrentFilename(import.meta.url),
    help: 'Interfaces',
    labelNames: ['type', 'name'],

    async collect() {
        this.reset();

        const interfaces = await Mikrotik.interface();
        const interfacesEnabled = interfaces.filter(({disabled}) => disabled === 'false');

        interfacesEnabled.forEach(iface => {
            this.labels('bytes', iface.name).set(Number(iface['rx-byte']) + Number(iface['tx-byte']));
            this.labels('errors', iface.name).set(Number(iface['rx-error']) + Number(iface['tx-error']));
        });

        await Promise.all(interfacesEnabled.map(async ({name}) => {
            const [rates] = await Mikrotik.interfaceMonitorTraffic(name);
            this.labels('bytes_per_sec', rates.name).set(Number(rates['rx-bits-per-second']) + Number(rates['tx-bits-per-second']));
            this.labels('errors_per_sec', rates.name).set(Number(rates['rx-errors-per-second']) + Number(rates['tx-bits-per-second']));
        }));
    },
});
