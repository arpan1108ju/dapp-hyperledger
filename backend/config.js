import dotenv from 'dotenv';

dotenv.config({
    path: "./env",
});

const PORT = process.env.PORT || 5000;

export {
    PORT
};