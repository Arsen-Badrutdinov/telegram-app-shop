# 🦇 Dark Knight Store — Telegram Web App Bot

Полноценный интернет-магазин внутри Telegram с премиальным "Epic Design" интерфейсом (Glassmorphism, 3D-слои, GSAP-анимации) и стилем Dark Knight.

## 🚀 Описание проекта
Этот проект представляет собой Telegram-бота на Node.js (Telegraf) с интегрированным Web App на ванильном HTML/CSS/JS. Бот автоматически поднимает Cloudflare-туннель для безопасного HTTPS-соединения с Telegram.

---

## 💳 ТУТОРИАЛ: Как принимать реальные деньги и запрашивать адрес доставки

На данный момент бот работает в режиме "генерации чека" и перенаправления в поддержку. Чтобы принимать **реальные платежи** прямо в Telegram (Apple Pay, Google Pay, банковские карты) и собирать адреса доставки, выполните следующие шаги:

### Шаг 1. Подключение провайдера оплат в BotFather
1. Откройте [@BotFather](https://t.me/BotFather) в Telegram.
2. Отправьте команду `/mybots` и выберите вашего бота.
3. Нажмите **Bot Settings** ➔ **Payments**.
4. Выберите платежного провайдера (например, **ЮKassa**, **Robokassa**, **Stripe** или **Telegram Stars**).
5. Следуйте инструкциям бота для авторизации в системе провайдера.
6. В конце BotFather выдаст вам токен. Это ваш `PROVIDER_TOKEN`.

### Шаг 2. Как изменить код бота (`index.js`), чтобы отправлять инвойс
Вместо обычного текстового ответа (`ctx.reply`), используйте метод `replyWithInvoice`.

Найдите в файле `index.js` блок обработки корзины (`bot.on('message'`) и замените его на этот код:

```javascript
bot.on('message', async (ctx) => {
  if (ctx.message?.web_app_data) {
    const data = JSON.parse(ctx.message.web_app_data.data);
    
    if (data.action === 'buy') {
      // Конвертируем цену в копейки/центы (например, 8500 рублей = 850000 копеек)
      const priceAmount = parseInt(data.price.replace(/\D/g, '')) * 100;

      const invoice = {
        title: data.item,
        description: 'Официальный мерч Dark Knight Store',
        payload: 'order_payload_' + Date.now(), // Уникальный ID заказа
        provider_token: 'ВАШ_PROVIDER_TOKEN_ИЗ_BOTFATHER', // Вставьте сюда токен
        currency: 'RUB', // Или USD/EUR
        prices: [{ label: data.item, amount: priceAmount }],
        need_name: true,               // Запросить имя покупателя
        need_phone_number: true,       // Запросить номер телефона
        need_shipping_address: true,   // ЗАПРОСИТЬ АДРЕС ДОСТАВКИ
        is_flexible: false             // true, если цена доставки зависит от адреса
      };

      return ctx.replyWithInvoice(invoice);
    }
  }
});
```

### Шаг 3. Обработка успешной оплаты
После того как клиент введет данные карты и адрес доставки, Telegram отправит боту два события. Их нужно добавить в `index.js` (в самый конец файла):

```javascript
// 1. Подтверждение перед списанием средств (ОБЯЗАТЕЛЬНО)
bot.on('pre_checkout_query', (ctx) => {
  // Тут можно проверить наличие товара на складе. Если всё ок — одобряем:
  ctx.answerPreCheckoutQuery(true);
});

// 2. Успешная оплата
bot.on('successful_payment', (ctx) => {
  const paymentInfo = ctx.message.successful_payment;
  const orderInfo = paymentInfo.order_info;
  
  // orderInfo содержит адрес, телефон и имя!
  const address = orderInfo.shipping_address;
  const fullAddress = `${address.country_code}, ${address.city}, ${address.street_line1}`;

  ctx.reply(`✅ Оплата успешно прошла!\n\nМы отправим ваш заказ (${paymentInfo.total_amount / 100} ${paymentInfo.currency}) по адресу: ${fullAddress}.`);
  
  // Здесь можно сохранить заказ в базу данных или отправить уведомление админу
});
```

### Итог: Как это выглядит для клиента?
1. Клиент нажимает "Оплатить" в WebApp.
2. Бот мгновенно присылает красивый системный Инвойс от Telegram.
3. Клиент нажимает "Заплатить", у него всплывает нативное окно Telegram с просьбой ввести **Адрес доставки**, **Имя**, **Телефон** и **Данные карты**.
4. После оплаты деньги уходят на ваш счет ЮKassa/Stripe, а бот получает точный адрес для отправки товара!

---
## Запуск проекта
\`\`\`bash
npm install
node index.js
\`\`\`
Бот автоматически сгенерирует URL туннеля и обновит клавиатуру. Никаких дополнительных настроек webhook-ов вручную не требуется.
