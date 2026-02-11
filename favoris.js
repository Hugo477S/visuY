// === ÉLÉMENTS DOM ===
const elements = {
    favoritesGrid: document.getElementById('favorites-grid'),
    emptyState: document.getElementById('empty-state'),
    totalFavorites: document.getElementById('total-favorites'),
    averageRating: document.getElementById('average-rating'),
    clearAllBtn: document.getElementById('clear-all-favorites'),
    sortSelect: document.getElementById('sort-select')
};

const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

// === AFFICHAGE DES FAVORIS ===

function displayFavorites() {
    const sortCriteria = elements.sortSelect.value;
    const favorites = FavoritesManager.sort(sortCriteria);

    if (favorites.length === 0) {
        elements.emptyState.style.display = 'flex';
        elements.favoritesGrid.style.display = 'none';
        return;
    }

    elements.emptyState.style.display = 'none';
    elements.favoritesGrid.style.display = 'grid';
    elements.favoritesGrid.innerHTML = '';

    favorites.forEach(movie => {
        const card = createFavoriteCard(movie);
        elements.favoritesGrid.appendChild(card);
    });

    updateStats();
}

function createFavoriteCard(movie) {
    const card = document.createElement('div');
    card.className = 'favorite-card';

    const posterUrl = movie.poster_path
        ? `${IMAGE_BASE_URL}${movie.poster_path}`
        : null;

    const year = movie.release_date
        ? new Date(movie.release_date).getFullYear()
        : 'N/A';

    const addedDate = new Date(movie.addedAt).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    card.innerHTML = `
        <div class="favorite-image">
            ${posterUrl
            ? `<img src="${posterUrl}" alt="${movie.title}" class="movie-poster">`
            : `<div class="movie-poster no-image">🎬</div>`
        }
            <button class="btn-remove" data-movie-id="${movie.id}" title="Retirer des favoris">
                ❌
            </button>
        </div>
        <div class="favorite-info">
            <h3 class="movie-title" title="${movie.title}">${movie.title}</h3>
            <div class="movie-meta">
                <span class="movie-rating">⭐ ${movie.vote_average.toFixed(1)}</span>
                <span class="movie-year">${year}</span>
            </div>
            <p class="movie-overview">${movie.overview || 'Pas de description disponible.'}</p>
            <p class="added-date">Ajouté le ${addedDate}</p>
        </div>
    `;

    const removeBtn = card.querySelector('.btn-remove');
    removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        removeFavorite(movie.id, card);
    });

    return card;
}

// === GESTION DES ACTIONS ===

function removeFavorite(movieId, cardElement) {
    // Animation de suppression
    cardElement.classList.add('removing');

    setTimeout(() => {
        FavoritesManager.remove(movieId);
        displayFavorites();
        showNotification('Film retiré des favoris', 'info');
    }, 300);
}

function clearAllFavorites() {
    if (FavoritesManager.getAll().length === 0) {
        showNotification('Aucun favori à supprimer', 'info');
        return;
    }

    const confirmed = confirm('Êtes-vous sûr de vouloir supprimer tous vos favoris ?');

    if (confirmed) {
        FavoritesManager.clearAll();
        displayFavorites();
        showNotification('Tous les favoris ont été supprimés', 'success');
    }
}

function updateStats() {
    elements.totalFavorites.textContent = FavoritesManager.getAll().length;
    elements.averageRating.textContent = `⭐ ${FavoritesManager.getAverageRating()}`;
}

function showNotification(message, type = 'success') {
    const existingNotif = document.querySelector('.notification');
    if (existingNotif) {
        existingNotif.remove();
    }

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => notification.classList.add('show'), 10);

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// === EVENT LISTENERS ===

elements.clearAllBtn.addEventListener('click', clearAllFavorites);
elements.sortSelect.addEventListener('change', displayFavorites);

// === INITIALISATION ===

displayFavorites();
FavoritesManager.updateCount();
