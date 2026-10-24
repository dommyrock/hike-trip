import { defineConfig } from 'astro/config';

// Static, zero-JS-by-default site. The map is a single client-side island.
export default defineConfig({
  // the production origin — Base.astro builds the absolute og:url / og:image
  // link-preview URLs from it
  site: 'https://hike-trip.dominik-polzer.workers.dev',
});
