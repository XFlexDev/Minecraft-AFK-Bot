const mineflayer = require('mineflayer');
const config = require('./config.json');

let bot = null;
let movementPhase = 0;

const STEP_INTERVAL = 1500;
const JUMP_DURATION = 500;
const RETRY_DELAY = 5000;

function startBot() {
  try {
    console.log('Starting bot...');

    bot = mineflayer.createBot({
      host: config.serverHost,
      port: config.serverPort,
      username: config.botEmail,
      auth: 'microsoft'
    });

    bot.once('spawn', () => {
      setTimeout(() => {
        try {
          bot.setControlState('sneak', true);
          console.log(`Ready as ${bot.username}`);
          setTimeout(movementCycle, STEP_INTERVAL);
        } catch (e) {
          console.error('Spawn handler error:', e);
        }
      }, 3000);
    });

    bot.on('error', err => {
      console.error('Bot error:', err.message || err);
    });

    bot.on('end', () => {
      console.log('Disconnected, retrying in 5s...');
      safeRestart();
    });

  } catch (e) {
    console.error('Crash during start:', e);
    safeRestart();
  }
}

function safeRestart() {
  try {
    if (bot) {
      bot.removeAllListeners();
      bot = null;
    }
  } catch (_) {}

  setTimeout(startBot, RETRY_DELAY);
}

function movementCycle() {
  try {
    if (!bot || !bot.entity) {
      setTimeout(movementCycle, STEP_INTERVAL);
      return;
    }

    switch (movementPhase) {
      case 0:
        bot.setControlState('forward', true);
        bot.setControlState('back', false);
        bot.setControlState('jump', false);
        break;
      case 1:
        bot.setControlState('forward', false);
        bot.setControlState('back', true);
        bot.setControlState('jump', false);
        break;
      case 2:
        bot.setControlState('forward', false);
        bot.setControlState('back', false);
        bot.setControlState('jump', true);
        setTimeout(() => {
          try { if (bot) bot.setControlState('jump', false); } catch (_) {}
        }, JUMP_DURATION);
        break;
      case 3:
        bot.setControlState('forward', false);
        bot.setControlState('back', false);
        bot.setControlState('jump', false);
        break;
    }

    movementPhase = (movementPhase + 1) % 4;
  } catch (e) {
    console.error('Movement error:', e);
  }

  setTimeout(movementCycle, STEP_INTERVAL);
}

startBot();
