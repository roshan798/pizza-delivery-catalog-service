import { config } from 'dotenv';
config();
const { PORT, HOST } = process.env
export const Config = {
	PORT,
	HOST,
	URL: `http://${HOST}:${PORT}`,
	NODE_ENV: process.env.NODE_ENV,
};
