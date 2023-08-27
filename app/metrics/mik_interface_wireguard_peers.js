import client from 'prom-client';

import Mikrotik from '../api/mikrotik.js';
import {getCurrentFilename} from '../helpers/paths.js';

export default new client.Gauge({
    name: getCurrentFilename(import.meta.url),
    help: 'interface/wireguard/peers',
    labelNames: ['type', 'name'],

    async collect() {
        this.reset();

        const peers = await Mikrotik.interfaceWireguardPeers();

        peers.forEach(peer => {
            this.labels('bytes', peer.comment).set(Number(peer.rx) + Number(peer.tx));
        });
    },
});
