• [ctrld-prom-exporter](https://github.com/k03mad/ctrld-prom-exporter) \
• mik-prom-exporter \
• [mosobleirc-prom-exporter](https://github.com/k03mad/mosobleirc-prom-exporter) \
• [ping-prom-exporter](https://github.com/k03mad/ping-prom-exporter) \
• [sys-prom-exporter](https://github.com/k03mad/sys-prom-exporter) \
• [tin-invest-prom-exporter](https://github.com/k03mad/tin-invest-prom-exporter) \
• [ya-iot-prom-exporter](https://github.com/k03mad/ya-iot-prom-exporter)

:: [grafana-dashboards](https://github.com/k03mad/grafana-dashboards/tree/master/export) ::

# [Mikrotik — Prometheus] exporter

— [Use correct Node.JS version](.nvmrc) \
— Start exporter:

```bash
# one time
npm run setup

# start app
npm run start --user=admin --password=123 --host=localhost:3030 --port=11000
# or with envs
MIKROTIK_USER=admin MIKROTIK_PASSWORD=123 MIKROTIK_HOST=localhost:3030 MIKROTIK_EXPORTER_PORT=11000 npm run start
```
