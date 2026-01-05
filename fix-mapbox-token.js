const fs = require('fs');
const path = require('path');

// Read the current .env.local file
const envPath = path.join(__dirname, '.env.local');

try {
  let envContent = fs.readFileSync(envPath, 'utf8');

  // Remove duplicate NEXT_PUBLIC_MAPBOX_TOKEN entries
  const lines = envContent.split('\n');
  const filteredLines = [];
  let mapboxTokenFound = false;

  for (const line of lines) {
    if (line.startsWith('NEXT_PUBLIC_MAPBOX_TOKEN=')) {
      if (!mapboxTokenFound) {
        // Keep the first occurrence but ask user to update it
        console.log('❌ Current Mapbox token appears to be expired or invalid.');
        console.log('📝 Please get a new token from: https://account.mapbox.com/access-tokens/');
        console.log('🔧 Then update the NEXT_PUBLIC_MAPBOX_TOKEN in .env.local');
        console.log('');
        console.log('Current token in file:', line.split('=')[1]);
        filteredLines.push(line);
        mapboxTokenFound = true;
      }
      // Skip duplicate entries
    } else {
      filteredLines.push(line);
    }
  }

  // Write back the cleaned file
  fs.writeFileSync(envPath, filteredLines.join('\n'));

  console.log('✅ Cleaned up duplicate Mapbox tokens in .env.local');
  console.log('🔄 Please restart your development server after updating the token');

} catch (error) {
  console.error('❌ Error updating .env.local:', error.message);
}
