/**
 * Cloudinary delivery for the landing page's background clips.
 *
 * The masters (1080p–4K, ~87 MB total) live in Cloudinary rather than in
 * `public/`, so the repo carries none of their weight and one upload feeds
 * both the pinned desktop rail and the stacked mobile card. Cloudinary derives
 * each rendition on the fly and caches it at its edge.
 *
 * Renditions are sized by *height*, never width. The rail's box is ~754x600 —
 * far squarer than a 16:9 clip — so `object-cover` scales the source until its
 * height fills the box and crops the sides off. Width is the slack dimension:
 * asking for `w_1600` on a 16:9 master yields only 900px of height to cover
 * 600 CSS px, which is a 1.33x upscale on a retina panel. Upscaling is what
 * made the previous 640x360 clips look smeared, and it is invisible on a DPR 1
 * monitor, so it is worth stating rather than rediscovering.
 *
 * The cloud name is not a secret — it appears in every delivery URL — so it
 * ships to the client. Only `scripts/upload-videos.mjs` needs the API key and
 * secret, and those stay server-side.
 */

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

/** Folder the landing clips are uploaded under, mirrored by the upload script. */
export const VIDEO_FOLDER = "blackquant/landing";

/**
 * Rendition heights, in device pixels.
 *
 * Desktop covers the rail's 600 CSS px at DPR 2. Mobile covers the stacked
 * card, whose 16/10 box is ~460 CSS px tall; 720 is DPR 1.6 there, which the
 * accent tint and readability gradients make indistinguishable from a full
 * DPR 2 rendition while keeping the clip light on a phone connection.
 */
export const VIDEO_HEIGHT = { desktop: 1200, mobile: 720 } as const;

/**
 * Seconds kept from each master, and the frame rate they are resampled to.
 *
 * These are ambient loops behind four crossfades, so neither length nor 60fps
 * smoothness is doing any work — but both are most of the byte cost. Trimming
 * to 8s at 24fps roughly halves every clip with nothing visible given up.
 */
const DURATION = 8;
const FPS = 24;

/**
 * `q_auto:good` rather than `q_auto:best`.
 *
 * Measured across the four clips at h_1200: best totals 45 MB, good 15 MB, and
 * eco 11 MB. Compared frame-for-frame at true display scale, `best` is
 * indistinguishable from the other two — sharpness here is carried by
 * resolution, not bitrate, and the clips then sit under a 0.4-opacity accent
 * tint plus a panel gradient that covers the left ~40% of the frame. `good` is
 * taken over `eco` for the headroom: eco bands on smooth dark gradients, which
 * is most of this palette, and it only saves ~4 MB across the set.
 */
const QUALITY = "q_auto:good";

/** False when `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` is unset — callers omit the clip. */
export const cloudinaryConfigured = Boolean(CLOUD_NAME);

function deliver(publicId: string, transforms: string, ext: string) {
  return `https://res.cloudinary.com/${CLOUD_NAME}/video/upload/${transforms}/${VIDEO_FOLDER}/${publicId}.${ext}`;
}

/**
 * A background clip at `height` device pixels.
 *
 * `c_limit` caps without ever enlarging, so a master shorter than the request
 * is served at its own size rather than being upscaled server-side into the
 * same softness we are trying to avoid. `f_auto` negotiates VP9/AV1 where the
 * browser takes it and falls back to H.264 elsewhere.
 */
export function videoUrl(publicId: string, height: number) {
  return deliver(
    publicId,
    `f_auto,${QUALITY},c_limit,h_${height},du_${DURATION},fps_${FPS}`,
    "mp4",
  );
}

/**
 * A still from one second in, used as the `poster`.
 *
 * Without it the panel is flat black until the first frame decodes, which on
 * the pinned rail reads as a broken section because the clip only starts
 * loading once the observer fires. It is deliberately small — 600px and eco,
 * ~60 KB — because it is a placeholder behind a video that is already
 * preloading, and paying full rendition price twice would be silly.
 */
export function posterUrl(publicId: string) {
  return deliver(publicId, "so_1,f_auto,q_auto:eco,c_limit,h_600", "jpg");
}
