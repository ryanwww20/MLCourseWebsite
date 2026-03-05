/** @type {import('next').NextConfig} */
const BASE_PATH = '/course';

const nextConfig = {
  basePath: BASE_PATH,
  env: {
    NEXT_PUBLIC_BASE_PATH: BASE_PATH,
  },
};

export default nextConfig;

