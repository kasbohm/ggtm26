// Strava API Integration

class StravaAPI {
    constructor() {
        this.accessToken = localStorage.getItem('strava_access_token');
        this.refreshToken = localStorage.getItem('strava_refresh_token');
        this.expiresAt = parseInt(localStorage.getItem('strava_expires_at') || '0');
        this.athlete = JSON.parse(localStorage.getItem('strava_athlete') || 'null');
    }

    // Check if user is authenticated
    isAuthenticated() {
        return !!this.accessToken && Date.now() / 1000 < this.expiresAt;
    }

    // Get athlete info
    getAthlete() {
        return this.athlete;
    }

    // Initiate OAuth flow
    authorize() {
        const params = new URLSearchParams({
            client_id: STRAVA_CONFIG.clientId,
            redirect_uri: STRAVA_CONFIG.redirectUri,
            response_type: 'code',
            scope: STRAVA_CONFIG.scope,
            approval_prompt: 'auto'
        });

        window.location.href = `${STRAVA_CONFIG.authUrl}?${params.toString()}`;
    }

    // Handle OAuth callback
    async handleCallback() {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const error = urlParams.get('error');

        if (error) {
            console.error('Strava authorization error:', error);
            return false;
        }

        if (!code) {
            return false;
        }

        try {
            // Exchange code for token
            // Note: This should ideally be done server-side to protect client_secret
            // For now, we'll use a proxy or accept the security limitation
            const response = await fetch(STRAVA_CONFIG.tokenUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    client_id: STRAVA_CONFIG.clientId,
                    client_secret: 'YOUR_CLIENT_SECRET_HERE', // TODO: Move to server-side
                    code: code,
                    grant_type: 'authorization_code'
                })
            });

            const data = await response.json();

            if (data.access_token) {
                this.accessToken = data.access_token;
                this.refreshToken = data.refresh_token;
                this.expiresAt = data.expires_at;
                this.athlete = data.athlete;

                // Store in localStorage
                localStorage.setItem('strava_access_token', this.accessToken);
                localStorage.setItem('strava_refresh_token', this.refreshToken);
                localStorage.setItem('strava_expires_at', this.expiresAt.toString());
                localStorage.setItem('strava_athlete', JSON.stringify(this.athlete));

                // Clean up URL
                window.history.replaceState({}, document.title, window.location.pathname);

                return true;
            }
        } catch (error) {
            console.error('Error exchanging code for token:', error);
        }

        return false;
    }

    // Refresh access token
    async refreshAccessToken() {
        try {
            const response = await fetch(STRAVA_CONFIG.tokenUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    client_id: STRAVA_CONFIG.clientId,
                    client_secret: 'YOUR_CLIENT_SECRET_HERE', // TODO: Move to server-side
                    refresh_token: this.refreshToken,
                    grant_type: 'refresh_token'
                })
            });

            const data = await response.json();

            if (data.access_token) {
                this.accessToken = data.access_token;
                this.refreshToken = data.refresh_token;
                this.expiresAt = data.expires_at;

                localStorage.setItem('strava_access_token', this.accessToken);
                localStorage.setItem('strava_refresh_token', this.refreshToken);
                localStorage.setItem('strava_expires_at', this.expiresAt.toString());

                return true;
            }
        } catch (error) {
            console.error('Error refreshing token:', error);
        }

        return false;
    }

    // Get activities within date range
    async getActivities(after, before, page = 1, perPage = 30) {
        if (!this.isAuthenticated()) {
            if (this.refreshToken) {
                await this.refreshAccessToken();
            } else {
                throw new Error('Not authenticated');
            }
        }

        const params = new URLSearchParams({
            after: after.toString(),
            before: before.toString(),
            page: page.toString(),
            per_page: perPage.toString()
        });

        const response = await fetch(
            `${STRAVA_CONFIG.apiUrl}/athlete/activities?${params.toString()}`,
            {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            }
        );

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        return await response.json();
    }

    // Get all activities for competition period
    async getCompetitionActivities() {
        const activities = [];
        let page = 1;
        const perPage = 100;

        const after = COMPETITION_DATES.getStartTimestamp();
        const before = COMPETITION_DATES.getEndTimestamp();

        while (true) {
            const pageActivities = await this.getActivities(after, before, page, perPage);

            if (pageActivities.length === 0) {
                break;
            }

            activities.push(...pageActivities);

            if (pageActivities.length < perPage) {
                break;
            }

            page++;
        }

        // Filter only cycling activities
        return activities.filter(a => a.type === 'Ride' || a.type === 'VirtualRide');
    }

    // Calculate competition points
    calculatePoints(activities) {
        const points = {
            climbing: 0,
            sprint: 0,
            totalDistance: 0,
            totalTime: 0,
            activities: []
        };

        for (const activity of activities) {
            const activityPoints = {
                name: activity.name,
                date: activity.start_date,
                distance: activity.distance / 1000, // Convert to km
                time: activity.moving_time / 3600, // Convert to hours
                elevation: activity.total_elevation_gain,
                avgSpeed: (activity.distance / 1000) / (activity.moving_time / 3600),
                climbingPoints: 0,
                sprintPoints: 0
            };

            // Calculate climbing points using shared classifier
            const elevation = activity.total_elevation_gain || 0;
            const distanceKm = activity.distance / 1000;

            // Use classifyClimb from climb-classifier.js
            const climbClass = classifyClimb(elevation, distanceKm);
            if (climbClass) {
                activityPoints.climbingPoints = climbClass.points;
            }

            // Calculate sprint points (based on average speed for now)
            for (const speedBonus of SPRINT_RULES.speedBonuses) {
                if (activityPoints.avgSpeed >= speedBonus.minSpeed) {
                    activityPoints.sprintPoints += speedBonus.points;
                    break;
                }
            }

            points.climbing += activityPoints.climbingPoints;
            points.sprint += activityPoints.sprintPoints;
            points.totalDistance += activityPoints.distance;
            points.totalTime += activityPoints.time;
            points.activities.push(activityPoints);
        }

        points.avgSpeed = points.totalDistance / points.totalTime;

        return points;
    }

    // Disconnect Strava
    disconnect() {
        localStorage.removeItem('strava_access_token');
        localStorage.removeItem('strava_refresh_token');
        localStorage.removeItem('strava_expires_at');
        localStorage.removeItem('strava_athlete');

        this.accessToken = null;
        this.refreshToken = null;
        this.expiresAt = 0;
        this.athlete = null;
    }
}

// Create global instance
const stravaAPI = new StravaAPI();
