/**
 * Every photo on the public site, served from /public/photos.
 * Stock photography from Unsplash (free Unsplash License); credits in /docs/brand/CREDITS.md.
 * TODO(owner): swap in photos of the salon itself as soon as you have them. Keep the file names.
 */
export const photos = {
  hero: '/photos/hero.jpg',
  heroCraft: '/photos/work-beard-shape.jpg',
  heroTools: '/photos/about-tools.jpg',
  aboutInterior: '/photos/about-interior.jpg',
  aboutTools: '/photos/about-tools.jpg',
  featuredPackage: '/photos/featured-package.jpg',
  work: {
    lineUp: '/photos/work-line-up.jpg',
    beardShape: '/photos/work-beard-shape.jpg',
    taper: '/photos/work-taper.jpg',
    styling: '/photos/work-styling.jpg',
    texture: '/photos/work-texture.jpg',
    fullBeard: '/photos/work-full-beard.jpg',
  },
} as const;
