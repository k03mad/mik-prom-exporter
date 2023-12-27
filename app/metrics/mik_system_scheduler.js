/* eslint-disable unicorn/filename-case */

import Mikrotik from '../api/mikrotik.js';
import {getCurrentFilename} from '../helpers/paths.js';

export default {
    name: getCurrentFilename(import.meta.url),
    help: 'system/scheduler',
    labelNames: ['type', 'name'],

    async collect(ctx) {
        ctx.reset();

        const systemScheduler = await Mikrotik.systemScheduler();

        systemScheduler.forEach(elem => {
            ctx.labels('run-count', elem.name).set(Number(elem['run-count']));
        });
    },
};
