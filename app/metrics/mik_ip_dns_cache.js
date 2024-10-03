import Mikrotik from '../api/mikrotik.js';
import {countDupsBy} from '../helpers/object.js';
import {getCurrentFilename} from '../helpers/paths.js';

export default {
    name: getCurrentFilename(import.meta.url),
    help: 'ip/dns/cache',
    labelNames: ['type', 'record'],

    async collect(ctx) {
        ctx.reset();

        const ipDnsCache = await Mikrotik.ipDnsCache();

        const dnsCacheTypes = {};

        ipDnsCache.forEach(elem => {
            if (elem.type) {
                countDupsBy(elem.type, dnsCacheTypes);
            }
        });

        Object.entries(dnsCacheTypes).forEach(([key, value]) => {
            ctx.labels('records', key).set(value);
        });
    },
};
