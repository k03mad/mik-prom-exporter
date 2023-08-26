[ctrld-prom-exporter](https://github.com/k03mad/ctrld-prom-exporter) • mik-prom-exporter • [tin-invest-prom-exporter](https://github.com/k03mad/tin-invest-prom-exporter) • [ya-iot-prom-exporter](https://github.com/k03mad/ya-iot-prom-exporter)

# [Mikrotik — Prometheus] exporter

— [Get IPinfo token](https://ipinfo.io/account/token) \
— [Use correct Node.JS version](.nvmrc) \
— Start exporter:

```bash
npm run start --user=admin --password=123 --host=localhost:3030 --port=11000 --ipinfo=abc123
# or with envs
MIKROTIK_USER=admin MIKROTIK_PASSWORD=123 MIKROTIK_HOST=localhost:3030 MIKROTIK_EXPORTER_PORT=11000 IPINFO_TOKEN=abc123 npm run start
```

— Update Prometheus `scrape_configs` \
— [Import Grafana dashboard](grafana.json)
