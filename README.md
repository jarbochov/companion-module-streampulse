# companion-module-streampulse

Bitfocus Companion module for [StreamPulse](https://github.com/jarbochov/StreamPulse). It builds buttons for timers, goals, alerts and sessions without typing URLs or JSON.

## Develop

```
npm install
npm run package
```

Load it in Companion as a developer module (point Companion's module dev path at this folder's parent), then add a "StreamPulse" connection.

**Versus Studio:** actions for scores, clock/race control (start, pause, reset, per-runner finish, None), swap sides, queue and Save Progress; variables `matchup_title`, `matchup_c1_score`, `matchup_c1_time`, `matchup_clock` and more; feedbacks for clock running and runner finished.

**Tier Maker Studio:** actions to start votes on specific or next unranked items, freeze/lock voting without placing, lock & place consensus into tier, cancel votes, reset item placements, and load template presets; variables for `tier_voting`, `tier_vote_status`, `tier_item`, `tier_votes`, `tier_consensus`, `tier_agreement`, `tier_time`, `tier_title`; feedbacks for `tier_voting_active`, `tier_vote_locked`, and `tier_consensus_tier`; button presets for starting votes, locking votes, placing consensus, and cancelling votes.

**Trivia Studio:** start a selected question, reveal, navigate, reset played marks, shuffle, load packs, or vote. Phase feedback and question/vote/countdown variables follow the server's live state; correct-answer variables stay empty until reveal. Disabling Chat Voting in StreamPulse also silences automatic trivia announcements.

Trivia's saved Reveal Delay waits after the countdown reaches zero; voting closes at zero while the phase remains `question` until reveal. Auto-Advance Delay separately holds the revealed answer. The Companion Reveal action always reveals immediately, bypassing a pending delay.

**Clear Current Question** hides the overlay without resetting played marks. New Start actions and presets default to duration zero, inheriting the studio duration for every question; existing positive duration overrides remain explicit overrides. StreamPulse's **Randomize Choices** toggle shuffles live choices while preserving the correct answer; letter votes follow the displayed order.

**Speaker Badges:** select a badge by overlay and layer; update its name, avatar URL/media-library path, handle, pronouns, call-in location or status label; select its OBS audio input by exact name; show, hide or toggle the avatar, handle, pronouns, call-in mode and location. Updates preserve other badge fields and styling. Per-badge identity/visibility variables and feedbacks accompany ready-to-use detail-toggle presets. Speaker discovery refreshes every 30 seconds; live overlay changes also arrive over WebSocket.

**OBS health:** connection, connecting, connection status, Scene Sync enablement, current program scene, active motion engine and last error variables, plus connection/Scene Sync feedbacks and status presets. These use the existing `/api/status` snapshot, not extra OBS polling. OBS audio works for speaker badges without enabling Scene Sync; high-frequency audio meters are not exposed as Companion variables.

**Action Search Organization:** All actions feature clear category prefixes (`Alerts:`, `Overlay:`, `Speaker Badge:`, `Tier Maker:`, `Polls:`, `Poll Tournament:`, `Versus:`, `Tournament:`, `Randomizer:`, `Chat Bot:`, `Variables:`, `Timer:`, `Goal:`, `Production:`, `Session:`, `Server:`) and contiguous grouping so related commands appear together when searching or scrolling in Companion.

Runner finish, toggle, and reset actions address the selected runner explicitly, including runners 2–4. Existing button configurations do not need to change.

**Poll Tournament library:** save the active bracket as a reusable template, save a progress checkpoint, load saved history/checkpoints, or create a fresh bracket from a template. Load/create buttons require an explicit confirmation option and a library ID; see `companion/HELP.md` for the ID workflow. Library data is fetched only when needed by an action, not added to background polling.

Live state uses WebSocket updates with HTTP fallback at the configured polling interval. Related alert/media updates coalesce over 100 ms; HTTP requests run in batches of at most four. With WebSocket connected, background refreshes run at five times the polling interval. Discovery lists, presets, chatbot and speakers refresh every 30 seconds; actions force a discovery refresh. Optional endpoint failures preserve their previous values, and stale responses cannot overwrite newer events or a reconfigured connection.

The `Alerts: Fire alert or announcement` action calls `POST /api/alerts/trigger` (pick a rule or announcement, optional text override). The `Alerts: mute display` action, `alerts_muted` variable and feedback follow `POST /api/alerts/mute` (for panic buttons). Randomizer actions inherit Studio/overlay settings unless overridden, and support wheel, roller, or card-deck modes, 4/6/8/10-second durations, winner auto-hide after 8/15/30 seconds or never, on-screen button visibility/phrase presets, custom phrases, and winner text. Randomizer presets show the last-used mode and spin duration. See `src/` for details.

This module is for personal use and isn't submitted to Bitfocus's module list. The Bitfocus CI workflows were removed because they require yarn; restore them from the template if you publish it.

## Releasing

Bump `version` in `package.json`, commit, then push a matching tag (for example `v0.1.0`). The Release workflow builds the module package and attaches the `.tgz` to a GitHub release. Submitting to Bitfocus is manual.
