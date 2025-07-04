/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin(
  // This is the default location for the request config
  "./src/lib/i18n/config.ts",
);

/** @type {import("next").NextConfig} */
const config = {
  // Enable standalone output for Docker optimization
  output: "standalone",
};

export default withNextIntl(config);
