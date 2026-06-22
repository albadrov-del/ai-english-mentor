// Entry point: wires the real Anthropic client and starts the server.
// Run with `npm start` after setting ANTHROPIC_API_KEY and APP_PIN (see .env.example).
import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';
import { createApp } from './server/app.js';

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('Missing ANTHROPIC_API_KEY. Copy .env.example to .env and set it.');
  process.exit(1);
}
if (!process.env.APP_PIN) {
  console.error('Missing APP_PIN (the shared access PIN). Set it in .env.');
  process.exit(1);
}

const anthropic = new Anthropic(); // reads ANTHROPIC_API_KEY from env
const app = createApp({ anthropic });
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`AI English Mentor running on http://localhost:${PORT}`);
});
