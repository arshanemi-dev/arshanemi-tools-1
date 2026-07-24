/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        // Apply this header to your PDF route (or all routes '/:path*')
        source: '/pdf-tool/:path*', 
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*', // Allows cross-origin requests
          },
          {
            key: 'Content-Security-Policy',
            // MUST specify 'frame-ancestors *' so external sites can embed this page
            value: "frame-ancestors *", 
          },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'dl.dropboxusercontent.com' },
      { protocol: 'https', hostname: 'www.dropbox.com' },
    ],
  },
}

export default nextConfig
