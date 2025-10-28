const bcrypt = require('bcryptjs');

// Generate password hash for authentication setup
async function generatePasswordHash() {
  const password = process.argv[2];
  
  if (!password) {
    console.log('Usage: node scripts/setup-auth.js <password>');
    console.log('Example: node scripts/setup-auth.js mySecurePassword123');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('❌ Password must be at least 8 characters long');
    process.exit(1);
  }

  try {
    const saltRounds = 12;
    const hash = await bcrypt.hash(password, saltRounds);
    
    console.log('🔐 Password hash generated successfully!');
    console.log('');
    console.log('Add these environment variables to your .env.local file:');
    console.log('');
    console.log(`AUTH_USERNAME=admin`);
    console.log(`AUTH_PASSWORD_HASH=${hash}`);
    console.log(`JWT_SECRET=${require('crypto').randomBytes(64).toString('hex')}`);
    console.log('');
    console.log('⚠️  Keep these values secure and never commit them to version control!');
    
  } catch (error) {
    console.error('❌ Error generating password hash:', error.message);
    process.exit(1);
  }
}

generatePasswordHash();
