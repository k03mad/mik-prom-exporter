# [Mikrotik — Prometheus] exporter

— [Use correct Node.JS version](.nvmrc) \
— Start exporter:

```bash
# one time
npm i

# start app
npm run start --user=admin --password=123 --host=localhost:3030 --port=11000 --turnoff=mik_log,mik_ip_dns
# or with envs
MIKROTIK_USER=admin MIKROTIK_PASSWORD=123 MIKROTIK_HOST=localhost:3030 MIKROTIK_EXPORTER_PORT=11000 MIKROTIK_EXPORTER_METRICS_TURN_OFF=mik_log,mik_ip_dns npm run start
```

[grafana-dashboards](https://github.com/k03mad/grafana-dashboards/tree/master/export)
