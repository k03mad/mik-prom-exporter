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
    resources() {
        return this._get('system/resource/print');
    }

    /**
     * @returns {Promise<object>}
     */
    dns() {
        return this._get('ip/dns/print');
    }

    /**
     * @returns {Promise<object>}
     */
    dnsCache() {
        return this._get('ip/dns/cache/print');
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
    update() {
        return this._getCache('system/package/update/print');
    }

    /**
     * @returns {Promise<object>}
     */
    firewallFilter() {
        return this._get('ip/firewall/filter/print');
    }

    /**
     * @returns {Promise<object>}
     */
    firewallNat() {
        return this._get('ip/firewall/nat/print');
    }

    /**
     * @returns {Promise<object>}
     */
    firewallMangle() {
        return this._get('ip/firewall/mangle/print');
    }

    /**
     * @returns {Promise<object>}
     */
    firewallRaw() {
        return this._get('ip/firewall/raw/print');
    }

    /**
     * @param {object} rule
     * @param {string} rule.comment
     * @returns {boolean}
     */
    isDummyRule(rule) {
        return rule.comment.includes('dummy');
    }

}
export default new Mikrotik();
