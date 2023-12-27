/* eslint-disable unicorn/filename-case */

import Mikrotik from '../api/mikrotik.js';
import {countDupsBy} from '../helpers/object.js';
import {getCurrentFilename} from '../helpers/paths.js';

export default {
    name: getCurrentFilename(import.meta.url),
    help: 'ip/proxy/connections',
    labelNames: ['type', 'name'],

    async collect(ctx) {
        ctx.reset();

        const bySrcCount = {};
        const byDstCount = {};
        const bySrcBytes = {};
        const byDstBytes = {};

        const ipProxyConnections = await Mikrotik.ipProxyConnections();
        const connectionsClient = ipProxyConnections.filter(elem => elem.client === 'true');

        connectionsClient.forEach(elem => {
            const bytes = Number(elem['rx-bytes']) + Number(elem['tx-bytes']);
            countDupsBy(elem['src-address'], bySrcBytes, bytes);
            countDupsBy(elem['dst-address'], byDstBytes, bytes);

            countDupsBy(elem['src-address'], bySrcCount);
            countDupsBy(elem['dst-address'], byDstCount);
        });

        Object.entries(bySrcCount).forEach(([key, value]) => {
            ctx.labels('src-count', key).set(value);
        });

        Object.entries(byDstCount).forEach(([key, value]) => {
            ctx.labels('dst-count', key).set(value);
        });

        Object.entries(bySrcBytes).forEach(([key, value]) => {
            ctx.labels('src-bytes', key).set(value);
        });

        Object.entries(byDstBytes).forEach(([key, value]) => {
            ctx.labels('dst-bytes', key).set(value);
        });
    },
};
