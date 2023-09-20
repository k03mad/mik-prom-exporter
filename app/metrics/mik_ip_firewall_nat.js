import Mikrotik from '../api/mikrotik.js';
import {getCurrentFilename} from '../helpers/paths.js';

export default {
    name: getCurrentFilename(import.meta.url),
    help: 'ip/firewall/nat',
    labelNames: ['type', 'name'],

    async collect(ctx) {
        ctx.reset();

        const ipFirewallNat = await Mikrotik.ipFirewallNat();

        ipFirewallNat.forEach((elem, i) => {
            if (!Mikrotik.ipFirewallIsDummyRule(elem)) {
                ctx.labels('bytes', Mikrotik.formatFilterRule(elem, i)).set(Number(elem.bytes));
            }
        });
    },
};
