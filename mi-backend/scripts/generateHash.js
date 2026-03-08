// Script per generar hash de contrasenyes
const bcrypt = require('bcrypt');

async function generateHash() {
  const password = 'contrasenya123';
  const hash = await bcrypt.hash(password, 10);
  console.log('Hash per "password123":');
  console.log(hash);
}

generateHash();
