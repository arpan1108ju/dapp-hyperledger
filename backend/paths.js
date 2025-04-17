// paths.js (ESM compatible)
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BASE_NETWORK_PATH = join(__dirname, '..', 'network', 'crypto-config');
const CONNECTION_PROFILE_PATH = join(__dirname, 'connection-profile', 'connection-profile.json');
const WALLET_PATH = join(__dirname,'wallet');


export { BASE_NETWORK_PATH, CONNECTION_PROFILE_PATH,WALLET_PATH };
