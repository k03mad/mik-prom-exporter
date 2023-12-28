import Mikrotik from '../api/mikrotik.js';
import {getCurrentFilename} from '../helpers/paths.js';

export default {
    name: getCurrentFilename(import.meta.url),
    help: 'interface',
    labelNames: ['type', 'name'],

    async collect(ctx) {
        ctx.reset();

        const interfaces = await Mikrotik.interface();
        const interfacesEnabled = interfaces.filter(({disabled}) => disabled === 'false');

        interfacesEnabled.forEach(iface => {
            ctx.labels('bytes', iface.name).set(Number(iface['rx-byte']) + Number(iface['tx-byte']));
            ctx.labels('errors', iface.name).set(Number(iface['rx-error']) + Number(iface['tx-error']));
        });

        await Promise.all(interfacesEnabled.map(async ({name}) => {
            const [interfaceMonitorTraffic] = await Mikrotik.interfaceMonitorTraffic(name);

            ctx.labels('bytes_per_sec', interfaceMonitorTraffic.name)
                .set(Number(interfaceMonitorTraffic['rx-bits-per-second']) + Number(interfaceMonitorTraffic['tx-bits-per-second']));
        }));
    },
};
