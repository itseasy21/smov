const axios = require('axios');
const { SitemapStream, streamToPromise } = require('sitemap');
const { createWriteStream } = require('fs');
const xmlFormatter = require('xml-formatter');

const BASE_URL = 'https://coolmoviez.lol'; // Replace with your actual base URL
const TMDB_API_KEY = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIyOTIzODEzYzIwNWUzZDRjNGY4ZGVhNmFjZTQ2YTMwMiIsIm5iZiI6MTcyMzA1MTM1Mi44MjY2NTEsInN1YiI6IjY2YjNhYzM2YjMwNGY1Nzg1Y2UxODQwYyIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.Nx0oSk9Ts8LurGRrSZk5b-QE172zZ_dCLNT9WJJFLbc';

const headers = {
  "Authorization": `Bearer ${TMDB_API_KEY}`,
}
async function fetchMovies(page = 1, results = []) {
  const response = await axios.get(`https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}&language=en-US&page=${page}`, {headers});
  results = results.concat(response.data.results);
  
  if (page < 15) { // Fetch 5 pages of results, adjust as needed
    return fetchMovies(page + 1, results);
  }
  
  return results;
}

async function fetchTVShows(page = 1, results = []) {
  const response = await axios.get(`https://api.themoviedb.org/3/tv/popular?api_key=${TMDB_API_KEY}&language=en-US&page=${page}`, {headers});
  results = results.concat(response.data.results);
  
  if (page < 15) { // Fetch 5 pages of results, adjust as needed
    return fetchTVShows(page + 1, results);
  }
  
  return results;
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
  const writableStream = createWriteStream('./public/sitemap.xml');

  // Add static pages
  smStream.write({ url: '/', changefreq: 'daily', priority: 1.0 });
  smStream.write({ url: '/discover', changefreq: 'daily', priority: 0.8 });

  // Fetch and add movie pages
  const movies = await fetchMovies();
  movies.forEach(movie => {
    smStream.write({
      url: `/details/movie/${movie.id}-${cleanTitle(movie.title)}`,
      changefreq: 'weekly',
      priority: 0.7
    });
  });

  // Fetch and add TV show pages
  const tvShows = await fetchTVShows();
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
  writableStream.write(formattedSitemap);
  writableStream.end();

  console.log('Sitemap generated successfully!');
}

generateSitemap().catch(console.error);
