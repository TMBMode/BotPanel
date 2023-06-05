import { spawn } from 'child_process';
import express from 'express';
import si from 'systeminformation';
import readline from 'readline';
import { log, color } from './utils/logging.mjs';
import { tribool, generateUid, strSize, dateToString } from './utils/functions.mjs';
import db from './db/index.mjs';

const BOTPATH = process.env.BOTPATH || '/home/ubuntu/chatgpt-on-wechat';
const PORT = process.env.PORT || 14514;
const OUTPUT_LIMIT = process.env.OUTPUT_LIMIT || 4096;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: ''
});

const input = (q) =>
  new Promise((resolve, reject) => {
    rl.question(q, (a) => {
      resolve(a);
    });
  }
);
const ask = async (q, p = '', d = undefined) => {
  let a = undefined;
  while (a === undefined) {
    a = (await input(
      `${color.bright}${color.cyan}${q}${color.reset}${(p||d)?' ':''}` +
      `${color.cyan}${p}${d?`(${d})`:''}: ${color.reset}`
    )) || d;
  }
  return a;
};

const app = express();
const PROCPOOL = [];

const addProc = async (params) => {
  const procId = params.key ?? generateUid();
  if (PROCPOOL[procId]) {
    log.warn(`Spawn request with key ${params.key}, but proc already exists`);
    return procId;
  }
  const proc = spawn('python3', ['app.py'], {
    cwd: BOTPATH,
    stdio: 'pipe',
    env: {
      CONFIG_PATH: (params?.info?.configPath || params?.info?.config_path) ?? 'config-template.json'
    }
  });
  const output = {
    text: '',
    length: 0
  };
  proc.stdout.on('data', (chunk) => {
    if (Date.now() > params.info.expires) {
      proc.kill('SIGINT');
      log.notice(`Killed expired process ${procId}`);
      return PROCPOOL[procId] = null;
    }
    output.length += chunk.length;
    output.text = `(${output.length}) ` +
      (output.text.replace(/^\([0-9]+\) /, '') + chunk).slice(-OUTPUT_LIMIT);
  });
  PROCPOOL[procId] = {
    proc, output, info: params.info
  };
  log.notice(`Spawned proc ${procId} | Key: ${params.key} | Owner: ${params.info.owner}`);
  return procId;
};

app.use('/', express.static('frontend', {
  index: 'webui.html'
}));

app.get('/spawn/:key', async (req, res) => {
  const key = req.params.key;
  const ip = req.ip || 'N/A';
  const dbRes = await db.getByKey(key);
  if (dbRes === db.STAT.key_nonexistent) {
    log.warn(`User entered invalid key ${key} (ip: ${ip})`);
    return res.status(401).send('无效密钥');
  } else if (Date.now() > dbRes.expires) {
    log.warn(`User tries to use expired key ${key} (ip: ${ip})`);
    return res.status(404).send('授权已到期');
  }
  let procId = await addProc({
    key,
    info: dbRes
  });
  log.notice(`Spawn request finished with procId ${procId} (ip: ${ip})`);
  res.status(201).send(`${procId}`);
});

app.get('/kill/:id', async (req, res) => {
  const procId = req.params.id;
  const ip = req.ip || 'N/A';
  if (!PROCPOOL[procId]) {
    log.error(`Can't locate proc ${procId} to kill (ip: ${ip})`);
    return res.status(404).send('找不到进程');
  }
  PROCPOOL[procId].proc.kill('SIGINT');
  PROCPOOL[procId] = null;
  log.notice(`Killed proc ${procId} (ip: ${ip})`);
  res.status(200).send('成功结束');
});

app.get('/stream/:id', (req, res) => {
  const procId = req.params.id;
  const ip = req.ip || 'N/A';
  if (!PROCPOOL[procId]) {
    log.warn(`Can't locate proc ${procId} (ip: ${ip})`);
    return res.status(404).send('找不到进程');
  }
  res.status(200).send(PROCPOOL[procId].output.text);
});

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});

const inputAddKey = async () => {
  const isFixedKey = await ask('Specify Key?', '[Y/N]', 'N');
  let key;
  if (tribool(isFixedKey) === 1) {
    key = await ask('Key');
  } else key = generateUid();
  const owner = await ask('Owner Name', '', 'N/A');
  let expires = NaN;
  while (isNaN(expires)) {
    expires = Date.parse(await ask('Expire Date', '[YYYY-MM-DD]'));
  }
  const configPath = await ask('Config File Path', '[configs/something.json]');
  const res = await db.addKey({
    key,
    owner,
    expires,
    configPath
  });
  if (res === db.STAT.okay) {
    console.log(`${color.green}Successfully added key ${color.bright}${key}${color.reset}`);
  }
  return;
}

rl.on('line', async (line) => {
  if (line.match(/^\//)) {
    try {
      return console.log(eval(line.replace(/^\//, '')));
    } catch (e) {
      return console.error(e);
    }
  }
  const cmd = line.trim().split(' ');
  switch (cmd[0]) {
    case '':
      break;
    case 'exit':
      process.exit();
    case 'stop':
      process.exit();
    case 'mem':
      let mem = await si.mem();
      console.log(`${strSize(mem.used)}/${strSize(mem.total)}`);
      break;
    case 'list':
      console.log('Use `lsdb` or `lsproc` instead');
      break;
    case 'lsdb':
      console.table(
        (await db.listKeys()
          .catch(e => console.error(e))).map((obj) => {
            const expires = dateToString(obj.expires);
            return {...obj, expires};
          })
      );
      break;
    case 'lsproc':
      let procs = [];
      for (let procId in PROCPOOL) {
        if (!PROCPOOL[procId]) continue;
        procs.push({
          procId,
          owner: PROCPOOL[procId].info.owner,
          expires: dateToString(PROCPOOL[procId].info.expires),
          configPath: PROCPOOL[procId].info.config_path
        });
      }
      console.table(procs);
      break;
    case 'add':
      await inputAddKey();
      break;
    case 'new':
      await inputAddKey();
      break;
    case 'del':
      if (cmd[1] && await db.deleteWithKey(cmd[1]) === db.STAT.okay) {
        console.log(`Deleted key ${cmd[1]}`);
      }
      break;
    case 'kill':
      if (cmd[1] && cmd[1] in PROCPOOL) {
        PROCPOOL[cmd[1]].proc.kill('SIGINT');
        PROCPOOL[cmd[1]] = null;
        console.log(`Killed process ${cmd[1]}`);
      }
      break;
    default:
      console.log('Unknown command');
      break;
  }
  return;
});