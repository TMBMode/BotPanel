console.log('Built on zhayujie/chatgpt-on-wechat (MIT License)');

const $ = document.querySelector.bind(document);
const startTime = Date.now();

const dom = {
  output: $('#output'),
  dialog: $('#dialog'),
  dialogText: $('#dialog > .text'),
  dialogInput: $('#dialog > .input'),
  button: $('#button')
};

const setCookie = (name, value) => {
  document.cookie = `${name}=${value}; max-age=31536000`;
}

const getCookie = (name) => {
  let cookies = document.cookie.split(";");
  for (let i = 0; i < cookies.length; i++) {
    let cookie = cookies[i].trim();
    if (cookie.indexOf(name) === 0) {
      return cookie.substring(name.length+1, cookie.length);
    }
  } return null;
}

const showDialog = (text, callback) =>
  new Promise(resolve => {
    dom.dialogText.textContent = text;
    dom.dialogInput.style.display = 'none';
    dom.dialog.style.animationName = 'dialogIn';
    let callfront = dom.output.onclick;
    dom.output.onclick = () => {
      dom.dialog.style.animationName = 'dialogOut';
      dom.output.onclick = callfront;
      resolve('backdrop');
    }
    dom.dialog.onclick = typeof(callback) === 'function' ? 
      () => { callback(); resolve('dialog') } : null;
  });

const showInput = (prompt) =>
  new Promise(resolve => {
    dom.dialogText.textContent = prompt;
    dom.dialogInput.value = '';
    dom.dialogInput.style.display = 'inline-block';
    dom.dialog.style.animationName = 'dialogIn';
    let callfront = dom.output.onclick;
    dom.output.onclick = () => {
      if (dom.dialogInput.value === '') return;
      dom.dialog.style.animationName = 'dialogOut';
      dom.output.onclick = callfront;
      resolve(dom.dialogInput.value);
    }
  });

dom.dialogInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    dom.output.click();
  }
})

let lastScroll = Date.now();
dom.output.onscroll = () => {
  lastScroll = Date.now();
};
const scrollOutput = () => {
  if (Date.now() - startTime < 15000 || Date.now() - lastScroll > 5000) {
    dom.output.scrollTop = dom.output.scrollHeight;
  }
}

let doStream = true;
let lastOutputLen = 0;
let fetchFailCnt = 0;
const getStream = async (id) => {
  if (!doStream) return;
  if (fetchFailCnt >= 3) {
    doStream = false;
    await showDialog('进程不存在');
  }
  const res = await fetch(`/stream/${id}`, {
    method: 'GET'
  }).catch(() => {
    fetchFailCnt++;
  });
  if (!res) return setTimeout(() => getStream(id), 2000);
  const text = await res.text();
  if (res.status !== 200) {
    if (res.status === 410) {
      doStream = false;
      showDialog('授权已到期');
    }
    fetchFailCnt++;
  } else fetchFailCnt = 0;
  dom.output.textContent = text;
  if (text.length > lastOutputLen) {
    lastOutputLen = text.length;
    scrollOutput();
    setTimeout(() => getStream(id), 1000);
  } else {
    setTimeout(() => getStream(id), 3000);
  }
}

let procId;
dom.button.onclick = async () => {
  await showDialog('点击停止', async () => {
    doStream = false;
    const res = await fetch(`/kill/${procId}`, {
      method: "GET"
    });
    setCookie('procId', '');
    await showDialog(await res.text());
    dom.button.style.opacity = '0';
    dom.button.style.pointerEvents = 'none';
  });
}

const promptSpawn = async () => {
  const key = await showInput('🔑');
  const res = await fetch(`/spawn/${key}`, {
    method: 'GET'
  }).catch(() => {
    showDialog('网络错误');
  });
  if (res?.status !== 201) {
    await showDialog(await res.text());
    return null;
  }
  return await res?.text();
}

(async () => {
  procId = getCookie('procId');
  if (!procId || (await fetch(`/stream/${procId}`, {
    method: 'GET'
  }).catch(() => {
    showDialog('网络错误');
  })).status !== 200) {
    procId = await promptSpawn();
    if (!procId) return;
    setCookie('procId', procId);
  }
  dom.output.style.opacity = '1';
  dom.button.style.opacity = '1';
  dom.button.style.pointerEvents = 'auto';
  await getStream(procId);
})();

