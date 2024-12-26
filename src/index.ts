import express from 'express';
import pool from './config/db';
import routesEntity from './routes/entity';
import routesUser from './routes/user';
import cors from 'cors';
import mailer from 'express-mailer'

const app = express();
const constructOrigins = (): string[] => {

	const corsOrigins: string[] = []
	if (process.env.FRONT__URL_PROD) {
		corsOrigins.push(process.env.FRONT__URL_PROD)
	}
	if (process.env.FRONT__URL_LOCAL) {
		corsOrigins.push(process.env.FRONT__URL_LOCAL)
	}
	return corsOrigins
}
app.use(cors({
	origin: constructOrigins(),
	methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
	allowedHeaders: ['Content-Type', 'Authorization'],
	credentials: true
}));
pool.query('SELECT NOW()', (err, res) => {
	if (err) {
		console.error('Error connecting to the database', err.stack);
	} else {
		console.log('Connected to the database:', res.rows);
	}
});
app.use(express.json());

const PORT = 8000;
app.use('/user', routesUser)
app.use('/entity', routesEntity)
mailer.extend(app, {
	from: process.env.MAIL_USER,
	host: 'smtp.mail.ru', // hostname
	secureConnection: true, // use SSL
	port: 465, // port for secure SMTP
	transportMethod: 'SMTP', // default is SMTP. Accepts anything that nodemailer accepts
	auth: {
		user: process.env.MAIL_USER,
		pass: process.env.MAIL_PASSWORD
	}
});
app.set('views', __dirname + '/src/config/mailViews');
app.set('view engine', 'jade');
app.listen(Number(PORT), () => {
	console.log(`Server running on port ${PORT}`);
});
export { app };