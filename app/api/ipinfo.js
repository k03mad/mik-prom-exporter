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
     * @param {object} [cacheOptions]
     * @returns {Promise<object>}
     */
    async _getCache(ip, options = {}, cacheOptions = {}) {
        const {body} = await requestCache(this.urls.api + ip, {
            ...this.options,
            ...options,
        }, cacheOptions);

        return body;
    }

    /**
     * @param {string} ip
     * @returns {Promise<object>}
     */
    req(ip) {
        // 7 days cache
        return this._getCache(ip, {}, {expire: 604_800});
    }

}
export default new IPinfo();
