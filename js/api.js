const API_BASE = "https://api.themoviedb.org/3";
const API_TOKEN =
    "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI2ZjFhNThiN2I3NmE4MGUxMDlmMDk5NmM1N2NjNDc2ZCIsIm5iZiI6MTc3MDgxMzgxMC42OTgsInN1YiI6IjY5OGM3OTcyZmY4MjExNTZmNjg4NWY3MiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.Vknd18zW50dPVY6d52Hsc_FrOIw-0LflQLHoVTFJJT0";

const headers = {
    Authorization: `Bearer ${API_TOKEN}`,
    "Content-Type": "application/json;charset=utf-8",
};

/**
 * Fetch movies from the Discover endpoint sorted by popularity.
 * @param {number} page - Page number (1-based)
 * @returns {Promise<{results: Array, total_pages: number, page: number}>}
 */
async function fetchPopularMovies(page = 1) {
    const url = `${API_BASE}/discover/movie?language=fr-FR&sort_by=popularity.desc&include_adult=false&page=${page}`;
    const response = await fetch(url, { headers });
    if (!response.ok) throw new Error(`TMDB API error: ${response.status}`);
    return response.json();
}

/**
 * Fetch the official genre list for movies.
 * @returns {Promise<Array<{id: number, name: string}>>}
 */
async function fetchGenres() {
    const url = `${API_BASE}/genre/movie/list?language=fr-FR`;
    const response = await fetch(url, { headers });
    if (!response.ok) throw new Error(`TMDB API error: ${response.status}`);
    const data = await response.json();
    return data.genres;
}
