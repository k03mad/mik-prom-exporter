/* eslint-disable unicorn/filename-case */

import Mikrotik from '../api/mikrotik.js';
import {getCurrentFilename} from '../helpers/paths.js';

export default {
    name: getCurrentFilename(import.meta.url),
    help: 'ip/firewall/mangle',
    labelNames: ['type', 'name'],

    async collect(ctx) {
        ctx.reset();

        const ipFirewallMangle = await Mikrotik.ipFirewallMangle();

        ipFirewallMangle
            .filter(elem => !Mikrotik.ipFirewallIsDummyRule(elem))
            .forEach(elem => ctx.labels('bytes', Mikrotik.formatFilterRule(elem)).set(Number(elem.bytes)));
    },
};
