// Shared GPX download logic for index.html and mobile.html

const GPX_DAY_SLUGS  = ['PortdeSoller', 'CapdeFormentor', 'SaCalobra', 'SantSalvador'];
const GPX_DAY_PLACES = ['Port de Soller', 'Cap de Formentor', 'Sa Calobra', 'Sant Salvador'];

function xmlEscape(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function buildDayGPX(dayId, dayRoutes, dayInfo, device) {
    const slug  = GPX_DAY_SLUGS[dayId - 1]  || `Dag${dayId}`;
    const place = GPX_DAY_PLACES[dayId - 1] || `Dag ${dayId}`;
    const gpxName = `GGTM26_Dag${dayId}_${slug}`;

    let allPoints = [];
    dayRoutes.forEach(route => { if (route.gpxPoints) allPoints = allPoints.concat(route.gpxPoints); });

    let trkpts = '';
    allPoints.forEach(point => {
        trkpts += `      <trkpt lat="${point.lat}" lon="${point.lon}">`;
        if (point.ele !== null && point.ele !== undefined) trkpts += `<ele>${point.ele}</ele>`;
        trkpts += `</trkpt>\n`;
    });

    return {
        fileName: `${gpxName}.gpx`,
        content: `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1"
     creator="GGTM26"
     xmlns="http://www.topografix.com/GPX/1/1"
     xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
     xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
  <metadata>
    <name>${xmlEscape(gpxName)}</name>
  </metadata>
  <trk>
    <name>${xmlEscape(`Dag ${dayId} - ${place}`)}</name>
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
