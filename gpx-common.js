// Gåpings Mallorca Getaway - Common GPX Functions
// Shared between desktop and mobile versions

const routes = [];
const colors = [
    '#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6',
    '#1abc9c', '#e67e22', '#34495e', '#16a085', '#c0392b',
    '#27ae60', '#2980b9', '#8e44ad', '#d35400', '#7f8c8d'
];

const dayColors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12'];
const days = [
    { id: 1, name: 'Dag 1', routes: [], visible: true, color: dayColors[0] },
    { id: 2, name: 'Dag 2', routes: [], visible: true, color: dayColors[1] },
    { id: 3, name: 'Dag 3', routes: [], visible: true, color: dayColors[2] },
    { id: 4, name: 'Dag 4', routes: [], visible: true, color: dayColors[3] }
];

const bundledRouteFiles = [
    'GGTM26_D1_A_Helios_Port_de_Soller_107km_1800hm.gpx',
    'GGTM26_D1_A_Port_de_Soller_Helios_87km_1500hm.gpx',
    'GGTM26_D1_B_Helios_Port_de_Soller_66km_1000hm.gpx',
    'GGTM26_D1_B1_Port_de_Soller_Helios_40km_500hm.gpx',
    'GGTM26_D1_B2_Port_de_Soller_Helios_60km_1100hm.gpx',
    'GGTM26_D2_A_Cap_de_Formentor_Helios_125km_1300hm.gpx',
    'GGTM26_D2_A_Helios_Cap_de_Formentor_108km_1930hm.gpx',
    'GGTM26_D2_B_Helios_Cap_de_Formentor_83km_1000hm.gpx',
    'GGTM26_D2_B1_Cap_de_Formentor_Helios_(tog)_40km_500hm.gpx',
    'GGTM26_D2_B2_Cap_de_Formentor_Helios_(tog)_60km_1100hm.gpx',
    'GGTM26_D3_A_Helios_Sa_Calobra__105km_1900hm.gpx',
    'GGTM26_D3_A_Sa_Calobra__Helios_100km_2300hm.gpx',
    'GGTM26_D3_B_Helios_Sa_Calobra__75km_1100hm.gpx',
    'GGTM26_D3_B1_Sa_Calobra__Helios_70km_1000hm.gpx',
    'GGTM26_D3_B2_Sa_Calobra__Helios_90km_1500hm.gpx',
    'GGTM26_D4_A_Helios_Puig_Major__72km_2400hm.gpx',
    'GGTM26_D4_A_Puig_Major_Helios_100km_1700hm.gpx',
    'GGTM26_D4_B_Helios_Puig_Major__62km_1700hm.gpx',
    'GGTM26_D4_B_Puig_Major_Helios_76km_850hm.gpx'
];

function parseGPX(xmlString) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
    const points = [];
    const trkpts = xmlDoc.getElementsByTagName('trkpt');
    
    for (let i = 0; i < trkpts.length; i++) {
        const lat = parseFloat(trkpts[i].getAttribute('lat'));
        const lon = parseFloat(trkpts[i].getAttribute('lon'));
        const eleNode = trkpts[i].getElementsByTagName('ele')[0];
        const ele = eleNode ? parseFloat(eleNode.textContent) : null;
        points.push({ lat, lon, ele });
    }
    return points;
}

function calculateStats(points) {
    if (points.length < 2) return null;
    
    let distance = 0;
    let elevationGain = 0;
    let elevationLoss = 0;
    let minEle = points[0].ele;
    let maxEle = points[0].ele;
    
    for (let i = 1; i < points.length; i++) {
        const p1 = points[i - 1];
        const p2 = points[i];
        
        const R = 6371;
        const dLat = (p2.lat - p1.lat) * Math.PI / 180;
        const dLon = (p2.lon - p1.lon) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(p1.lat * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        distance += R * c;
        
        if (p1.ele !== null && p2.ele !== null) {
            const elevDiff = p2.ele - p1.ele;
            if (elevDiff > 0) elevationGain += elevDiff;
            else elevationLoss += Math.abs(elevDiff);
            
            if (p2.ele < minEle) minEle = p2.ele;
            if (p2.ele > maxEle) maxEle = p2.ele;
        }
    }
    
    return {
        distance: distance.toFixed(1),
        elevationGain: Math.round(elevationGain),
        elevationLoss: Math.round(elevationLoss),
        minEle: minEle !== null ? Math.round(minEle) : null,
        maxEle: maxEle !== null ? Math.round(maxEle) : null
    };
}

async function enrichWithElevation(points) {
    const targetSamples = 50;
    const sampleRate = Math.max(1, Math.floor(points.length / targetSamples));
    const sampledIndices = [];
    
    for (let i = 0; i < points.length; i += sampleRate) {
        sampledIndices.push(i);
    }
    if (sampledIndices[sampledIndices.length - 1] !== points.length - 1) {
        sampledIndices.push(points.length - 1);
    }
    
    const locations = sampledIndices.map(i => ({
        latitude: points[i].lat,
        longitude: points[i].lon
    }));
    
    try {
        const response = await fetch('https://api.open-elevation.com/api/v1/lookup', {
            method: 'POST',
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
            body: JSON.stringify({ locations })
        });
        
        if (!response.ok) throw new Error('Elevation API failed');
        const data = await response.json();
        
        data.results.forEach((result, idx) => {
            points[sampledIndices[idx]].ele = result.elevation;
        });
        
        for (let i = 0; i < sampledIndices.length - 1; i++) {
            const startIdx = sampledIndices[i];
            const endIdx = sampledIndices[i + 1];
            const startEle = points[startIdx].ele;
            const endEle = points[endIdx].ele;
            
            for (let j = startIdx + 1; j < endIdx; j++) {
                const ratio = (j - startIdx) / (endIdx - startIdx);
                points[j].ele = startEle + (endEle - startEle) * ratio;
            }
        }
        return true;
    } catch (error) {
        console.error('Failed to enrich elevation:', error);
        return false;
    }
}

function autoMakeElite() {
    days.forEach(day => day.routes = []);
    
    for (let dayNum = 1; dayNum <= 4; dayNum++) {
        const day = days.find(d => d.id === dayNum);
        if (!day) continue;
        
        const dayARoutes = routes.filter(r => {
            const match = r.fileName.match(/GGTM26_D(\d+)_A_/);
            if (!match || parseInt(match[1]) !== dayNum) return false;
            const afterA = r.fileName.split('_A_')[1];
            return afterA && !afterA.match(/^[12]/);
        });
        
        if (dayARoutes.length >= 2) {
            const utRoute = dayARoutes.find(r => r.fileName.includes('Helios_'));
            const hjemRoute = dayARoutes.find(r => !r.fileName.includes('Helios_') && r.fileName.includes('_Helios'));
            
            if (utRoute && hjemRoute) {
                day.routes.push(utRoute.id, hjemRoute.id);
            } else {
                dayARoutes.slice(0, 2).forEach(route => day.routes.push(route.id));
            }
        }
    }
    return true;
}

function autoMakeMosjonist() {
    days.forEach(day => day.routes = []);
    
    for (let dayNum = 1; dayNum <= 4; dayNum++) {
        const day = days.find(d => d.id === dayNum);
        if (!day) continue;
        
        const dayBRoutes = routes.filter(r => {
            const match = r.fileName.match(/GGTM26_D(\d+)_B_/);
            if (!match || parseInt(match[1]) !== dayNum) return false;
            const afterB = r.fileName.split('_B_')[1];
            return afterB && !afterB.match(/^[12]/);
        });
        
        if (dayBRoutes.length >= 2) {
            const utRoute = dayBRoutes.find(r => r.fileName.includes('Helios_'));
            const hjemRoute = dayBRoutes.find(r => !r.fileName.includes('Helios_') && r.fileName.includes('_Helios'));
            
            if (utRoute && hjemRoute) {
                day.routes.push(utRoute.id, hjemRoute.id);
            } else {
                dayBRoutes.slice(0, 2).forEach(route => day.routes.push(route.id));
            }
        } else {
            const b1Route = routes.find(r => r.fileName.includes(`GGTM26_D${dayNum}_B1_`));
            const b2Route = routes.find(r => r.fileName.includes(`GGTM26_D${dayNum}_B2_`));
            if (b1Route && b2Route) {
                day.routes.push(b1Route.id, b2Route.id);
            }
        }
    }
    return true;
}

function downloadDayGPX(dayId) {
    const day = days.find(d => d.id === dayId);
    if (!day || day.routes.length === 0) {
        alert('Ingen ruter valgt for denne dagen!');
        return;
    }

    const dayRoutes = day.routes.map(routeId => routes.find(r => r.id === routeId)).filter(r => r);
    if (!dayRoutes[0] || !dayRoutes[0].gpxPoints) {
        alert('GPX-punkter mangler.');
        return;
    }

    let allPoints = [];
    dayRoutes.forEach(route => {
        if (route.gpxPoints) allPoints = allPoints.concat(route.gpxPoints);
    });

    let gpxContent = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Gåpings Mallorca Getaway" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata><n>Dag ${dayId} - ${dayRoutes.map(r => r.fileName).join(' + ')}</n></metadata>
  <trk><n>Dag ${dayId}</n><trkseg>
`;
    
    allPoints.forEach(point => {
        gpxContent += `      <trkpt lat="${point.lat}" lon="${point.lon}">`;
        if (point.ele !== null && point.ele !== undefined) {
            gpxContent += `<ele>${point.ele}</ele>`;
        }
        gpxContent += `</trkpt>
`;
    });
    
    gpxContent += `    </trkseg></trk></gpx>`;
    
    const blob = new Blob([gpxContent], { type: 'application/gpx+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Dag_${dayId}_Mallorca.gpx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
