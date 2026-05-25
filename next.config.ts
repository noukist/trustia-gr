import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Point next-intl at our server-side request config
const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  /* config options here */
};

export default withNextIntl(nextConfig);
