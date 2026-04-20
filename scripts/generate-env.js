const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.SUPABASE_URL || '/sb-api';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

const envContent = `export const environment = {
  production: true,
  devMode: false,
  supabase: {
    url: '${supabaseUrl}',
    anonKey: '${supabaseAnonKey}',
  }
};
`;

const envDir = path.join(__dirname, '..', 'src', 'environments');

// Generate both files so the build works regardless of fileReplacements
fs.writeFileSync(path.join(envDir, 'environment.ts'), envContent);
fs.writeFileSync(path.join(envDir, 'environment.prod.ts'), envContent);

console.log('Environment files generated for production build');
