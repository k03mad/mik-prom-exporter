/* eslint-disable unicorn/filename-case */

import Mikrotik from '../api/mikrotik.js';
import {getCurrentFilename} from '../helpers/paths.js';

export default {
    name: getCurrentFilename(import.meta.url),
    help: 'tool/netwatch',
    labelNames: ['comment'],

    async collect(ctx) {
        ctx.reset();

        const toolNetwatch = await Mikrotik.toolNetwatch();

        toolNetwatch.forEach(({comment, status}) => {
            ctx.labels(comment).set(status === 'up' ? 1 : 0);
        });
    },
};
