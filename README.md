# For Eve

A small three-page gift site built with Next.js (App Router), ready to deploy on Vercel.

1. **`/`**: welcome message and a 6-digit passcode. The PIN is checked on the server. The right PIN sets a signed, httpOnly cookie that lasts 12 hours.
2. **`/video`**: the video with normal player controls. A **Start the game** button appears when the video ends.
3. **`/game`**: a "higher or lower" number game (1–100). The site's number is **55** (18 + 11 + 26 → 18/11/26).

`/video`, `/game` and everything under `/media` are protected twice. `src/proxy.ts` blocks requests without a valid cookie, and each page checks the cookie again on the server. Opening a protected URL directly sends you back to the PIN page, and the video file itself returns 404.

## Add the video

Put the video file at:

```
public/media/video.mp4
```

To use a different name, change `VIDEO_SRC` in `src/lib/config.ts`. MP4 (H.264) plays in every browser. iPhone `.mov` files also usually work if renamed to `.mp4`. Keep the file **under 100 MB**, because GitHub rejects larger files. You can shrink it with HandBrake or QuickTime's *File → Export As → 1080p*.

## Run locally

```bash
npm install
cp .env.example .env.local   # then set ACCESS_PIN (and SESSION_SECRET)
npm run dev
```

## Deploy to Vercel

1. Import this GitHub repo in Vercel. The framework (Next.js) is detected automatically.
2. In **Project → Settings → Environment Variables**, add:
   - `ACCESS_PIN`: the 6-digit passcode
   - `SESSION_SECRET`: any long random string (for example from `openssl rand -hex 32`)
3. Deploy. If you change these variables later, redeploy.

The PIN is deliberately not stored in the code, because this repository is public.

## Tweaks

- Who asks first in the game: `FIRST_ASKER` in `src/lib/game.ts`
- The site's number and its explanation: `MY_NUMBER` / `MY_NUMBER_PARTS` in `src/lib/game.ts`
- How long the unlock lasts: `ACCESS_TTL_SECONDS` in `src/lib/access-token.ts`
