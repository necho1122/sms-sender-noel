const express = require('express');
const bodyParser = require('body-parser');
const { Vonage } = require('@vonage/server-sdk');
const path = require('path');
const app = express();

const vonage = new Vonage({
	apiKey: 'dfbc33e0',
	apiSecret: '8xQfrI2HzPbvXhBq',
});

const from = 'Vonage APIs';
const text = 'A text message sent using the Vonage SMS API';

// Middleware para procesar datos de formularios
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public')); // Servir archivos estáticos desde la carpeta 'public'

// Ruta para servir el archivo index.html
app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, '/public/index.html'));
});

// Función para pausar la ejecución entre envíos
function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

// Ruta para manejar el envío de SMS
app.post('/send-sms', async (req, res) => {
	const phoneNumbers = req.body.phoneNumbers
		.split('\n')
		.map((line) => line.trim())
		.filter((number) => number.length > 0);

	for (const to of phoneNumbers) {
		try {
			const response = await vonage.sms.send({ to, from, text });
			console.log(`Mensaje enviado con éxito a ${to}`);
			console.log(response);
		} catch (err) {
			console.log(`Hubo un error al enviar el mensaje a ${to}.`);
			console.error(err);
		}
		await sleep(1000); // Pausa de 1 segundo entre envíos
	}

	res.send('SMS enviados correctamente');
});

// Servidor escuchando en el puerto 3000
app.listen(3000, () => {
	console.log('Servidor escuchando en http://localhost:3000');
});
