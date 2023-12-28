import Mikrotik from '../api/mikrotik.js';
import {getCurrentFilename} from '../helpers/paths.js';

export default {
    name: getCurrentFilename(import.meta.url),
    help: 'interface/wireless/registration-table',
    labelNames: ['type', 'name'],

    async collect(ctx) {
        ctx.reset();

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

                ctx.labels('bytes', clientName).set(Number(tx) + Number(rx));
                ctx.labels('signal-strength', clientName).set(Number(wifiClient['signal-strength'].split('@')[0]));
                ctx.labels('signal-to-noise', clientName).set(Number(wifiClient['signal-to-noise']));
                ctx.labels('ccq', clientName).set(Number(wifiClient['tx-ccq']));
            }
        });
    },
};
