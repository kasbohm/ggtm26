// Climbing Classification System
// Unified configuration for all pages (index.html, analyze-climbs.html, strava-api.js)

const CLIMB_CONFIG = {
    // Minimum requirements for a climb to be classified
    minLength: 3.0,          // km - minimum length of climb
    minGradient: 2.5,        // % - minimum average gradient (senket fra 4.0 til 2.5)
    minElevation: 100,       // m - minimum elevation gain
    minDistance: 2.0,        // km - minimum distance between separate climbs
    minPeakHeight: 200,      // m - minimum altitude for a peak (absolute height above sea level)

    // Descent threshold - how much descent before we consider climb ended
    descentThreshold: -10,   // m - end climb if we descend this much

    // For peak detection (local maxima)
    peakWindow: 6,           // number of points to check on each side
    peakProminence: 100,     // m - minimum prominence for a peak
};

// Classification formula
// We use: points = (elevation_m × gradient%) / 10
// This gives reasonable point values:
// - Sa Calobra (686m, 7.2%): (686 × 7.2) / 10 = 494 points → HC
// - Port Soller climb (400m, 4%): (400 × 4) / 10 = 160 points → Cat 1
// - Moderate climb (200m, 5%): (200 × 5) / 10 = 100 points → Cat 2
function classifyClimb(elevationM, lengthKm) {
    // Check minimum requirements first
    const avgGradient = (elevationM / (lengthKm * 1000)) * 100;

    if (lengthKm < CLIMB_CONFIG.minLength) return null;
    if (avgGradient < CLIMB_CONFIG.minGradient) return null;
    if (elevationM < CLIMB_CONFIG.minElevation) return null;

    // Calculate points using gradient-weighted formula
    const points = (elevationM * avgGradient) / 10;

    // Classify based on points
    let category, categoryName;
    if (points >= 400) {
        category = 'HC';
        categoryName = 'Hors Catégorie';
    } else if (points >= 250) {
        category = '1';
        categoryName = 'Kategori 1';
    } else if (points >= 150) {
        category = '2';
        categoryName = 'Kategori 2';
    } else if (points >= 80) {
        category = '3';
        categoryName = 'Kategori 3';
    } else if (points >= 30) {
        category = '4';
        categoryName = 'Kategori 4';
    } else {
        return null; // Doesn't meet classification threshold
    }

    return {
        category,
        categoryName,
        points: Math.round(points),
        elevation: Math.round(elevationM),
        length: lengthKm,
        gradient: avgGradient
    };
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CLIMB_CONFIG, classifyClimb };
}
