require('dotenv').config(); // Cargar las variables de entorno

const express = require('express');
const bodyParser = require('body-parser');
const { Vonage } = require('@vonage/server-sdk');
const path = require('path');
const compression = require('compression'); // Para comprimir respuestas
const helmet = require('helmet'); // Para mayor seguridad
const morgan = require('morgan'); // Para logging
const rateLimit = require('express-rate-limit'); // Limitador de peticiones

const app = express();

const vonage = new Vonage({
	apiKey: process.env.VONAGE_API_KEY,
	apiSecret: process.env.VONAGE_API_SECRET,
});

const from = 'Vonage APIs';
const text = 'A text message sent using the Vonage SMS API';

// Middleware para mejorar rendimiento y seguridad
app.use(compression()); // Comprimir respuestas
app.use(helmet()); // Agregar cabeceras de seguridad
app.use(morgan('combined')); // Logging de solicitudes HTTP

// Configuración del limitador de solicitudes para evitar abuso
const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutos
	max: 100, // Limita cada IP a 100 solicitudes por ventana de 15 minutos
});
app.use(limiter);

// Middleware para procesar datos de formularios y servir archivos estáticos
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public')); // Servir archivos estáticos desde la carpeta 'public'

// Ruta para servir el archivo index.html
app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, '/public/index.html'));
});

// Función para pausar la ejecución entre envíos (1 segundo)
function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

// Ruta para manejar el envío de SMS
app.post('/send-sms', async (req, res) => {
	const phoneNumbers = req.body.phoneNumbers
		.split('\n')
		.map((line) => line.trim())
		.filter((number) => number.length > 0); // Filtrar números válidos

	for (const to of phoneNumbers) {
		try {
			const response = await vonage.sms.send({ to, from, text });
			console.log(`Mensaje enviado con éxito a ${to}`);
			console.log(response);
		} catch (err) {
			console.log(`Error al enviar el mensaje a ${to}.`);
			console.error(err);
		}
		await sleep(1000); // Pausa de 1 segundo entre envíos
	}

	res.send('SMS enviados correctamente');
});

// Manejo global de errores
app.use((err, req, res, next) => {
	console.error(err.stack);
	res.status(500).send('Ocurrió un error en el servidor.');
});

// Configuración del puerto para producción
const port = process.env.PORT || 3000;
app.listen(port, () => {
	console.log(`Servidor escuchando en http://localhost:${port}`);
});
