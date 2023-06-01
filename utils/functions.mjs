export function randint(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function tribool(text) {
  if (text.toLowerCase().includes('n')) return 0;
  if (text.toLowerCase().includes('y')) return 1;
  return -1;
}

const uidChars = '0123456789ACEFGHJKLMNPQRTVWXYZ';
export function generateUid(len=6) {
  let res = '';
  for (let i = 0; i < len; i++) {
    res += uidChars[randint(0, uidChars.length-1)];
  }
  return res;
}

const units = ['B', 'KB', 'MB', 'GB', 'TB'];
export function strSize(size) {
  let level = 0;
  while (size > 1024) {
    size /= 1024;
    level++;
  }
  return `${size.toFixed(2)}${units[level]}`;
}

export function getTime() {
  let date = new Date();
  let year = date.getFullYear() % 100,
      month = String(date.getMonth() + 1).padStart(2, '0'),
      day = String(date.getDate()).padStart(2, '0'),
      hours = String(date.getHours()).padStart(2, '0'),
      minutes = String(date.getMinutes()).padStart(2, '0'),
      seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day}/${hours}:${minutes}:${seconds}`;
}

export function dateToString(stamp) {
  let date = new Date(stamp);
  let year = date.getFullYear(),
      month = String(date.getMonth() + 1).padStart(2, '0'),
      day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}