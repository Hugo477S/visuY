// Configuration API
const API_KEY = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI2ZjFhNThiN2I3NmE4MGUxMDlmMDk5NmM1N2NjNDc2ZCIsIm5iZiI6MTc3MDgxMzgxMC42OTgsInN1YiI6IjY5OGM3OTcyZmY4MjExNTZmNjg4NWY3MiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.Vknd18zW50dPVY6d52Hsc_FrOIw-0LflQLHoVTFJJT0';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

// État de l'application
const appState = {
    filters: {
        genre: '',
        year: '',
        rating: '',
        language: ''
    },
    currentPage: 1,
    totalPages: 1,
    movies: []
};

// Éléments DOM
const elements = {
    genreSelect: document.getElementById('genre-select'),
    yearInput: document.getElementById('year-input'),
    ratingInput: document.getElementById('rating-input'),
    languageSelect: document.getElementById('language-select'),
    applyFiltersBtn: document.getElementById('apply-filters'),
    resetFiltersBtn: document.getElementById('reset-filters'),
    moviesGrid: document.getElementById('movies-grid'),
    loading: document.getElementById('loading'),
    errorMessage: document.getElementById('error-message'),
    noResults: document.getElementById('no-results'),
    resultsCount: document.getElementById('results-count'),
    activeFilters: document.getElementById('active-filters'),
    ratingValue: document.getElementById('rating-value'),
    pagination: document.getElementById('pagination'),
    prevPageBtn: document.getElementById('prev-page'),
    nextPageBtn: document.getElementById('next-page'),
    currentPageSpan: document.getElementById('current-page'),
    totalPagesSpan: document.getElementById('total-pages')
};

// Noms des genres pour affichage
const genreNames = {
    '28': 'Action',
    '12': 'Aventure',
    '16': 'Animation',
    '35': 'Comédie',
    '80': 'Crime',
    '99': 'Documentaire',
    '18': 'Drame',
    '10751': 'Familial',
    '14': 'Fantastique',
    '36': 'Histoire',
    '27': 'Horreur',
    '10402': 'Musique',
    '9648': 'Mystère',
    '10749': 'Romance',
    '878': 'Science-Fiction',
    '10770': 'Téléfilm',
    '53': 'Thriller',
    '10752': 'Guerre',
    '37': 'Western'
};

// Noms des langues pour affichage
const languageNames = {
    'fr': 'Français',
    'en': 'Anglais',
    'es': 'Espagnol',
    'de': 'Allemand',
    'it': 'Italien',
    'ja': 'Japonais',
    'ko': 'Coréen',
    'zh': 'Chinois',
    'pt': 'Portugais',
    'ru': 'Russe'
};

// === FONCTIONS PRINCIPALES ===

/**
 * Récupère les films depuis l'API avec les filtres appliqués
 */
async function fetchMovies(page = 1) {
    showLoading();
    hideError();
    hideNoResults();

    try {
        const url = buildApiUrl(page);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                accept: 'application/json',
                Authorization: `Bearer ${API_KEY}`
            }
        });

        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }

        const data = await response.json();
        
        appState.movies = data.results;
        appState.currentPage = data.page;
        appState.totalPages = data.total_pages;

        hideLoading();

        if (data.results.length === 0) {
            showNoResults();
            hidePagination();
        } else {
            displayMovies(data.results);
            updateResultsCount(data.total_results);
            updatePagination();
        }

    } catch (error) {
        console.error('Erreur lors de la récupération des films:', error);
        hideLoading();
        showError();
    }
}

/**
 * Construit l'URL de l'API avec les filtres actifs
 */
function buildApiUrl(page) {
    const params = new URLSearchParams({
        language: 'fr-FR',
        page: page.toString(),
        sort_by: 'popularity.desc'
    });

    // Ajout des filtres
    if (appState.filters.genre) {
        params.append('with_genres', appState.filters.genre);
    }

    if (appState.filters.year) {
        params.append('primary_release_year', appState.filters.year);
    }

    if (appState.filters.rating) {
        params.append('vote_average.gte', appState.filters.rating);
    }

    if (appState.filters.language) {
        params.append('with_original_language', appState.filters.language);
    }

    return `${BASE_URL}/discover/movie?${params.toString()}`;
}

/**
 * Affiche les films dans la grille
 */
function displayMovies(movies) {
    elements.moviesGrid.innerHTML = '';

    movies.forEach(movie => {
        const movieCard = createMovieCard(movie);
        elements.moviesGrid.appendChild(movieCard);
    });
}

/**
 * Crée une carte de film
 */
function createMovieCard(movie) {
    const card = document.createElement('div');
    card.className = 'movie-card';
    
    const posterUrl = movie.poster_path 
        ? `${IMAGE_BASE_URL}${movie.poster_path}`
        : null;

    const releaseYear = movie.release_date 
        ? new Date(movie.release_date).getFullYear()
        : 'N/A';

    card.innerHTML = `
        ${posterUrl 
            ? `<img src="${posterUrl}" alt="${movie.title}" class="movie-poster">`
            : `<div class="movie-poster no-image">🎬</div>`
        }
        <div class="movie-info">
            <h3 class="movie-title" title="${movie.title}">${movie.title}</h3>
            <div class="movie-meta">
                <span class="movie-rating">
                    ⭐ ${movie.vote_average.toFixed(1)}
                </span>
                <span class="movie-year">${releaseYear}</span>
            </div>
        </div>
    `;

    card.addEventListener('click', () => showMovieDetails(movie));

    return card;
}

/**
 * Affiche les détails d'un film
 */
function showMovieDetails(movie) {
    alert(`
Titre: ${movie.title}
Note: ${movie.vote_average}/10
Date de sortie: ${movie.release_date}
Langue: ${movie.original_language}

Synopsis:
${movie.overview || 'Aucun synopsis disponible'}
    `);
}

/**
 * Applique les filtres sélectionnés
 */
function applyFilters() {
    appState.filters = {
        genre: elements.genreSelect.value,
        year: elements.yearInput.value,
        rating: elements.ratingInput.value,
        language: elements.languageSelect.value
    };

    appState.currentPage = 1;
    updateActiveFiltersDisplay();
    fetchMovies(1);
}

/**
 * Réinitialise tous les filtres
 */
function resetFilters() {
    elements.genreSelect.value = '';
    elements.yearInput.value = '';
    elements.ratingInput.value = '';
    elements.languageSelect.value = '';
    elements.ratingValue.textContent = '-';

    appState.filters = {
        genre: '',
        year: '',
        rating: '',
        language: ''
    };

    appState.currentPage = 1;
    updateActiveFiltersDisplay();
    fetchMovies(1);
}

/**
 * Met à jour l'affichage des filtres actifs
 */
function updateActiveFiltersDisplay() {
    elements.activeFilters.innerHTML = '';

    const activeFiltersArray = [];

    if (appState.filters.genre) {
        activeFiltersArray.push({
            label: `Genre: ${genreNames[appState.filters.genre]}`,
            key: 'genre'
        });
    }

    if (appState.filters.year) {
        activeFiltersArray.push({
            label: `Année: ${appState.filters.year}+`,
            key: 'year'
        });
    }

    if (appState.filters.rating) {
        activeFiltersArray.push({
            label: `Note: ${appState.filters.rating}+`,
            key: 'rating'
        });
    }

    if (appState.filters.language) {
        activeFiltersArray.push({
            label: `Langue: ${languageNames[appState.filters.language]}`,
            key: 'language'
        });
    }

    if (activeFiltersArray.length > 0) {
        const title = document.createElement('h3');
        title.textContent = 'Filtres actifs:';
        title.style.fontSize = '0.9rem';
        title.style.marginBottom = '10px';
        elements.activeFilters.appendChild(title);

        activeFiltersArray.forEach(filter => {
            const tag = document.createElement('span');
            tag.className = 'filter-tag';
            tag.innerHTML = `
                ${filter.label}
                <button onclick="removeFilter('${filter.key}')">×</button>
            `;
            elements.activeFilters.appendChild(tag);
        });
    }
}

/**
 * Retire un filtre spécifique
 */
function removeFilter(filterKey) {
    switch(filterKey) {
        case 'genre':
            elements.genreSelect.value = '';
            break;
        case 'year':
            elements.yearInput.value = '';
            break;
        case 'rating':
            elements.ratingInput.value = '';
            elements.ratingValue.textContent = '-';
            break;
        case 'language':
            elements.languageSelect.value = '';
            break;
    }
    
    applyFilters();
}

/**
 * Met à jour le compteur de résultats
 */
function updateResultsCount(count) {
    elements.resultsCount.textContent = `${count.toLocaleString()} film${count > 1 ? 's' : ''} trouvé${count > 1 ? 's' : ''}`;
}

/**
 * Met à jour la pagination
 */
function updatePagination() {
    elements.currentPageSpan.textContent = appState.currentPage;
    elements.totalPagesSpan.textContent = appState.totalPages;

    elements.prevPageBtn.disabled = appState.currentPage === 1;
    elements.nextPageBtn.disabled = appState.currentPage === appState.totalPages;

    elements.pagination.style.display = 'flex';
}

// === FONCTIONS D'AFFICHAGE ===

function showLoading() {
    elements.loading.style.display = 'block';
    elements.moviesGrid.style.display = 'none';
}

function hideLoading() {
    elements.loading.style.display = 'none';
    elements.moviesGrid.style.display = 'grid';
}

function showError() {
    elements.errorMessage.style.display = 'block';
    elements.moviesGrid.style.display = 'none';
}

function hideError() {
    elements.errorMessage.style.display = 'none';
}

function showNoResults() {
    elements.noResults.style.display = 'block';
    elements.moviesGrid.style.display = 'none';
}

function hideNoResults() {
    elements.noResults.style.display = 'none';
}

function hidePagination() {
    elements.pagination.style.display = 'none';
}

// === EVENT LISTENERS ===

elements.applyFiltersBtn.addEventListener('click', applyFilters);
elements.resetFiltersBtn.addEventListener('click', resetFilters);

elements.ratingInput.addEventListener('input', (e) => {
    const value = e.target.value;
    elements.ratingValue.textContent = value ? `${value} ⭐` : '-';
});

[elements.yearInput, elements.ratingInput].forEach(input => {
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            applyFilters();
        }
    });
});

elements.prevPageBtn.addEventListener('click', () => {
    if (appState.currentPage > 1) {
        fetchMovies(appState.currentPage - 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
});

elements.nextPageBtn.addEventListener('click', () => {
    if (appState.currentPage < appState.totalPages) {
        fetchMovies(appState.currentPage + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
});

// === INITIALISATION ===

fetchMovies(1);

window.removeFilter = removeFilter;
