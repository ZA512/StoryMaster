/** @type {import('next').NextConfig} */
const nextConfig={
  transpilePackages:['@storymaster/contracts','@storymaster/domain'],
  poweredByHeader:false,
  logging:{incomingRequests:false},
};
export default nextConfig;
