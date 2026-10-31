/** @type {import('next').NextConfig} */
const nextConfig={
  transpilePackages:['@storymaster/contracts','@storymaster/domain','@storymaster/editor'],
  poweredByHeader:false,
  logging:{incomingRequests:false},
};
export default nextConfig;
