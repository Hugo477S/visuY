/**
 * APP — UI rendering & event handling
 * Depends on: api.js, scoring.js (loaded before this script)
 */

// ── State ───────────────────────────────────────────────────────────────
let allMovies = [];
let genreMap = {};
let currentPage = 1;
let totalPages = 1;
let isLoading = false;

const POSTER_BASE = "https://image.tmdb.org/t/p/w500";

// ── DOM refs (assigned in init) ─────────────────────────────────────────
let grid, loadMoreBtn, loader, movieCount;
let surpriseBtn, surpriseModal, surpriseClose, surpriseBody;
let sliders = {};
let sliderValues = {};

// ── Helpers ─────────────────────────────────────────────────────────────
function getWeights() {
  return {
    voteAvg: Number(sliders.voteAvg.value),
    popularity: Number(sliders.popularity.value),
    recency: Number(sliders.recency.value),
    voteCount: Number(sliders.voteCount.value),
  };
}

function formatDate(dateStr) {
  if (!dateStr) return "N/A";
  const d = new Date(dateStr);
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getGenreNames(ids) {
  return ids
    .map((id) => genreMap[id])
    .filter(Boolean)
    .join(", ");
}

function getScoreColor(score) {
  if (score >= 75) return "#00e676";
  if (score >= 50) return "#ffea00";
  if (score >= 25) return "#ff9100";
  return "#ff1744";
}

// ── Rendering ───────────────────────────────────────────────────────────
function renderMovies() {
  const weights = getWeights();
  const scored = scoreAndSort(allMovies, weights);

  grid.innerHTML = "";
  movieCount.textContent = `${scored.length} films classés`;

  scored.forEach(({ movie, score, normalised }, index) => {
    const card = document.createElement("div");
    card.className = "movie-card";
    card.style.animationDelay = `${index * 0.04}s`;

    const posterPath = movie.poster_path
      ? `${POSTER_BASE}${movie.poster_path}`
      : "";

    const scoreColor = getScoreColor(score);
    const explanations = generateExplanation(normalised, weights);

    card.innerHTML = `
      <div class="card-rank">#${index + 1}</div>
      <div class="card-poster">
        ${posterPath
        ? `<img src="${posterPath}" alt="${movie.title}" loading="lazy">`
        : `<div class="no-poster">🎬</div>`
      }
        <div class="card-score-badge" style="background:${scoreColor}">
          ${score.toFixed(1)}
        </div>
      </div>
      <div class="card-body">
        <h3 class="card-title">${movie.title}</h3>
        <p class="card-genres">${getGenreNames(movie.genre_ids || [])}</p>
        <p class="card-date">${formatDate(movie.release_date)}</p>

        <div class="metrics">
          <div class="metric">
            <span class="metric-label">⭐ Note</span>
            <div class="metric-bar-track">
              <div class="metric-bar" style="width:${normalised.voteAvg * 100}%;background:var(--accent-blue)"></div>
            </div>
            <span class="metric-value">${(movie.vote_average ?? 0).toFixed(1)}</span>
          </div>
          <div class="metric">
            <span class="metric-label">🔥 Popularité</span>
            <div class="metric-bar-track">
              <div class="metric-bar" style="width:${normalised.popularity * 100}%;background:var(--accent-orange)"></div>
            </div>
            <span class="metric-value">${Math.round(movie.popularity ?? 0)}</span>
          </div>
          <div class="metric">
            <span class="metric-label">📅 Récence</span>
            <div class="metric-bar-track">
              <div class="metric-bar" style="width:${normalised.recency * 100}%;background:var(--accent-green)"></div>
            </div>
            <span class="metric-value">${formatDate(movie.release_date)}</span>
          </div>
          <div class="metric">
            <span class="metric-label">🗳️ Votes</span>
            <div class="metric-bar-track">
              <div class="metric-bar" style="width:${normalised.voteCount * 100}%;background:var(--accent-purple)"></div>
            </div>
            <span class="metric-value">${(movie.vote_count ?? 0).toLocaleString("fr-FR")}</span>
          </div>
        </div>

        <div class="score-section">
          <div class="score-label">Score global</div>
          <div class="score-bar-track">
            <div class="score-bar" style="width:${score}%;background:${scoreColor}"></div>
          </div>
          <div class="score-number" style="color:${scoreColor}">${score.toFixed(1)}<span>/100</span></div>
        </div>

        <div class="explanation">
          <div class="explanation-title">💡 Recommandé car :</div>
          <ul class="explanation-list">
            ${explanations.map((reason) => `<li>✔ ${reason}</li>`).join("")}
          </ul>
        </div>
      </div>
    `;

    grid.appendChild(card);
  });
}

// ── Data loading ────────────────────────────────────────────────────────
async function loadMovies(page) {
  if (isLoading) return;
  isLoading = true;
  loader.classList.add("visible");
  loadMoreBtn.disabled = true;

  try {
    const data = await fetchPopularMovies(page);
    allMovies = allMovies.concat(data.results);
    totalPages = data.total_pages;
    currentPage = data.page;
    renderMovies();

    if (currentPage >= totalPages) {
      loadMoreBtn.style.display = "none";
    }
  } catch (err) {
    console.error("Erreur de chargement :", err);
    grid.innerHTML = `<p class="error">Erreur : impossible de charger les films. Vérifiez votre connexion.</p>`;
  } finally {
    isLoading = false;
    loader.classList.remove("visible");
    loadMoreBtn.disabled = false;
  }
}

// ── Surprise Me ─────────────────────────────────────────────────────────
function openSurprise() {
  const weights = getWeights();
  const scored = scoreAndSort(allMovies, weights);

  if (scored.length === 0) {
    surpriseBody.innerHTML = `<p class="surprise-empty">Aucun film disponible. Chargez d'abord des films !</p>`;
    surpriseModal.classList.add("visible");
    return;
  }

  const pick = weightedRandomPick(scored);
  const { movie, score, normalised } = pick;
  const scoreColor = getScoreColor(score);
  const posterPath = movie.poster_path
    ? `${POSTER_BASE}${movie.poster_path}`
    : "";
  const explanations = generateExplanation(normalised, weights);

  surpriseBody.innerHTML = `
    <div class="surprise-card">
      <div class="surprise-poster">
        ${posterPath
      ? `<img src="${posterPath}" alt="${movie.title}">`
      : `<div class="no-poster">🎬</div>`
    }
      </div>
      <div class="surprise-info">
        <h2 class="surprise-title">${movie.title}</h2>
        <p class="surprise-genres">${getGenreNames(movie.genre_ids || [])}</p>
        <p class="surprise-date">${formatDate(movie.release_date)}</p>

        <div class="surprise-score" style="color:${scoreColor}">
          ${score.toFixed(1)}<span>/100</span>
        </div>
        <div class="score-bar-track" style="margin-bottom:1rem">
          <div class="score-bar" style="width:${score}%;background:${scoreColor}"></div>
        </div>

        <div class="surprise-overview">${movie.overview || "Aucune description disponible."}</div>

        <div class="explanation">
          <div class="explanation-title">💡 Recommandé car :</div>
          <ul class="explanation-list">
            ${explanations.map((r) => `<li>✔ ${r}</li>`).join("")}
          </ul>
        </div>

        <button class="surprise-again" onclick="openSurprise()">🎲 Encore !</button>
      </div>
    </div>
  `;

  surpriseModal.classList.add("visible");
}

function closeSurprise() {
  surpriseModal.classList.remove("visible");
}

// ── Init ────────────────────────────────────────────────────────────────
async function init() {
  // Resolve DOM references after DOM is ready
  grid = document.getElementById("movie-grid");
  loadMoreBtn = document.getElementById("load-more");
  loader = document.getElementById("loader");
  movieCount = document.getElementById("movie-count");
  surpriseBtn = document.getElementById("surprise-btn");
  surpriseModal = document.getElementById("surprise-modal");
  surpriseClose = document.getElementById("surprise-close");
  surpriseBody = document.getElementById("surprise-body");

  sliders = {
    voteAvg: document.getElementById("w-vote-avg"),
    popularity: document.getElementById("w-popularity"),
    recency: document.getElementById("w-recency"),
    voteCount: document.getElementById("w-vote-count"),
  };

  sliderValues = {
    voteAvg: document.getElementById("v-vote-avg"),
    popularity: document.getElementById("v-popularity"),
    recency: document.getElementById("v-recency"),
    voteCount: document.getElementById("v-vote-count"),
  };

  // Load genres
  try {
    const genres = await fetchGenres();
    genres.forEach((g) => (genreMap[g.id] = g.name));
  } catch (e) {
    console.warn("Genres non chargés", e);
  }

  // Slider listeners
  Object.keys(sliders).forEach((key) => {
    sliders[key].addEventListener("input", () => {
      sliderValues[key].textContent = sliders[key].value;
      renderMovies();
    });
  });

  loadMoreBtn.addEventListener("click", () => loadMovies(currentPage + 1));

  // Surprise Me
  surpriseBtn.addEventListener("click", openSurprise);
  surpriseClose.addEventListener("click", closeSurprise);
  surpriseModal.addEventListener("click", (e) => {
    if (e.target === surpriseModal) closeSurprise();
  });

  // First page
  await loadMovies(1);
}

document.addEventListener("DOMContentLoaded", init);
