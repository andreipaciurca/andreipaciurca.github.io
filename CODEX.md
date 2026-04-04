# CODEX - Resume System Manual
This is the master reference for the site's automated infrastructure.

## Operational Pipeline
1. **Trigger**: Push to `master` or Monthly Cron.
2. **Health Check**: Runs integration tests (`npm test`). If they fail, the pipeline stops (prevents broken builds).
3. **Extraction**: `scripts/update-resume.js` orchestrates the data flow.
4. **Synchronization**: Finalized `profile-data.js` is committed and pushed.

## Maintenance Commands
- **Check Pipeline Integrity**: `npm test`
- **Manual Sync**: `node scripts/update-resume.js`
- **Monitor Services**: `/health/` endpoint.
