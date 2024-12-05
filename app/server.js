import os from 'node:os';
import path from 'node:path';

import {ip2geo} from '@k03mad/ip2geo';
import {logError} from '@k03mad/simple-log';
import {startMetricsServer} from '@k03mad/simple-prom';

import env from '../env.js';

import {packageJson} from './helpers/parse.js';
import * as metrics from './metrics/_index.js';

try {
    await ip2geo({
        ip: '1.1.1.1',
        cacheDir: path.join(os.tmpdir(), `.ip2geo-cache/${Date.now()}`),
    });
} catch (err) {
    logError(err);

    if (err?.message?.includes("You've hit the monthly limit")) {
        globalThis.ip2geoLimitExceed = true;
    }
}

startMetricsServer({
    appName: packageJson.name,
    port: env.server.port,
    debug: env.debug,
    metrics,
    metricsTurnOff: env.metrics.turnOff?.split(','),
});
