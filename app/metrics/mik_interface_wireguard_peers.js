/* eslint-disable unicorn/filename-case */

import Mikrotik from '../api/mikrotik.js';
import {getCurrentFilename} from '../helpers/paths.js';

export default {
    name: getCurrentFilename(import.meta.url),
    help: 'interface/wireguard/peers',
    labelNames: ['type', 'name'],

    async collect(ctx) {
        ctx.reset();

        const peers = await Mikrotik.interfaceWireguardPeers();

        peers.forEach(peer => {
            ctx.labels('bytes', peer.comment).set(Number(peer.rx) + Number(peer.tx));
        });
    },
};
