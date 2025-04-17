// vercel-build.js
const { execSync } = require('child_process');

try {
  console.log('Instalando dependências...');
  execSync('npm install --production', { stdio: 'inherit' });
  
  console.log('Build completado com sucesso!');
  process.exit(0);
} catch (error) {
  console.error('Erro no build:', error);
  process.exit(1);
}