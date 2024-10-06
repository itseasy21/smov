import axios from 'axios';
import { SitemapStream, streamToPromise } from 'sitemap';
import { createWriteStream } from 'fs';
import xmlFormatter from 'xml-formatter';
import { promisify } from 'util';
import { writeFile } from 'fs/promises';

const BASE_URL = 'https://coolmoviez.lol';
const TMDB_API_KEY = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIyOTIzODEzYzIwNWUzZDRjNGY4ZGVhNmFjZTQ2YTMwMiIsIm5iZiI6MTcyMzA1MTM1Mi44MjY2NTEsInN1YiI6IjY2YjNhYzM2YjMwNGY1Nzg1Y2UxODQwYyIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.Nx0oSk9Ts8LurGRrSZk5b-QE172zZ_dCLNT9WJJFLbc';
const PAGES_TO_FETCH = 35;
const CONCURRENT_REQUESTS = 5;
const RATE_LIMIT_DELAY = 250; // milliseconds

const headers = {
  "Authorization": `Bearer ${TMDB_API_KEY}`,
};

async function initPLimit() {
  const pLimit = (await import('p-limit')).default;
  return pLimit(CONCURRENT_REQUESTS);
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchPage(url, page) {
  await delay(RATE_LIMIT_DELAY);
  try {
    const response = await axios.get(`${url}&page=${page}`, { headers });
    return response.data.results;
  } catch (error) {
    console.error(`Error fetching page ${page}:`, error.message);
    return [];
  }
}

async function fetchData(url) {
  const limit = await initPLimit();
  const pages = Array.from({ length: PAGES_TO_FETCH }, (_, i) => i + 1);
  const results = await Promise.all(
    pages.map(page => limit(() => fetchPage(url, page)))
  );
  return results.flat();
}

async function fetchMovies() {
  return fetchData(`https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}&language=en-US`);
}

async function fetchTVShows() {
  return fetchData(`https://api.themoviedb.org/3/tv/popular?api_key=${TMDB_API_KEY}&language=en-US`);
}

function cleanTitle(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function generateSitemap() {
  const smStream = new SitemapStream({ hostname: BASE_URL });

  // Add static pages
  smStream.write({ url: '/', changefreq: 'daily', priority: 1.0 });
  smStream.write({ url: '/discover', changefreq: 'daily', priority: 0.8 });

  // Fetch movies and TV shows in parallel
  const [movies, tvShows] = await Promise.all([fetchMovies(), fetchTVShows()]);

  // Add movie pages
  movies.forEach(movie => {
    smStream.write({
      url: `/details/movie/${movie.id}-${cleanTitle(movie.title)}`,
      changefreq: 'weekly',
      priority: 0.7
    });
  });

  // Add TV show pages
  tvShows.forEach(show => {
    smStream.write({
      url: `/details/tv/${show.id}-${cleanTitle(show.name)}`,
      changefreq: 'weekly',
      priority: 0.7
    });
  });

  smStream.end();

  const sitemapData = await streamToPromise(smStream);
  const formattedSitemap = xmlFormatter(sitemapData.toString(), {
    indentation: '  ',
    collapseContent: true,
    lineSeparator: '\n'
  });

  await writeFile('./public/sitemap.xml', formattedSitemap);

  console.log('Sitemap generated successfully!');
  console.log(`Total movies: ${movies.length}`);
  console.log(`Total TV shows: ${tvShows.length}`);
}

generateSitemap().catch(console.error);
