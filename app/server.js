import {startMetricsServer} from '@k03mad/simple-prom';

import env from '../env.js';
import pkg from '../package.json' with {type: 'json'};

import * as metrics from './metrics/_index.js';

startMetricsServer({
    appName: pkg.name,
    port: env.server.port,
    debug: env.debug,
    metrics,
    metricsTurnOff: env.metrics.turnOff?.split(','),
});
