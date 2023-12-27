/* eslint-disable unicorn/filename-case */

import Mikrotik from '../api/mikrotik.js';
import {getCurrentFilename} from '../helpers/paths.js';

export default {
    name: getCurrentFilename(import.meta.url),
    help: 'queue/tree',
    labelNames: ['type', 'name'],

    async collect(ctx) {
        ctx.reset();

        const queueTree = await Mikrotik.queueTree();

        queueTree.forEach(elem => {
            ctx.labels('bytes', elem.name).set(Number(elem.bytes));
            ctx.labels('dropped', elem.name).set(Number(elem.dropped));
            ctx.labels('queued-bytes', elem.name).set(Number(elem['queued-bytes']));
            ctx.labels('rate', elem.name).set(Number(elem.rate));
        });
    },
};
