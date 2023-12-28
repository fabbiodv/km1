import qrcode from 'qrcode-terminal';
import { Client } from 'whatsapp-web.js';
import puppeteer from 'puppeteer';

const client = new Client();

client.on('qr', qr => {
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('Cliente logueado!');
});

client.on('message_create', async message => {
  if (message.body.toLowerCase() === 'hay lugar?') {
    try {
      const availabilityMessage = await getDataFromWebPage();
      message.reply(availabilityMessage);
    } catch (error) {
      console.error('Error al obtener la disponibilidad:', error.message);
      message.reply('Hubo un error al obtener la disponibilidad. Por favor, intenta nuevamente más tarde.');
    }
  }
});

client.initialize();

async function getDataFromWebPage() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  try {
    await page.goto('https://www.kilometrounoviajes.com.ar/destinos/319-verano-playita-enero-2024.html');

    const data = await page.evaluate(() => {
      let titles = document.querySelectorAll('h1');
      let disponibilidadElements = document.querySelectorAll('p');
      let lugares = document.querySelectorAll('h4');
      // Convertir NodeList a un array de textos
      titles = Array.from(titles).map(title => title.innerText);
      disponibilidadElements = Array.from(disponibilidadElements).map(description => description.innerText);
      lugares = Array.from(lugares).map(h4 => h4.innerText);
      const disponibilidad = disponibilidadElements.map(d => d.toLowerCase().includes('disponible') ? 'Disponible' : 'Completo');
      return {
        titles,
        disponibilidad,
        lugares,
      };
    });

    const lugaresDisponibles = data.disponibilidad.filter(d => d === 'Disponible');

    if (lugaresDisponibles.length > 0) {
      const mensajesDisponibilidad = lugaresDisponibles.map((_, index) => {
        return `¡Hay disponibilidad para ${data.lugares[index]}!`;
      });
      return mensajesDisponibilidad.join('\n');
    } else {
      return 'No hay disponibilidad para ningún lugar.';
    }
  } finally {
    await browser.close();
  }
}
