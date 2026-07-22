/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    if (isServer) {
      // PDFKit benötigt einige Node.js-Module
      config.externals.push('pdfkit');
    }
    return config;
  },
};
export default nextConfig;
