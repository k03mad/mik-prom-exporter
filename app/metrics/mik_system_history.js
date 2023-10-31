import Mikrotik from '../api/mikrotik.js';
import {getCurrentFilename} from '../helpers/paths.js';

const removeNewLine = str => str.replaceAll(/(\\|\s{2,})/g, '');

export default {
    name: getCurrentFilename(import.meta.url),
    help: 'system/history',
    labelNames: ['time', 'action', 'by', 'policy', 'redo', 'undo'],

    async collect(ctx) {
        ctx.reset();

        const systemHistory = await Mikrotik.systemHistory();

        systemHistory.forEach((item, i) => {
            ctx.labels(
                item.time,
                item.action,
                item.by,
                item.policy,
                removeNewLine(item.redo),
                removeNewLine(item.undo),
            ).set(++i);
        });
    },
};
