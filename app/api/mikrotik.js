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

        return body[0];
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

        return body[0];
    }

    /**
     * @returns {Promise<object>}
     */
    resources() {
        return this._get('system/resource/print');
    }

}
export default new Mikrotik();