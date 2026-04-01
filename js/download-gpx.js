// Shared GPX download logic for index.html and mobile.html

const GPX_DAY_SLUGS  = ['PortdeSoller', 'CapdeFormentor', 'SaCalobra', 'SantSalvador'];
const GPX_DAY_PLACES = ['Port de Soller', 'Cap de Formentor', 'Sa Calobra', 'Sant Salvador'];

function buildDayGPX(dayId, dayRoutes, dayInfo, device, tripDate) {
    const slug  = GPX_DAY_SLUGS[dayId - 1]  || `Dag${dayId}`;
    const place = GPX_DAY_PLACES[dayId - 1] || `Dag ${dayId}`;
    const desc  = dayInfo ? dayInfo.intro : '';
    const gpxName = `GGTM26_Dag${dayId}_${slug}`;
    const generated = new Date().toISOString();
    const creator = `Team Gåpings Mallorca Getaway Semi-Automatic Online Configurator for ${device}`;

    let allPoints = [];
    dayRoutes.forEach(route => { if (route.gpxPoints) allPoints = allPoints.concat(route.gpxPoints); });

    // Synthetic timestamps: start 08:00 local (06:00 UTC) on the trip date, spread over 6h
    const startMs = tripDate
        ? new Date(`${tripDate}T06:00:00Z`).getTime()
        : Date.now();
    const durationMs = 6 * 3600 * 1000;
    const n = allPoints.length;

    let trkpts = '';
    allPoints.forEach((point, i) => {
        const t = new Date(startMs + (n > 1 ? (i / (n - 1)) * durationMs : 0)).toISOString();
        trkpts += `      <trkpt lat="${point.lat}" lon="${point.lon}">`;
        if (point.ele !== null && point.ele !== undefined) trkpts += `<ele>${point.ele}</ele>`;
        trkpts += `<time>${t}</time>`;
        trkpts += `</trkpt>\n`;
    });

    return {
        fileName: `${gpxName}.gpx`,
        content: `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1"
     creator="${creator}"
     xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>${gpxName}</name>
    <desc>${desc}</desc>
    <author><name>Team Gåping</name></author>
    <copyright author="Team Gåping"/>
    <link href="https://kasbohm.github.io/ggtm26/">
      <text>Team Gåpings Mallorca Getaway 2026</text>
    </link>
    <time>${generated}</time>
    <keywords>Mallorca, ${place}, Team Gåping, #GGTM26, treningsleir, 1st Annual</keywords>
  </metadata>
  <trk>
    <name>Dag ${dayId} — ${place}</name>
    <trkseg>
${trkpts}    </trkseg>
  </trk>
</gpx>`
    };
}

function triggerGPXDownload(fileName, content) {
    const blob = new Blob([content], { type: 'application/gpx+xml' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: fileName });
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
