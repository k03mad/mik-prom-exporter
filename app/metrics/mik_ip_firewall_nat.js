import Mikrotik from '../api/mikrotik.js';
import {getCurrentFilename} from '../helpers/paths.js';

export default {
    name: getCurrentFilename(import.meta.url),
    help: 'ip/firewall/nat',
    labelNames: ['type', 'name'],

    async collect(ctx) {
        ctx.reset();

        const ipFirewallNat = await Mikrotik.ipFirewallNat();

        ipFirewallNat
            .filter(elem => !Mikrotik.ipFirewallIsDummyRule(elem))
            .forEach(elem => ctx.labels('bytes', Mikrotik.formatFilterRule(elem)).set(Number(elem.bytes)));
    },
};
