rebas-datasource
===

Rebas datasource util


## API

### .http(uri, options)

连接 http接口

## EXAMPLE

```
npm run example
```

## AB

http
```
ab -c 10 -n 100 http://127.0.0.1:8082/http
...
Requests per second:    44.35 [#/sec] (mean)
Time per request:       225.502 [ms] (mean)
Time per request:       22.550 [ms] (mean, across all concurrent requests)
```

http/pipe
```
ab -c 10 -n 100 http://127.0.0.1:8082/http/pipe
...
Requests per second:    53.39 [#/sec] (mean)
Time per request:       187.308 [ms] (mean)
Time per request:       18.731 [ms] (mean, across all concurrent requests)
```
