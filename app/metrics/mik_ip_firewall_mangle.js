import Mikrotik from '../api/mikrotik.js';
import {getCurrentFilename} from '../helpers/paths.js';

export default {
    name: getCurrentFilename(import.meta.url),
    help: 'ip/firewall/mangle',
    labelNames: ['type', 'name'],

    async collect(ctx) {
        ctx.reset();

        const ipFirewallMangle = await Mikrotik.ipFirewallMangle();

        ipFirewallMangle.forEach(elem => {
            if (!Mikrotik.ipFirewallIsDummyRule(elem)) {
                ctx.labels('bytes', `[${elem.chain} ${elem.action}] ${elem.comment}`).set(Number(elem.bytes));
            }
        });
    },
};
