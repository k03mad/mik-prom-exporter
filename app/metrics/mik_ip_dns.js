import Mikrotik from '../api/mikrotik.js';
import {getCurrentFilename} from '../helpers/paths.js';

export default {
    name: getCurrentFilename(import.meta.url),
    help: 'ip/dns',
    labelNames: ['type'],

    async collect(ctx) {
        ctx.reset();

        const [ipDns] = await Mikrotik.ipDns();

        ctx.labels('cache-used').set(Number(ipDns['cache-used']));
    },
};
