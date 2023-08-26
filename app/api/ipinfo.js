import {requestCache} from '@k03mad/request';

import env from '../../env.js';

/** */
class IPinfo {

    constructor() {
        this.urls = {
            api: 'https://ipinfo.io/',
        };

        this.options = {
            headers: {
                authorization: `Bearer ${env.ipinfo.token}`,
                accept: 'application/json',
            },
        };
    }

    /**
     * @param {string} ip
     * @param {object} [options]
     * @returns {Promise<object>}
     */
    async _getCache(ip, options = {}) {
        const {body} = await requestCache(this.urls.api + ip, {
            ...this.options,
            ...options,
        });

        return body;
    }

    /**
     * @param {string} ip
     * @returns {Promise<object>}
     */
    req(ip) {
        return this._getCache(ip);
    }

}
export default new IPinfo();
