# companion-module-streampulse

Bitfocus Companion module for [StreamPulse](https://github.com/jarbochov/StreamPulse). It builds buttons for timers, goals, alerts and sessions without typing URLs or JSON.

## Develop

```
npm install
npm run package
```

Load it in Companion as a developer module (point Companion's module dev path at this folder's parent), then add a "StreamPulse" connection.

The module polls `/api/status`, `/api/timers`, `/api/goals` and `/api/alerts`, and calls the control endpoints for actions. See `src/` for details.
