import client from 'prom-client';

import Mikrotik from '../api/mikrotik.js';
import {getCurrentFilename} from '../helpers/paths.js';

export default new client.Gauge({
    name: getCurrentFilename(import.meta.url),
    help: 'interface/wireless/registration-table',
    labelNames: ['type', 'name'],

    async collect() {
        this.reset();

        const [
            interfaceWirelessRegistrationTable,
            ipDhcpServerLeaseToName,
        ] = await Promise.all([
            Mikrotik.interfaceWirelessRegistrationTable(),
            Mikrotik.ipDhcpServerLeaseToName(),
        ]);

        interfaceWirelessRegistrationTable.forEach(wifiClient => {
            const clientName = ipDhcpServerLeaseToName[wifiClient['last-ip']];

            if (clientName) {
                const [tx, rx] = wifiClient.bytes.split(',');

                this.labels('bytes', clientName).set(Number(tx) + Number(rx));
                this.labels('signal-strength', clientName).set(Number(wifiClient['signal-strength'].split('@')[0]));
                this.labels('signal-to-noise', clientName).set(Number(wifiClient['signal-to-noise']));
                this.labels('ccq', clientName).set(Number(wifiClient['tx-ccq']));
            }
        });
    },
});
