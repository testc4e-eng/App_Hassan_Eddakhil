const http = require('http');

console.log('🔧 Test simple du backend...');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/v1/hydro/health',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log('Réponse JSON:', JSON.stringify(json, null, 2));
    } catch (e) {
      console.log('Réponse brute:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Erreur de connexion:', error.message);
  console.log('Vérifiez que le backend tourne: npm run dev dans le dossier backend');
});

req.end();