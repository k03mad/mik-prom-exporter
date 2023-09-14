import Mikrotik from '../api/mikrotik.js';
import {getCurrentFilename} from '../helpers/paths.js';

export default {
    name: getCurrentFilename(import.meta.url),
    help: 'system/resource',
    labelNames: ['type', 'value'],

    async collect(ctx) {
        ctx.reset();

        const [systemResource] = await Mikrotik.systemResource();

        // mhz => hz
        ctx.labels('cpu-frequency', null).set(Number(systemResource['cpu-frequency']) * 1_000_000);
        ctx.labels('cpu-load', null).set(Number(systemResource['cpu-load']));

        const totalMemory = Number(systemResource['total-memory']);
        ctx.labels('total-memory', null).set(totalMemory);
        ctx.labels('used-memory', null).set(totalMemory - Number(systemResource['free-memory']));

        const totalHdd = Number(systemResource['total-hdd-space']);
        ctx.labels('total-hdd-space', null).set(totalHdd);
        ctx.labels('used-hdd-space', null).set(totalHdd - Number(systemResource['free-hdd-space']));

        ctx.labels('uptime', systemResource.uptime.replaceAll(/([a-z])/g, '$1 ').trim()).set(1);
    },
};
