import os from 'node:os';

import {errorText} from './app/helpers/colors.js';
import {throwError} from './app/helpers/logging.js';

const env = {
    server: {
        port: process.env.npm_config_port
        || process.env.MIKROTIK_EXPORTER_PORT
        || 11_012,
    },
    mikrotik: {
        host: process.env.npm_config_host || process.env.MIKROTIK_HOST,
        user: process.env.npm_config_user || process.env.MIKROTIK_USER,
        password: process.env.npm_config_password || process.env.MIKROTIK_PASSWORD,
        toVpnList: process.env.npm_config_tovpn || process.env.MIKROTIK_TO_VPN_LIST,
        honeypotList: process.env.npm_config_honeypot || process.env.MIKROTIK_HONEYPOT_LIST,
    },
    geoip: {
        cacheDir: `${os.homedir()}/.ip2geo`,
    },
    debug: process.env.DEBUG,
};

const missedEnvNames = [];

Object.entries(env.mikrotik).forEach(([key, value]) => {
    if (!value) {
        missedEnvNames.push(key);
    }
});

if (missedEnvNames.length > 0) {
    throwError([
        errorText(` Mikrotik [${missedEnvNames.join(' + ')}] is not specified `),
        '> use env variables or npm parameters',
        '> see readme',
    ]);
}

export default env;
