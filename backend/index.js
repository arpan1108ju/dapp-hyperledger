
// /backend/index.js
import { connectToGateway } from './gateway/connect.js';
import { disconnectFromGateway } from './gateway/disconnect.js';

let running = true;

const start = async () => {
    try {
        await connectToGateway();

    } catch (error) {
        console.error('❌ Error during start:', error.message || error);
        await stop(); 
        process.exit(1);
    }
};

const stop = async () => {
    if (!running) return;
    running = false;
    try {
        await disconnectFromGateway();
    } catch (error) {
        console.error('❌ Error during stop:', error.message || error);
    } finally {
        process.exit(0);
    }
};

// 🔁 Handle termination signals (Ctrl+C, kill, etc.)
process.on('SIGINT', stop);     // Ctrl+C
process.on('SIGTERM', stop);    // kill
process.on('uncaughtException', async (err) => {
    console.error('💥 Uncaught Exception:', err);
    await stop();
});
process.on('unhandledRejection', async (reason) => {
    console.error('💥 Unhandled Rejection:', reason);
    await stop();
});

// 🔥 Start the app
start();
