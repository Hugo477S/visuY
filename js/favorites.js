/**
 * FAVORITES MANAGER — Shared module for favorites across all pages
 * Uses localStorage to persist favorite movies.
 */

const FavoritesManager = {
    STORAGE_KEY: "cinehub_favorites",

    getAll() {
        const favorites = localStorage.getItem(this.STORAGE_KEY);
        return favorites ? JSON.parse(favorites) : [];
    },

    add(movie) {
        const favorites = this.getAll();
        if (favorites.some((m) => m.id === movie.id)) return false;
        favorites.push({
            id: movie.id,
            title: movie.title,
            poster_path: movie.poster_path,
            vote_average: movie.vote_average,
            release_date: movie.release_date,
            overview: movie.overview,
            genre_ids: movie.genre_ids,
            addedAt: new Date().toISOString(),
        });
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(favorites));
        this.updateCount();
        return true;
    },

    remove(movieId) {
        let favorites = this.getAll();
        favorites = favorites.filter((movie) => movie.id !== movieId);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(favorites));
        this.updateCount();
    },

    isFavorite(movieId) {
        return this.getAll().some((m) => m.id === movieId);
    },

    clearAll() {
        localStorage.removeItem(this.STORAGE_KEY);
        this.updateCount();
    },

    updateCount() {
        const count = this.getAll().length;
        const countElement = document.getElementById("nav-favorites-count");
        if (countElement) {
            countElement.textContent = count;
            countElement.style.display = count > 0 ? "inline-block" : "none";
        }
    },

    getAverageRating() {
        const favorites = this.getAll();
        if (favorites.length === 0) return "-";
        const sum = favorites.reduce((acc, movie) => acc + movie.vote_average, 0);
        return (sum / favorites.length).toFixed(1);
    },

    sort(criteria) {
        const favorites = this.getAll();
        switch (criteria) {
            case "date-desc":
                return favorites.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
            case "date-asc":
                return favorites.sort((a, b) => new Date(a.addedAt) - new Date(b.addedAt));
            case "rating-desc":
                return favorites.sort((a, b) => b.vote_average - a.vote_average);
            case "rating-asc":
                return favorites.sort((a, b) => a.vote_average - b.vote_average);
            case "title-asc":
                return favorites.sort((a, b) => a.title.localeCompare(b.title));
            case "title-desc":
                return favorites.sort((a, b) => b.title.localeCompare(a.title));
            default:
                return favorites;
        }
    },
};
