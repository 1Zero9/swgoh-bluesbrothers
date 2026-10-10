/** The site's public address with no trailing slash, so `${siteUrl()}/path` is always a clean link. */
export function siteUrl() {
  return (process.env.SITE_URL || "https://swgoh-bluesbrothers.vercel.app").replace(/\/+$/, "");
}
