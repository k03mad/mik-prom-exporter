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
        });

        return body;
    }

    /**
     * @returns {Promise<object>}
     */
    systemResource() {
        return this._get('system/resource/print');
    }

    /**
     * @returns {Promise<object>}
     */
    ipDns() {
        return this._get('ip/dns/print');
    }

    /**
     * @returns {Promise<object>}
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
     * @returns {Promise<object>}
     */
    interface() {
        return this._get('interface/print');
    }

    /**
     * @param {string} name
     * @returns {Promise<object>}
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
     * @returns {Promise<object>}
     */
    systemPackageUpdate() {
        return this._getCache('system/package/update/print');
    }

    /**
     * @returns {Promise<object>}
     */
    ipFirewallFilter() {
        return this._get('ip/firewall/filter/print');
    }

    /**
     * @returns {Promise<object>}
     */
    ipFirewallNat() {
        return this._get('ip/firewall/nat/print');
    }

    /**
     * @returns {Promise<object>}
     */
    ipFirewallMangle() {
        return this._get('ip/firewall/mangle/print');
    }

    /**
     * @returns {Promise<object>}
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
        return rule.comment.includes('dummy');
    }

    /**
     * @returns {Promise<object>}
     */
    ipFirewallConnection() {
        return this._get('ip/firewall/connection/print');
    }

    /**
     * @returns {Promise<object>}
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
     * @returns {Promise<object>}
     */
    ipFirewallAddressList() {
        return this._get('ip/firewall/address-list/print');
    }

    /**
     * @returns {Promise<object>}
     */
    systemScheduler() {
        return this._get('system/scheduler/print');
    }

    /**
     * @returns {Promise<object>}
     */
    systemScript() {
        return this._get('system/script/print');
    }

    /**
     * @returns {Promise<object>}
     */
    interfaceWireguardPeers() {
        return this._get('interface/wireguard/peers/print');
    }

    /**
     * @returns {Promise<object>}
     */
    interfaceWirelessRegistrationTable() {
        return this._get('interface/wireless/registration-table/print');
    }

}
export default new Mikrotik();
