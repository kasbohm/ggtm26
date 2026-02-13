// Strava API Configuration
// Register your app at: https://www.strava.com/settings/api

const STRAVA_CONFIG = {
    // TODO: Replace with your actual Client ID from https://www.strava.com/settings/api
    clientId: 'YOUR_CLIENT_ID_HERE',

    // Redirect URI - must match what's configured in Strava API settings
    // For local development: http://localhost:8000/konkurranse.html
    // For production: https://kasbohm.github.io/ggtm26/konkurranse.html
    redirectUri: window.location.origin + window.location.pathname,

    // Scopes needed
    scope: 'activity:read_all',

    // Authorization endpoint
    authUrl: 'https://www.strava.com/oauth/authorize',

    // Token endpoint
    tokenUrl: 'https://www.strava.com/oauth/token',

    // API base URL
    apiUrl: 'https://www.strava.com/api/v3'
};

// Mallorca competition dates (UPDATE THESE!)
const COMPETITION_DATES = {
    // Start date (YYYY-MM-DD)
    start: '2026-03-15',  // TODO: Update with actual dates

    // End date (YYYY-MM-DD)
    end: '2026-03-22',    // TODO: Update with actual dates

    // Get timestamps for API
    getStartTimestamp() {
        return Math.floor(new Date(this.start).getTime() / 1000);
    },

    getEndTimestamp() {
        return Math.floor(new Date(this.end).getTime() / 1000);
    }
};

// Sprint points configuration
// Note: Climb classification is now in climb-classifier.js
const SPRINT_RULES = {
    // Points for completing known sprint segments
    // TODO: Add specific Mallorca segment IDs from Strava
    segments: [
        // Example: { id: 123456, name: 'Port de Soller Sprint', points: 15 }
    ],

    // Alternative: Points for maintaining high average speed
    speedBonuses: [
        { minSpeed: 40, points: 10 },  // km/h
        { minSpeed: 35, points: 5 }
    ]
};
