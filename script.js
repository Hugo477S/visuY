// --- CONFIGURATION ---
const API_KEY = '6f1a58b7b76a80e109f0996c57cc476d';
const BEARER_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI2ZjFhNThiN2I3NmE4MGUxMDlmMDk5NmM1N2NjNDc2ZCIsIm5iZiI6MTc3MDgxMzgxMC42OTgsInN1YiI6IjY5OGM3OTcyZmY4MjExNTZmNjg4NWY3MiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.Vknd18zW50dPVY6d52Hsc_FrOIw-0LflQLHoVTFJJT0'; // Warning: Exposed credential
const BASE_URL = 'https://api.themoviedb.org/3';

// --- DOM ELEMENTS ---
const loginSection = document.getElementById('login-section');
const dashboardSection = document.getElementById('dashboard-section');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const displaySessionId = document.getElementById('display-session-id');

// --- INITIALIZATION ---
window.addEventListener('DOMContentLoaded', () => {
    handleAuthFlow();
});

// --- MAIN LOGIC ---

/**
 * Determines the state of the application based on LocalStorage and URL Parameters
 */
async function handleAuthFlow() {
    const sessionId = localStorage.getItem('tmdb_session_id');
    const urlParams = new URLSearchParams(window.location.search);
    const requestToken = urlParams.get('request_token');
    const approved = urlParams.get('approved');

    if (sessionId) {
        // SCENARIO 1: User is already logged in
        showDashboard(sessionId);
    } else if (requestToken && approved === 'true') {
        // SCENARIO 2: User just returned from TMDB Auth Page
        await createSessionId(requestToken);
    } else {
        // SCENARIO 3: User is not logged in
        showLogin();
    }
}

// --- API FUNCTIONS ---

/**
 * Step 1: Create Request Token
 * Fetch a temporary token from TMDB
 */
async function createRequestToken() {
    try {
        const response = await fetch(`${BASE_URL}/authentication/token/new`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${BEARER_TOKEN}`,
                'Content-Type': 'application/json;charset=utf-8'
            }
        });
        
        const data = await response.json();

        if (data.success) {
            // Step 2: Redirect User to TMDB to approve the token
            const token = data.request_token;
            const redirectUrl = window.location.href; // Returns to current page
            window.location.href = `https://www.themoviedb.org/authenticate/${token}?redirect_to=${redirectUrl}`;
        } else {
            alert('Error generating request token');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

/**
 * Step 3: Create Session ID
 * Exchange the approved request token for a permanent session ID
 */
async function createSessionId(requestToken) {
    try {
        const response = await fetch(`${BASE_URL}/authentication/session/new`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${BEARER_TOKEN}`,
                'Content-Type': 'application/json;charset=utf-8'
            },
            body: JSON.stringify({
                request_token: requestToken
            })
        });

        const data = await response.json();

        if (data.success) {
            // Save Session ID to Local Storage
            localStorage.setItem('tmdb_session_id', data.session_id);
            
            // Clean the URL (remove ?request_token=...) so the user sees a clean bar
            window.history.replaceState({}, document.title, "/");
            
            showDashboard(data.session_id);
        } else {
            console.error('Failed to create session:', data);
            alert('Authentication failed.');
            showLogin();
        }
    } catch (error) {
        console.error('Error:', error);
        showLogin();
    }
}

// --- UI FUNCTIONS ---

function showLogin() {
    loginSection.classList.remove('hidden');
    dashboardSection.classList.add('hidden');
}

function showDashboard(sessionId) {
    loginSection.classList.add('hidden');
    dashboardSection.classList.remove('hidden');
    displaySessionId.textContent = sessionId;
}

function logout() {
    // TMDB API also has a DELETE session endpoint, but for simple client-side
    // we usually just remove the key.
    localStorage.removeItem('tmdb_session_id');
    location.reload();
}

// --- EVENT LISTENERS ---

loginBtn.addEventListener('click', () => {
    createRequestToken();
});

logoutBtn.addEventListener('click', () => {
    logout();
});