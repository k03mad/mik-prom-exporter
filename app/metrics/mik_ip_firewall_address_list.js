import env from '../../env.js';
import Mikrotik from '../api/mikrotik.js';
import {countDupsBy} from '../helpers/object.js';
import {getCurrentFilename} from '../helpers/paths.js';

const MERGE_DOMAINS = [
    'cdninstagram.com',
    'facebook.com',
    'fbcdn.net',
    'googlevideo.com',
    'gvt1.com',
    'instagram.com',
];

export default {
    name: getCurrentFilename(import.meta.url),
    help: 'ip/firewall/address-list',
    labelNames: ['type', 'name'],

    async collect(ctx) {
        ctx.reset();

        const ipFirewallAddressList = await Mikrotik.ipFirewallAddressList();

        const listsNames = {};

        ipFirewallAddressList.forEach(elem => {
            countDupsBy(elem.list, listsNames);
        });

        Object.entries(listsNames).forEach(([key, value]) => {
            ctx.labels('count', key).set(value);
        });

        if (env.mikrotik.toVpnList) {
            const matchedDomains = new Set();

            ipFirewallAddressList.forEach(elem => {
                if (elem.list === env.mikrotik.toVpnList && elem.comment) {
                    if (MERGE_DOMAINS.some(rule => elem.comment.endsWith(rule))) {
                        const splitted = elem.comment.split('.');
                        matchedDomains.add(`*.${splitted.at(-2)}.${splitted.at(-1)}`);
                    } else {
                        matchedDomains.add(elem.comment);
                    }
                }
            });

            [...matchedDomains].forEach((domain, i) => {
                ctx.labels('tovpn', domain).set(i + 1);
            });
        }
    },
};
