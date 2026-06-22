require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const express = require('express');
const path = require('path');
const cors = require('cors');

const token = process.env.BOT_TOKEN || '7929663057:AAE70g2rF0x99TwqgRyyW-ETIKs6uZb0uV8';
const bot = new Telegraf(token);

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

const localtunnel = require('localtunnel');

let webAppUrl = process.env.WEBAPP_URL || 'https://example.com/please-set-webapp-url-in-env';

// Set up the bot
bot.start((ctx) => {
  ctx.reply(
    'Добро пожаловать! Я ваш ассистент отдела продаж. Нажмите кнопку ниже (в меню клавиатуры), чтобы открыть каталог.',
    Markup.keyboard([
      Markup.button.webApp('🛒 Открыть каталог (Dark Knight)', webAppUrl)
    ]).resize()
  );
});

bot.help((ctx) => ctx.reply('Спросите меня о наличии товаров или ценах! (Демо)'));

bot.on('text', (ctx) => {
  const text = ctx.message.text.toLowerCase();
  
  if (text.includes('цена') || text.includes('стоимость')) {
    return ctx.reply('Интеграция с 1С показывает, что цены на этот товар начинаются от 5000 руб.');
  } else if (text.includes('наличи') || text.includes('остатк')) {
    return ctx.reply('Сейчас на складе (по данным 1С) осталось 15 единиц этого товара.');
  } else {
    return ctx.reply('Я ищу информацию в нашей векторной базе данных... К сожалению, пока не нашел точного ответа. Сформулируйте запрос иначе или откройте каталог.');
  }
});

bot.on('message', async (ctx) => {
  if (ctx.message?.web_app_data) {
    try {
      const data = JSON.parse(ctx.message.web_app_data.data);
      if (data.action === 'buy') {
        const receipt = `
🧾 <b>ЭЛЕКТРОННЫЙ ЧЕК ЗАКАЗА</b> 🧾
━━━━━━━━━━━━━━━━━━━━━━
<b>Организация:</b> DARK KNIGHT STORE
<b>ИНН:</b> 7701234567

📦 <b>Товар:</b> ${data.item}
💳 <b>К оплате:</b> ${data.price}

Статус: 🟡 ОЖИДАЕТ ОПЛАТЫ
━━━━━━━━━━━━━━━━━━━━━━
✅ Ваш заказ успешно сформирован!
Для завершения оформления и по всем вопросам обращайтесь в поддержку: @SCK_Official
        `;
        return ctx.reply(receipt, { parse_mode: 'HTML' });
      }
    } catch (e) {
      console.error(e);
    }
  }
});

// API for the web app to query items
app.get('/api/products', (req, res) => {
  res.json([
    { id: 1, name: 'Худи "Dark Knight" Oversize', price: '8 500 ₽', stock: 12, image: '/images/hoodie.jpg' },
    { id: 2, name: 'Тактические Карго Брюки', price: '6 200 ₽', stock: 8, image: '/images/cargo.jpg' },
    { id: 3, name: 'Матовая куртка "Bat-Tech"', price: '12 900 ₽', stock: 3, image: '/images/jacket.jpg' },
    { id: 4, name: 'Тяжелые ботинки "Gotham"', price: '14 000 ₽', stock: 5, image: '/images/boots.jpg' },
    { id: 5, name: 'Тактические перчатки', price: '3 500 ₽', stock: 20, image: '/images/gloves.jpg' }
  ]);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  
  try {
    const { startTunnel } = require('untun');
    const tunnel = await startTunnel({ port: PORT, acceptCloudflareNotice: true });
    
    // Some Cloudflare tunnels take a second to propagate fully
    webAppUrl = await tunnel.getURL();
    console.log(`Tunnel is running at: ${webAppUrl}`);
    
    // Update bot menu keyboard link just in case
    bot.start((ctx) => {
      ctx.reply(
        'Добро пожаловать! Я ваш ассистент отдела продаж. Нажмите кнопку ниже (в меню клавиатуры), чтобы открыть каталог.',
        Markup.keyboard([
          Markup.button.webApp('🛒 Открыть каталог (Dark Knight)', webAppUrl)
        ]).resize()
      );
    });
    
  } catch (err) {
    console.error('Failed to create tunnel:', err);
  }

  bot.launch().then(() => console.log('Bot is running'));
});

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
