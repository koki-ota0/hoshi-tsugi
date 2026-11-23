# Agent notes — 星継

## Demo videos after every merge

Whenever a pull request for this repo is **merged** (or you are asked to merge one), record a demo of **that version** before moving on.

- Output: `recordings/<YYYY-MM-DD>-<shortsha>-<slug>/`
- Run: `DEMO_SHA=<full-or-short sha> npx tsx scripts/record-demo.ts`
- Capture **several angles** so later SNS edits have coverage, not a single take:
  - full playfield (aim + volley)
  - constellation / mid-boss / grand boss
  - square crop, cradle close-up, star close-up, 9:16 story pad
- Commit the clips in git (WebP; keep them small). Do not gitignore `recordings/`.
- If the engine or stages changed, update the scene list in `scripts/record-demo.ts`.
- See `recordings/README.md`.
