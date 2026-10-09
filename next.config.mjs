/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['three'],
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Permissions-Policy',
            value: 'camera=(self), accelerometer=(self), gyroscope=(self), magnetometer=(self)',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
