import pkg from "../package.json";

/** The site's release number (from package.json) and, on Vercel, the short id of the code that is running. */
export const SITE_VERSION: string = pkg.version;
export const BUILD_ID = (process.env.VERCEL_GIT_COMMIT_SHA ?? "").slice(0, 7);
