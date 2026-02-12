/**
 * SCORING ENGINE
 * ──────────────
 * Transforms raw movie data into a single normalised score (0–100).
 *
 * Strategy:
 *   1. For each metric we compute the dataset-wide min and max.
 *   2. Each movie's raw value is normalised to [0, 1] via Min-Max scaling:
 *        normalised = (value - min) / (max - min)
 *   3. The final score is the weighted sum of the 4 normalised values,
 *      divided by the total weight, then multiplied by 100.
 *
 * Metrics:
 *   - vote_average  : average user rating (0–10)
 *   - popularity    : TMDB popularity index (0–∞)
 *   - recency       : days since release (inverted: newer = higher)
 *   - vote_count    : total number of votes (0–∞)
 */

/**
 * Compute min / max statistics for every metric across a movie array.
 * @param {Array} movies
 * @returns {{
 *   voteAvg:  {min: number, max: number},
 *   popularity: {min: number, max: number},
 *   recency:   {min: number, max: number},
 *   voteCount: {min: number, max: number}
 * }}
 */
function computeDatasetStats(movies) {
    const today = Date.now();

    const vals = {
        voteAvg: [],
        popularity: [],
        recency: [],
        voteCount: [],
    };

    movies.forEach((m) => {
        vals.voteAvg.push(m.vote_average ?? 0);
        vals.popularity.push(m.popularity ?? 0);
        vals.voteCount.push(m.vote_count ?? 0);

        // Recency = days since release (lower = more recent)
        const release = m.release_date ? new Date(m.release_date) : new Date(0);
        const daysSince = (today - release.getTime()) / (1000 * 60 * 60 * 24);
        vals.recency.push(daysSince);
    });

    const minMax = (arr) => ({
        min: Math.min(...arr),
        max: Math.max(...arr),
    });

    return {
        voteAvg: minMax(vals.voteAvg),
        popularity: minMax(vals.popularity),
        recency: minMax(vals.recency),
        voteCount: minMax(vals.voteCount),
    };
}

/**
 * Min-Max normalise a value to [0, 1].
 * Returns 0.5 if min === max (all values identical).
 */
function normalise(value, min, max) {
    if (max === min) return 0.5;
    return (value - min) / (max - min);
}

/**
 * Calculate a composite score for a single movie.
 *
 * @param {Object} movie   - TMDB movie object
 * @param {Object} weights - { voteAvg, popularity, recency, voteCount } (0–10 each)
 * @param {Object} stats   - output of computeDatasetStats()
 * @returns {number} score between 0 and 100
 */
function calculateScore(movie, weights, stats) {
    const today = Date.now();
    const release = movie.release_date
        ? new Date(movie.release_date)
        : new Date(0);
    const daysSince = (today - release.getTime()) / (1000 * 60 * 60 * 24);

    // Normalised values (0–1)
    const nVoteAvg = normalise(
        movie.vote_average ?? 0,
        stats.voteAvg.min,
        stats.voteAvg.max
    );
    const nPopularity = normalise(
        movie.popularity ?? 0,
        stats.popularity.min,
        stats.popularity.max
    );
    // Invert recency: fewer days since release → higher score
    const nRecency =
        1 - normalise(daysSince, stats.recency.min, stats.recency.max);
    const nVoteCount = normalise(
        movie.vote_count ?? 0,
        stats.voteCount.min,
        stats.voteCount.max
    );

    const totalWeight =
        weights.voteAvg + weights.popularity + weights.recency + weights.voteCount;

    if (totalWeight === 0) return 0;

    const weighted =
        nVoteAvg * weights.voteAvg +
        nPopularity * weights.popularity +
        nRecency * weights.recency +
        nVoteCount * weights.voteCount;

    return (weighted / totalWeight) * 100;
}

/**
 * Score and sort an entire array of movies.
 * @param {Array}  movies
 * @param {Object} weights
 * @returns {Array<{movie: Object, score: number, normalised: Object}>}
 */
function scoreAndSort(movies, weights) {
    const stats = computeDatasetStats(movies);

    const today = Date.now();

    return movies
        .map((movie) => {
            const release = movie.release_date
                ? new Date(movie.release_date)
                : new Date(0);
            const daysSince = (today - release.getTime()) / (1000 * 60 * 60 * 24);

            const normalised = {
                voteAvg: normalise(
                    movie.vote_average ?? 0,
                    stats.voteAvg.min,
                    stats.voteAvg.max
                ),
                popularity: normalise(
                    movie.popularity ?? 0,
                    stats.popularity.min,
                    stats.popularity.max
                ),
                recency:
                    1 - normalise(daysSince, stats.recency.min, stats.recency.max),
                voteCount: normalise(
                    movie.vote_count ?? 0,
                    stats.voteCount.min,
                    stats.voteCount.max
                ),
            };

            return {
                movie,
                score: calculateScore(movie, weights, stats),
                normalised,
            };
        })
        .sort((a, b) => b.score - a.score);
}

/**
 * EXPLAINABILITY — Analyse which criteria drove the recommendation.
 *
 * For each metric whose normalised value exceeds a threshold (0.6),
 * and whose corresponding weight is > 0, we emit a human-readable reason.
 * Reasons are sorted by contribution (normalised × weight) descending.
 *
 * @param {Object} normalised - { voteAvg, popularity, recency, voteCount }
 * @param {Object} weights    - current slider weights
 * @returns {string[]} array of explanation strings
 */
function generateExplanation(normalised, weights) {
    const THRESHOLD = 0.6;

    const criteria = [
        {
            key: "voteAvg",
            icon: "⭐",
            label: "Note élevée",
            detail: "bien noté par les spectateurs",
        },
        {
            key: "popularity",
            icon: "🔥",
            label: "Très populaire",
            detail: "en forte tendance actuellement",
        },
        {
            key: "recency",
            icon: "📅",
            label: "Film récent",
            detail: "sorti récemment",
        },
        {
            key: "voteCount",
            icon: "🗳️",
            label: "Très voté",
            detail: "grand nombre de votes",
        },
    ];

    // Calculate weighted contribution for each metric
    const contributions = criteria
        .map((c) => ({
            ...c,
            normVal: normalised[c.key],
            weight: weights[c.key],
            contribution: normalised[c.key] * weights[c.key],
        }))
        .filter((c) => c.weight > 0 && c.normVal >= THRESHOLD)
        .sort((a, b) => b.contribution - a.contribution);

    if (contributions.length === 0) {
        return ["📊 Score équilibré entre tous les critères"];
    }

    return contributions.map((c) => `${c.icon} ${c.label} — ${c.detail}`);
}

/**
 * Intelligent random selection from the scored list.
 * Instead of pure random, it uses weighted random sampling
 * where movies with higher scores have proportionally higher
 * probability of being chosen.
 *
 * @param {Array} scoredMovies - output of scoreAndSort()
 * @returns {Object|null} { movie, score, normalised } or null if empty
 */
function weightedRandomPick(scoredMovies) {
    if (!scoredMovies || scoredMovies.length === 0) return null;

    // Use score as weight for random selection (score-biased)
    const totalScore = scoredMovies.reduce((sum, s) => sum + s.score + 1, 0);
    let rand = Math.random() * totalScore;

    for (const item of scoredMovies) {
        rand -= item.score + 1;
        if (rand <= 0) return item;
    }

    // Fallback to last item
    return scoredMovies[scoredMovies.length - 1];
}
