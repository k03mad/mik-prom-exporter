import Mikrotik from '../api/mikrotik.js';
import {getCurrentFilename} from '../helpers/paths.js';

export default {
    name: getCurrentFilename(import.meta.url),
    help: 'ip/firewall/raw',
    labelNames: ['type', 'name'],

    async collect(ctx) {
        ctx.reset();

        const ipFirewallRaw = await Mikrotik.ipFirewallRaw();

        ipFirewallRaw
            .filter(elem => !Mikrotik.ipFirewallIsDummyRule(elem))
            .forEach((elem, i) => ctx.labels('bytes', Mikrotik.formatFilterRule(elem, i)).set(Number(elem.bytes)));
    },
};
