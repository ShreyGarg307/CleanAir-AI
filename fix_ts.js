const fs = require('fs');
let code = fs.readFileSync('src/components/InteractiveMap.tsx', 'utf8');
code = code.replace(/"localContext"\)\[\]/g, '")[]');
code = code.replace(/key={inc.id}/g, '');
code = code.replace(/<OverlayView/g, '<div key={inc ? inc.id : poi ? poi.id : Math.random()}><OverlayView');
code = code.replace(/<\/OverlayView>/g, '</OverlayView></div>');
fs.writeFileSync('src/components/InteractiveMap.tsx', code);
