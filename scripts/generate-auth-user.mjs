import { randomBytes, scryptSync } from 'node:crypto';

function usage() {
  console.log('Usage: npm run auth:user -- <email> <password> [display name]');
}

const [, , emailArg, passwordArg, ...nameParts] = process.argv;

if (!emailArg || !passwordArg) {
  usage();
  process.exit(1);
}

const email = emailArg.trim().toLowerCase();
const password = passwordArg;
const name = nameParts.join(' ').trim() || email.split('@')[0] || 'Hiker';
const id = email.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '') || email;
const salt = randomBytes(16).toString('hex');
const passwordHash = scryptSync(password, salt, 64).toString('hex');

const record = { id, email, name, salt, passwordHash };
console.log(JSON.stringify(record, null, 2));
