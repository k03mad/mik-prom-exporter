import {request, requestCache} from '@k03mad/request';

import env from '../../env.js';

/** */
class Mikrotik {

    constructor() {
        this.urls = {
            api: `http://${env.mikrotik.host}/rest/`,
        };

        this.options = {
            method: 'POST',
            username: env.mikrotik.user,
            password: env.mikrotik.password,
        };
    }

    /**
     * @param {string} path
     * @param {object} [options]
     * @returns {Promise<object>}
     */
    async _get(path, options = {}) {
        const {body} = await request(this.urls.api + path, {
            ...this.options,
            ...options,
        });

        return body;
    }

    /**
     * @param {string} path
     * @param {object} [options]
     * @returns {Promise<object>}
     */
    async _getCache(path, options = {}) {
        const {body} = await requestCache(this.urls.api + path, {
            ...this.options,
            ...options,
        }, {expire: 3600});

        return body;
    }

    /**
     * @returns {Promise<Array<object>>}
     */
    systemResource() {
        return this._get('system/resource/print');
    }

    /**
     * @returns {Promise<Array<object>>}
     */
    ipDns() {
        return this._get('ip/dns/print');
    }

    /**
     * @returns {Promise<Array<object>>}
     */
    ipDnsCache() {
        return this._get('ip/dns/cache/print');
    }

    /**
     * @returns {Promise<object>}
     */
    async ipDnsCacheToName() {
        const ipToName = {};
        const cache = await this.ipDnsCache();

        cache.forEach(elem => {
            if (
                elem.type === 'A'
                && elem.data?.includes('.')
                && elem.name?.includes('.')
            ) {
                ipToName[elem.data] = elem.name;
            }
        });

        return ipToName;
    }

    /**
     * @returns {Promise<Array<object>>}
     */
    interface() {
        return this._get('interface/print');
    }

    /**
     * @param {string} name
     * @returns {Promise<Array<object>>}
     */
    interfaceMonitorTraffic(name) {
        return this._get('interface/monitor-traffic', {
            json: {
                interface: name,
                once: true,
            },
        });
    }

    /**
     * @returns {Promise<Array<object>>}
     */
    systemPackageUpdateCheck() {
        return this._getCache('system/package/update/check-for-updates');
    }

    /**
     * @returns {Promise<Array<object>>}
     */
    ipFirewallFilter() {
        return this._get('ip/firewall/filter/print');
    }

    /**
     * @returns {Promise<Array<object>>}
     */
    ipFirewallNat() {
        return this._get('ip/firewall/nat/print');
    }

    /**
     * @returns {Promise<Array<object>>}
     */
    ipFirewallMangle() {
        return this._get('ip/firewall/mangle/print');
    }

    /**
     * @returns {Promise<Array<object>>}
     */
    ipFirewallRaw() {
        return this._get('ip/firewall/raw/print');
    }

    /**
     * @param {object} rule
     * @param {string} rule.comment
     * @returns {boolean}
     */
    ipFirewallIsDummyRule(rule) {
        return rule.comment?.includes('dummy');
    }

    /**
     * @returns {Promise<Array<object>>}
     */
    ipFirewallConnection() {
        return this._get('ip/firewall/connection/print');
    }

    /**
     * @returns {Promise<Array<object>>}
     */
    ipDhcpServerLease() {
        return this._getCache('ip/dhcp-server/lease/print');
    }

    /**
     * @returns {Promise<object>}
     */
    async ipDhcpServerLeaseToName() {
        const ipToName = {};
        const leases = await this.ipDhcpServerLease();

        leases.forEach(lease => {
            if (lease.comment) {
                ipToName[lease.address] = lease.comment;
            }
        });

        return ipToName;
    }

    /**
     * @returns {Promise<Array<object>>}
     */
    ipFirewallAddressList() {
        return this._get('ip/firewall/address-list/print');
    }

    /**
     * @returns {Promise<Array<object>>}
     */
    systemScheduler() {
        return this._getCache('system/scheduler/print');
    }

    /**
     * @returns {Promise<Array<object>>}
     */
    systemScript() {
        return this._getCache('system/script/print');
    }

    /**
     * @returns {Promise<Array<object>>}
     */
    interfaceWireguardPeers() {
        return this._get('interface/wireguard/peers/print');
    }

    /**
     * @returns {Promise<Array<object>>}
     */
    interfaceWirelessRegistrationTable() {
        return this._get('interface/wireless/registration-table/print');
    }

    /**
     * @returns {Promise<Array<object>>}
     */
    interfaceWireless() {
        return this._get('interface/wireless/print');
    }

    /**
     * @param {string} id
     * @returns {Promise<Array<object>>}
     */
    interfaceWirelessMonitor(id) {
        return this._get('interface/wireless/monitor', {
            json: {
                numbers: id,
                once: true,
            },
        });
    }

    /**
     * @returns {Promise<Array<object>>}
     */
    toolNetwatch() {
        return this._get('tool/netwatch/print');
    }

    /**
     * @param {object} rule
     * @param {string|number} i
     * @returns {string}
     */
    formatFilterRule(rule, i) {
        const params = [
            'comment',
            'action',
            'chain',
            'in-interface-list',
            'in-interface',
            'out-interface-list',
            'out-interface',
            'protocol',
            'src-address',
            'src-port',
            'dst-address',
            'dst-port',
            'src-address-list',
            'dst-address-list',
            'address-list',
            'address-list-timeout',
            'tcp-flags',
            'connection-state',
            'connection-nat-state',
            'new-mss',
            'new-routing-mark',
        ];

        const str = params
            .map(elem => rule[elem])
            .filter(Boolean)
            .join(' :: ');

        return `${++i}. ${str}`;
    }

}
export default new Mikrotik();
