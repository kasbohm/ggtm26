// Shared GPX download logic for index.html and mobile.html

const GPX_DAY_SLUGS  = ['PortdeSoller', 'CapdeFormentor', 'SaCalobra', 'SantSalvador'];
const GPX_DAY_PLACES = ['Port de Soller', 'Cap de Formentor', 'Sa Calobra', 'Sant Salvador'];

function buildDayGPX(dayId, dayRoutes, dayInfo, device) {
    const slug  = GPX_DAY_SLUGS[dayId - 1]  || `Dag${dayId}`;
    const place = GPX_DAY_PLACES[dayId - 1] || `Dag ${dayId}`;
    const desc  = dayInfo ? dayInfo.intro : '';
    const gpxName = `GGTM26_Dag${dayId}_${slug}`;
    const generated = new Date().toISOString();
    const creator = `Team Gåpings Mallorca Getaway Semi-Automatic Online Configurator for ${device}`;

    let trkpts = '';
    let allPoints = [];
    dayRoutes.forEach(route => { if (route.gpxPoints) allPoints = allPoints.concat(route.gpxPoints); });
    allPoints.forEach(point => {
        trkpts += `      <trkpt lat="${point.lat}" lon="${point.lon}">`;
        if (point.ele !== null && point.ele !== undefined) trkpts += `<ele>${point.ele}</ele>`;
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
