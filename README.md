# companion-module-streampulse

Bitfocus Companion module for [StreamPulse](https://github.com/jarbochov/StreamPulse). It builds buttons for timers, goals, alerts and sessions without typing URLs or JSON.

## Develop

```
npm install
npm run package
```

Load it in Companion as a developer module (point Companion's module dev path at this folder's parent), then add a "StreamPulse" connection.

The module polls `/api/status`, `/api/timers`, `/api/goals` and `/api/alerts`, and calls the control endpoints for actions. See `src/` for details.

This module is for personal use and isn't submitted to Bitfocus's module list. The Bitfocus CI workflows were removed because they require yarn; restore them from the template if you publish it.

## Releasing

Bump `version` in `package.json`, commit, then push a matching tag (for example `v0.1.0`). The Release workflow builds the module package and attaches the `.tgz` to a GitHub release. Submitting to Bitfocus is manual.
