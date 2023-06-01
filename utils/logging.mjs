import { getTime } from "./functions.mjs";

const reset = '\x1b[0m',
      bright = '\x1b[1m',
      yellow = '\x1b[33m',
      red = '\x1b[31m',
      green = '\x1b[32m',
      cyan = '\x1b[36m';

let lastMessage = '';
let isDuplicating = false;

function clog(text) {
  if (text === lastMessage) {
    process.stdout.write('+');
    isDuplicating = true;
  } else {
    if (isDuplicating) process.stdout.write('\n');
    process.stdout.write(`${text}\n`);
    lastMessage = text;
    isDuplicating = false;
  }
}

function info(text) {
  clog(`[${getTime()}] INFO | ${text}`);
}

function warn(text) {
  clog(`${bright}${yellow}[${getTime()}] WARNING | ${text}${reset}`);
}

function error(text) {
  clog(`${bright}${red}[${getTime()}] ERROR | ${text}${reset}`);
}

function notice(text) {
  clog(`${bright}${green}[${getTime()}] NOTICE | ${text}${reset}`);
}

export const log = {
  info, warn, error, notice
};

export const color = {
  reset, bright, yellow, red, green, cyan
};