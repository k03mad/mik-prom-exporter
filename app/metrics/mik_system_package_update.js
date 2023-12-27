/* eslint-disable unicorn/filename-case */

import Mikrotik from '../api/mikrotik.js';
import {getCurrentFilename} from '../helpers/paths.js';

export default {
    name: getCurrentFilename(import.meta.url),
    help: 'system/package/update',
    labelNames: ['type', 'value'],

    async collect(ctx) {
        ctx.reset();

        const systemPackageUpdateCheck = await Mikrotik.systemPackageUpdateCheck();
        const lastMessage = systemPackageUpdateCheck.at(-1);

        ctx.labels('channel', lastMessage.channel).set(1);
        ctx.labels('installed-version', lastMessage['installed-version']).set(1);
        ctx.labels('latest-version', lastMessage['latest-version']).set(1);
        ctx.labels('status', lastMessage.status).set(1);
    },
};
