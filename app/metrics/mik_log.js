import Mikrotik from '../api/mikrotik.js';
import {countDupsBy} from '../helpers/object.js';
import {getCurrentFilename} from '../helpers/paths.js';

export default {
    name: getCurrentFilename(import.meta.url),
    help: 'log',
    labelNames: ['type', 'time', 'topics', 'message', 'key'],

    async collect(ctx) {
        ctx.reset();

        const log = await Mikrotik.log();

        const topics = {};

        log.forEach((item, i) => {
            ctx.labels('entries', item.time, item.topics, item.message, null).set(++i);
            countDupsBy(item.topics, topics);
        });

        Object.entries(topics).forEach(([key, value]) => {
            ctx.labels('topics', null, null, null, key).set(value);
        });
    },
};
