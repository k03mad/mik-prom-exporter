import os from 'node:os';

import client from 'prom-client';

import env from '../env.js';
import {packageJson} from './helpers/parse.js';
import metrics from './metrics/_index.js';

const register = new client.Registry();

register.setDefaultLabels({
    app: packageJson.name,
    host: os.hostname,
    port: env.server.port,
});

Object
    .values(metrics)
    .forEach(metric => register.registerMetric(metric));

export default register;
