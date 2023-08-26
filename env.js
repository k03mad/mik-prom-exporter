import {errorText} from './app/helpers/colors.js';
import {throwPlainError} from './app/helpers/logging.js';

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
    },
    ipinfo: {
        token: process.env.npm_config_ipinfo || process.env.IPINFO_TOKEN,
    },
    debug: process.env.DEBUG,
};

const missedEnvNames = [];

[
    ...Object.entries(env.mikrotik),
    ...Object.entries(env.ipinfo),
].forEach(([key, value]) => {
    if (!value) {
        missedEnvNames.push(key);
    }
});

if (missedEnvNames.length > 0) {
    throwPlainError([
        errorText(` Mikrotik/IPinfo [${missedEnvNames.join(' + ')}] is not specified `),
        '> use env variables or npm parameters',
        '> see readme',
    ]);
}

export default env;
