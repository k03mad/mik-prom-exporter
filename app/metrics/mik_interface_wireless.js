/* eslint-disable unicorn/filename-case */

import Mikrotik from '../api/mikrotik.js';
import {getCurrentFilename} from '../helpers/paths.js';

export default {
    name: getCurrentFilename(import.meta.url),
    help: 'interface/wireless',
    labelNames: ['type', 'name'],

    async collect(ctx) {
        ctx.reset();

        const interfaceWireless = await Mikrotik.interfaceWireless();

        await Promise.all(interfaceWireless.map(async iface => {
            const [interfaceWirelessMonitor] = await Mikrotik.interfaceWirelessMonitor(iface['.id']);

            ctx.labels('noise-floor', iface.ssid).set(Number(interfaceWirelessMonitor['noise-floor']));
            ctx.labels('overall-tx-ccq', iface.ssid).set(Number(interfaceWirelessMonitor['overall-tx-ccq']));
            ctx.labels('registered-clients', iface.ssid).set(Number(interfaceWirelessMonitor['registered-clients']));
        }));
    },
};
