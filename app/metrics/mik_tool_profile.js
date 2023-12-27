/* eslint-disable unicorn/filename-case */

import Mikrotik from '../api/mikrotik.js';
import {getCurrentFilename} from '../helpers/paths.js';

export default {
    name: getCurrentFilename(import.meta.url),
    help: 'tool/profile',
    labelNames: ['name'],

    async collect(ctx) {
        ctx.reset();

        const stats = {};
        const toolProfile = await Mikrotik.toolProfile();

        toolProfile.forEach(({name, usage}) => {
            const usageNum = Number(usage);

            if (!stats[name] || stats[name] < usageNum) {
                stats[name] = usageNum;
            }
        });

        Object.entries(stats).forEach(([key, value]) => {
            ctx.labels(key).set(value);
        });
    },
};
