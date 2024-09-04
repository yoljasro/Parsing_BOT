const { Telegraf } = require('telegraf');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const bot = new Telegraf(process.env.BOT_TOKEN);

// Botni boshlang'ich xabari va tugmasini qo'shish
bot.start((ctx) => {
  ctx.reply('Добро пожаловать! Выберите действие:', {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Спрасить откытый чат', callback_data: 'ask_chat' }]
      ],
    },
  });
});

// "Спрасить откытый чат" tugmasi bosilganda
bot.action('ask_chat', (ctx) => {
  ctx.reply('Отправьте ссылку на чат, который вы хотите спарсить.');

  bot.on('text', async (ctx) => {
    const chatLink = ctx.message.text.trim();

    ctx.reply('Parsing...');

    try {
      const chatData = await parseChat(chatLink);
      const filePath = path.join(__dirname, 'chat_data.txt');

      fs.writeFileSync(filePath, chatData);

      await ctx.replyWithDocument({ source: filePath });
    } catch (error) {
      ctx.reply('Xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.');
      console.error('Parsingda xatolik:', error);
    }
  });
});

// Chatni parsing qilish uchun funksiya
async function parseChat(chatLink) {
  let chatId;

  if (chatLink.startsWith('@')) {
    chatId = chatLink;
  } else {
    throw new Error('Noto\'g\'ri chat ssilkasi');
  }

  try {
    const chat = await bot.telegram.getChat(chatId);
    const chatAdmins = await bot.telegram.getChatAdministrators(chatId);
    const chatMembersCount = await bot.telegram.getChatMembersCount(chatId);
    
    let chatData = `Parsing qilingan chat: ${chat.title}\n\n`;
    chatData += `Chat ID: ${chat.id}\n`;
    chatData += `Chat turi: ${chat.type}\n`;
    chatData += `Chat username: ${chat.username}\n`;
    chatData += `Chatga kirish havolasi: ${chat.invite_link || 'N/A'}\n\n`;

    chatData += 'Administratorlar:\n';
    chatAdmins.forEach(admin => {
      chatData += `- ${admin.user.username || admin.user.first_name} (${admin.status})\n`;
    });
    chatData += '\n';

    chatData += `Chatdagi a'zolar soni: ${chatMembersCount}\n\n`;

    // Eng so'nggi 100 ta xabarni olish
    const updates = await bot.telegram.getUpdates({ limit: 100 });
    
    let lastMessages = 'Oxirgi 100 ta xabarlar:\n';
    updates.forEach(update => {
      if (update.message && update.message.chat.id === chatId) {
        lastMessages += `Xabar: ${update.message.text || 'Media'}\n`;
      }
    });

    chatData += lastMessages;

    return chatData;
  } catch (error) {
    console.error('Parsingda xatolik:', error);
    throw new Error('Chatni topishning iloji bo‘lmadi');
  }
}

// Botni ishga tushirish
bot.launch();

console.log('Bot ishga tushirildi...');
