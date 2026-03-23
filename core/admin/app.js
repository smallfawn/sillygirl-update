const state = {
  user: null,
  active: "dashboard",
  cache: {},
};

const navItems = [
  { key: "dashboard", label: "概览" },
  { key: "storage", label: "存储" },
  { key: "reply", label: "回复" },
  { key: "tasks", label: "任务" },
  { key: "carry", label: "搬运" },
  { key: "plugins", label: "插件" },
  { key: "masters", label: "管理员" },
  { key: "tools", label: "调试工具" },
];

function escapeHtml(input) {
  return String(input ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function jsonTryParse(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

async function api(path, options = {}) {
  const res = await fetch(path, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = {};
  }

  if (res.status === 401 || data?.errorCode === "401") {
    const err = new Error(data?.errorMessage || "未登录");
    err.__auth = true;
    throw err;
  }

  return data;
}

function appRoot() {
  return document.getElementById("app");
}

function setActive(key) {
  state.active = key;
  renderApp();
  loadSection();
}

function showMessage(msg, type = "ok") {
  const el = document.getElementById("global-msg");
  if (!el) return;
  el.className = `status ${type === "ok" ? "ok" : "err"}`;
  el.textContent = msg;
  setTimeout(() => {
    const node = document.getElementById("global-msg");
    if (node) node.textContent = "";
  }, 2600);
}

async function boot() {
  try {
    const res = await api("/api/currentUser");
    if (res?.success) {
      state.user = res.data;
      renderApp();
      loadSection();
      return;
    }
  } catch {
    // ignore
  }
  renderLogin();
}

function renderLogin() {
  appRoot().innerHTML = `
    <div class="login-wrap">
      <div class="login-card">
        <h2>登录 SillyGirl Admin</h2>
        <p class="muted">重写版前端（兼容现有 /api 接口）</p>
        <div class="row" style="margin-bottom:10px;">
          <input id="login-user" placeholder="用户名" style="width:100%;" />
        </div>
        <div class="row" style="margin-bottom:10px;">
          <input id="login-pass" type="password" placeholder="密码" style="width:100%;" />
        </div>
        <div class="row">
          <button id="login-btn" class="primary" style="width:100%;">登录</button>
        </div>
        <p class="notice" id="login-msg" style="margin-top:12px;"></p>
      </div>
    </div>
  `;

  document.getElementById("login-btn").addEventListener("click", async () => {
    const username = document.getElementById("login-user").value.trim();
    const password = document.getElementById("login-pass").value;
    const tip = document.getElementById("login-msg");
    tip.textContent = "登录中...";

    try {
      const res = await api("/api/login/account", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      if (res?.status === "ok") {
        const u = await api("/api/currentUser");
        state.user = u.data;
        renderApp();
        loadSection();
        return;
      }
      tip.textContent = "登录失败，请检查账号密码。";
    } catch (e) {
      tip.textContent = `登录异常：${e.message}`;
    }
  });
}

function renderApp() {
  const navHtml = navItems
    .map((item) => `<button class="${state.active === item.key ? "active" : ""}" data-nav="${item.key}">${item.label}</button>`)
    .join("");

  appRoot().innerHTML = `
    <div class="app">
      <aside class="sidebar">
        <div class="brand">SillyGirl Admin</div>
        <div class="muted" style="font-size:13px;margin-bottom:16px;">
          ${escapeHtml(state.user?.name || "管理员")}
        </div>
        <nav class="nav">${navHtml}</nav>
        <div style="margin-top:18px;" class="row">
          <button id="logout-btn" class="warn" style="width:100%;">退出登录</button>
        </div>
      </aside>
      <main class="main">
        <div class="panel">
          <div class="row" style="justify-content:space-between;">
            <h2 id="section-title">${getTitle(state.active)}</h2>
            <span id="global-msg" class="status ok"></span>
          </div>
          <p class="muted" id="section-desc">${getDesc(state.active)}</p>
        </div>
        <div id="section-root"></div>
      </main>
    </div>
  `;

  document.querySelectorAll("[data-nav]").forEach((btn) => {
    btn.addEventListener("click", () => setActive(btn.getAttribute("data-nav")));
  });

  document.getElementById("logout-btn").addEventListener("click", async () => {
    try {
      await api("/api/login/outLogin", { method: "POST", body: "{}" });
    } catch {
      // ignore
    }
    state.user = null;
    renderLogin();
  });
}

function getTitle(key) {
  const map = {
    dashboard: "概览",
    storage: "存储管理",
    reply: "回复管理",
    tasks: "任务管理",
    carry: "搬运分组",
    plugins: "插件市场",
    masters: "管理员",
    tools: "调试工具",
  };
  return map[key] || "模块";
}

function getDesc(key) {
  const map = {
    dashboard: "查看系统状态与快捷入口。",
    storage: "查询与修改 Bucket 键值。",
    reply: "配置关键词回复。",
    tasks: "配置计划任务并手动触发。",
    carry: "管理采集/转发分组规则。",
    plugins: "查看订阅插件并执行安装。",
    masters: "维护管理员账号。",
    tools: "快速调用 API 调试。",
  };
  return map[key] || "";
}

async function loadSection() {
  const root = document.getElementById("section-root");
  if (!root) return;
  root.innerHTML = `<div class="panel muted">加载中...</div>`;

  try {
    if (state.active === "dashboard") return renderDashboard();
    if (state.active === "storage") return renderStorage();
    if (state.active === "reply") return renderReply();
    if (state.active === "tasks") return renderTasks();
    if (state.active === "carry") return renderCarry();
    if (state.active === "plugins") return renderPlugins();
    if (state.active === "masters") return renderMasters();
    if (state.active === "tools") return renderTools();
  } catch (e) {
    if (e.__auth) {
      state.user = null;
      renderLogin();
      return;
    }
    root.innerHTML = `<div class="panel"><span class="status err">加载失败：${escapeHtml(e.message)}</span></div>`;
  }
}

async function renderDashboard() {
  const root = document.getElementById("section-root");
  const checks = [];
  const endpoints = [
    "/api/currentUser",
    "/api/storage?keys=",
    "/api/reply/list?current=1&pageSize=1",
    "/api/tasks?current=1&pageSize=1",
    "/api/carry/groups?current=1&pageSize=1",
  ];

  for (const ep of endpoints) {
    try {
      const r = await api(ep);
      checks.push({ ep, ok: !!r.success });
    } catch {
      checks.push({ ep, ok: false });
    }
  }

  root.innerHTML = `
    <div class="panel">
      <h3>欢迎，${escapeHtml(state.user?.name || "管理员")}</h3>
      <p class="muted">当前可见插件数量：${(state.user?.plugins || []).length}</p>
      <div class="row" style="margin-top:8px;">
        <button class="primary" id="go-storage">去存储管理</button>
        <button class="primary" id="go-plugin">去插件市场</button>
      </div>
    </div>
    <div class="panel">
      <h3>接口健康检查</h3>
      <table>
        <thead><tr><th>接口</th><th>状态</th></tr></thead>
        <tbody>
          ${checks
            .map(
              (x) => `<tr><td class="code">${escapeHtml(x.ep)}</td><td><span class="status ${x.ok ? "ok" : "err"}">${x.ok ? "OK" : "FAIL"}</span></td></tr>`
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;

  document.getElementById("go-storage").addEventListener("click", () => setActive("storage"));
  document.getElementById("go-plugin").addEventListener("click", () => setActive("plugins"));
}

async function renderStorage() {
  const root = document.getElementById("section-root");
  const list = await api("/api/storage/list?current=1&pageSize=50&keys=sillyGirl,plugins");

  root.innerHTML = `
    <div class="panel">
      <h3>查询</h3>
      <div class="row">
        <input id="st-keys" placeholder="keys，如 sillyGirl,plugins.xxx" style="min-width:340px;" value="sillyGirl" />
        <button id="st-load" class="primary">查询</button>
      </div>
      <p class="muted">支持桶名或 bucket.key，多个用英文逗号分隔。</p>
    </div>

    <div class="panel">
      <h3>更新键值</h3>
      <div class="grid-2">
        <input id="st-key" placeholder="bucket.key，如 sillyGirl.name" />
        <input id="st-val" placeholder="value" />
      </div>
      <div class="row" style="margin-top:10px;">
        <button id="st-save" class="ok">保存</button>
      </div>
    </div>

    <div class="panel">
      <h3>结果</h3>
      <div id="st-table"></div>
    </div>
  `;

  function renderRows(data) {
    const rows = (data?.data || [])
      .map(
        (r) => `<tr>
          <td>${escapeHtml(r.bucket)}</td>
          <td>${escapeHtml(r.key)}</td>
          <td class="code">${escapeHtml(r.value)}</td>
        </tr>`
      )
      .join("");

    document.getElementById("st-table").innerHTML = `
      <table>
        <thead><tr><th>Bucket</th><th>Key</th><th>Value</th></tr></thead>
        <tbody>${rows || `<tr><td colspan="3" class="muted">暂无数据</td></tr>`}</tbody>
      </table>
    `;
  }

  renderRows(list);

  document.getElementById("st-load").addEventListener("click", async () => {
    const keys = document.getElementById("st-keys").value.trim();
    const data = await api(`/api/storage/list?current=1&pageSize=100&keys=${encodeURIComponent(keys)}`);
    renderRows(data);
    showMessage("查询成功");
  });

  document.getElementById("st-save").addEventListener("click", async () => {
    const key = document.getElementById("st-key").value.trim();
    const val = document.getElementById("st-val").value;
    if (!key.includes(".")) return showMessage("key 需为 bucket.key", "err");
    await api("/api/storage", {
      method: "PUT",
      body: JSON.stringify({ [key]: val }),
    });
    showMessage("保存成功");
  });
}

async function renderReply() {
  const root = document.getElementById("section-root");
  const list = await api("/api/reply/list?current=1&pageSize=50");

  root.innerHTML = `
    <div class="panel">
      <h3>新增 / 更新回复</h3>
      <div class="grid-2">
        <input id="rp-id" placeholder="ID（更新时填）" />
        <input id="rp-priority" placeholder="优先级（默认 0）" value="0" />
        <input id="rp-number" placeholder="号码（可选）" />
        <input id="rp-nickname" placeholder="昵称（可选）" />
      </div>
      <div class="row" style="margin-top:10px;">
        <input id="rp-keyword" placeholder="关键词" style="min-width:240px;" />
        <input id="rp-value" placeholder="回复内容" style="min-width:240px;" />
        <button id="rp-save" class="ok">保存</button>
      </div>
    </div>

    <div class="panel">
      <h3>回复列表</h3>
      <div id="rp-table"></div>
    </div>
  `;

  function draw(data) {
    const rows = (data?.data || [])
      .map(
        (r) => `<tr>
          <td>${r.id}</td>
          <td>${escapeHtml(r.keyword)}</td>
          <td class="code">${escapeHtml(r.value)}</td>
          <td>${r.priority}</td>
          <td><button data-rid="${r.id}" class="err">删除</button></td>
        </tr>`
      )
      .join("");

    document.getElementById("rp-table").innerHTML = `
      <table>
        <thead><tr><th>ID</th><th>关键词</th><th>回复</th><th>优先级</th><th>操作</th></tr></thead>
        <tbody>${rows || `<tr><td colspan="5" class="muted">暂无数据</td></tr>`}</tbody>
      </table>
    `;

    document.querySelectorAll("[data-rid]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-rid");
        await api(`/api/reply?id=${encodeURIComponent(id)}`, { method: "DELETE" });
        showMessage(`已删除 ID=${id}`);
        renderReply();
      });
    });
  }

  draw(list);

  document.getElementById("rp-save").addEventListener("click", async () => {
    const payload = {
      id: Number(document.getElementById("rp-id").value || 0),
      keyword: document.getElementById("rp-keyword").value,
      value: document.getElementById("rp-value").value,
      priority: Number(document.getElementById("rp-priority").value || 0),
      number: document.getElementById("rp-number").value,
      nickname: document.getElementById("rp-nickname").value,
      platforms: [],
    };
    await api("/api/reply", { method: "POST", body: JSON.stringify(payload) });
    showMessage("保存成功");
    renderReply();
  });
}

async function renderTasks() {
  const root = document.getElementById("section-root");
  const list = await api("/api/tasks?current=1&pageSize=50");

  root.innerHTML = `
    <div class="panel">
      <h3>新增 / 更新任务</h3>
      <div class="grid-2">
        <input id="tk-id" placeholder="task_id（必填）" />
        <input id="tk-title" placeholder="任务标题" />
        <input id="tk-schedule" placeholder="Cron（如 */10 * * * *）" />
        <input id="tk-enable" placeholder="enable（true/false）" value="true" />
      </div>
      <div class="row" style="margin-top:10px;">
        <input id="tk-command" placeholder="command" style="min-width:360px;" />
      </div>
      <div class="row" style="margin-top:10px;">
        <textarea id="tk-senders" placeholder='senders JSON，如 [{"platform":"qq","chat_id":"123"}]'></textarea>
      </div>
      <div class="row" style="margin-top:10px;">
        <textarea id="tk-scripts" placeholder='scripts JSON，如 ["uuid1","uuid2"]'></textarea>
      </div>
      <div class="row" style="margin-top:10px;">
        <button id="tk-save" class="ok">保存任务</button>
      </div>
    </div>

    <div class="panel">
      <h3>任务列表</h3>
      <div id="tk-table"></div>
    </div>
  `;

  function draw(data) {
    const rows = (data?.data || [])
      .map(
        (r) => `<tr>
          <td>${escapeHtml(r.task_id)}</td>
          <td>${escapeHtml(r.title)}</td>
          <td class="code">${escapeHtml(r.schedule)}</td>
          <td>${r.enable ? "是" : "否"}</td>
          <td>
            <div class="row">
              <button data-run="${escapeHtml(r.task_id)}" class="warn">执行</button>
              <button data-del="${escapeHtml(r.task_id)}" class="err">删除</button>
            </div>
          </td>
        </tr>`
      )
      .join("");

    document.getElementById("tk-table").innerHTML = `
      <table>
        <thead><tr><th>ID</th><th>标题</th><th>Cron</th><th>启用</th><th>操作</th></tr></thead>
        <tbody>${rows || `<tr><td colspan="5" class="muted">暂无数据</td></tr>`}</tbody>
      </table>
    `;

    document.querySelectorAll("[data-run]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-run");
        await api(`/api/tasks/run?task_id=${encodeURIComponent(id)}`);
        showMessage(`任务 ${id} 已触发`);
      });
    });

    document.querySelectorAll("[data-del]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-del");
        await api("/api/tasks", { method: "DELETE", body: JSON.stringify({ task_id: id }) });
        showMessage(`任务 ${id} 已删除`);
        renderTasks();
      });
    });
  }

  draw(list);

  document.getElementById("tk-save").addEventListener("click", async () => {
    const payload = {
      task_id: document.getElementById("tk-id").value.trim(),
      title: document.getElementById("tk-title").value,
      schedule: document.getElementById("tk-schedule").value,
      command: document.getElementById("tk-command").value,
      enable: String(document.getElementById("tk-enable").value).toLowerCase() === "true",
      senders: jsonTryParse(document.getElementById("tk-senders").value || "[]", []),
      scripts: jsonTryParse(document.getElementById("tk-scripts").value || "[]", []),
    };

    if (!payload.task_id) return showMessage("task_id 不能为空", "err");
    await api("/api/tasks", { method: "POST", body: JSON.stringify(payload) });
    showMessage("任务已保存");
    renderTasks();
  });
}

async function renderCarry() {
  const root = document.getElementById("section-root");
  const list = await api("/api/carry/groups?current=1&pageSize=50");

  root.innerHTML = `
    <div class="panel">
      <h3>新增 / 更新搬运分组</h3>
      <div class="grid-2">
        <input id="cg-id" placeholder="chat_id（必填）" />
        <input id="cg-platform" placeholder="platform（如 qq）" />
        <input id="cg-in" placeholder="in（true/false）" value="true" />
        <input id="cg-out" placeholder="out（true/false）" value="false" />
        <input id="cg-enable" placeholder="enable（true/false）" value="true" />
        <input id="cg-remark" placeholder="remark" />
      </div>
      <div class="row" style="margin-top:10px;">
        <input id="cg-from" placeholder="from，逗号分隔" style="min-width:280px;" />
        <input id="cg-include" placeholder="include，逗号分隔" style="min-width:280px;" />
      </div>
      <div class="row" style="margin-top:10px;">
        <button id="cg-save" class="ok">保存分组</button>
      </div>
    </div>

    <div class="panel">
      <h3>分组列表</h3>
      <div id="cg-table"></div>
    </div>
  `;

  function draw(data) {
    const rows = (data?.data || [])
      .map(
        (r) => `<tr>
          <td>${escapeHtml(r.chat_id)}</td>
          <td>${escapeHtml(r.platform)}</td>
          <td>${r.in ? "是" : "否"}</td>
          <td>${r.out ? "是" : "否"}</td>
          <td>${r.enable ? "是" : "否"}</td>
          <td>${escapeHtml(r.remark || "")}</td>
          <td><button data-cgdel="${escapeHtml(r.chat_id)}" class="err">删除</button></td>
        </tr>`
      )
      .join("");

    document.getElementById("cg-table").innerHTML = `
      <table>
        <thead><tr><th>群号</th><th>平台</th><th>采集</th><th>转发</th><th>启用</th><th>备注</th><th>操作</th></tr></thead>
        <tbody>${rows || `<tr><td colspan="7" class="muted">暂无数据</td></tr>`}</tbody>
      </table>
    `;

    document.querySelectorAll("[data-cgdel]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-cgdel");
        await api("/api/carry/group", { method: "DELETE", body: JSON.stringify({ chat_id: id }) });
        showMessage(`分组 ${id} 已删除`);
        renderCarry();
      });
    });
  }

  draw(list);

  document.getElementById("cg-save").addEventListener("click", async () => {
    const payload = {
      chat_id: document.getElementById("cg-id").value.trim(),
      platform: document.getElementById("cg-platform").value.trim(),
      in: String(document.getElementById("cg-in").value).toLowerCase() === "true",
      out: String(document.getElementById("cg-out").value).toLowerCase() === "true",
      enable: String(document.getElementById("cg-enable").value).toLowerCase() === "true",
      remark: document.getElementById("cg-remark").value,
      from: (document.getElementById("cg-from").value || "").split(",").map((x) => x.trim()).filter(Boolean),
      include: (document.getElementById("cg-include").value || "").split(",").map((x) => x.trim()).filter(Boolean),
    };

    if (!payload.chat_id) return showMessage("chat_id 不能为空", "err");
    await api("/api/carry/group", { method: "POST", body: JSON.stringify(payload) });
    showMessage("分组已保存");
    renderCarry();
  });
}

async function renderPlugins() {
  const root = document.getElementById("section-root");
  const q = "current=1&pageSize=20&activeKey=tab2&init=true&class=全部";
  const list = await api(`/api/plugins/list.json?${q}`);

  root.innerHTML = `
    <div class="panel">
      <h3>插件市场（可安装）</h3>
      <p class="muted">当前显示未安装插件 tab2，可按需安装。</p>
      <div id="pl-table"></div>
    </div>
  `;

  const rows = (list?.data || [])
    .map(
      (r) => `<tr>
        <td>${escapeHtml(r.uuid)}</td>
        <td>${escapeHtml(r.title || "-")}</td>
        <td>${escapeHtml(r.organization || "-")}</td>
        <td>${escapeHtml(r.version || "-")}</td>
        <td><button data-plinstall="${escapeHtml(r.uuid)}" class="ok">安装</button></td>
      </tr>`
    )
    .join("");

  document.getElementById("pl-table").innerHTML = `
    <table>
      <thead><tr><th>UUID</th><th>标题</th><th>来源</th><th>版本</th><th>操作</th></tr></thead>
      <tbody>${rows || `<tr><td colspan="5" class="muted">暂无可安装插件</td></tr>`}</tbody>
    </table>
  `;

  document.querySelectorAll("[data-plinstall]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const uuid = btn.getAttribute("data-plinstall");
      await api("/api/storage", {
        method: "PUT",
        body: JSON.stringify({ [`plugins.${uuid}`]: "install" }),
      });
      showMessage(`已触发插件安装：${uuid}`);
    });
  });
}

async function renderMasters() {
  const root = document.getElementById("section-root");
  const list = await api("/api/master/list");

  root.innerHTML = `
    <div class="panel">
      <h3>添加管理员</h3>
      <div class="row">
        <input id="ms-id" placeholder="号码" />
        <input id="ms-plt" placeholder="平台（如 qq）" />
        <button id="ms-add" class="ok">添加</button>
      </div>
    </div>

    <div class="panel">
      <h3>管理员列表</h3>
      <div id="ms-table"></div>
    </div>
  `;

  const rows = (list?.data || [])
    .map(
      (m) => `<tr>
        <td>${escapeHtml(m.number)}</td>
        <td>${escapeHtml(m.platform)}</td>
        <td>${escapeHtml(m.nickname || "-")}</td>
        <td><button data-msdel="${escapeHtml(m.number)}" data-plt="${escapeHtml(m.platform)}" class="err">删除</button></td>
      </tr>`
    )
    .join("");

  document.getElementById("ms-table").innerHTML = `
    <table>
      <thead><tr><th>号码</th><th>平台</th><th>昵称</th><th>操作</th></tr></thead>
      <tbody>${rows || `<tr><td colspan="4" class="muted">暂无数据</td></tr>`}</tbody>
    </table>
  `;

  document.getElementById("ms-add").addEventListener("click", async () => {
    const id = document.getElementById("ms-id").value.trim();
    const platform = document.getElementById("ms-plt").value.trim();
    if (!id) return showMessage("号码不能为空", "err");
    await api("/api/master", { method: "POST", body: JSON.stringify({ number: id, platform }) });
    showMessage("添加成功");
    renderMasters();
  });

  document.querySelectorAll("[data-msdel]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-msdel");
      const platform = btn.getAttribute("data-plt");
      await api("/api/master", { method: "DELETE", body: JSON.stringify({ number: id, platform }) });
      showMessage("删除成功");
      renderMasters();
    });
  });
}

async function renderTools() {
  const root = document.getElementById("section-root");
  root.innerHTML = `
    <div class="panel">
      <h3>API 调试器</h3>
      <div class="row" style="margin-bottom:8px;">
        <select id="tool-method">
          <option>GET</option>
          <option>POST</option>
          <option>PUT</option>
          <option>DELETE</option>
        </select>
        <input id="tool-url" style="min-width:420px;" value="/api/currentUser" />
        <button id="tool-send" class="primary">发送</button>
      </div>
      <textarea id="tool-body" placeholder='请求体 JSON（GET 可留空）'></textarea>
      <h3 style="margin-top:14px;">响应</h3>
      <pre class="code" id="tool-res">{}</pre>
    </div>
  `;

  document.getElementById("tool-send").addEventListener("click", async () => {
    const method = document.getElementById("tool-method").value;
    const url = document.getElementById("tool-url").value.trim();
    const body = document.getElementById("tool-body").value.trim();

    try {
      const res = await api(url, {
        method,
        body: method === "GET" ? undefined : body || "{}",
      });
      document.getElementById("tool-res").textContent = JSON.stringify(res, null, 2);
      showMessage("请求成功");
    } catch (e) {
      document.getElementById("tool-res").textContent = JSON.stringify({ error: e.message }, null, 2);
      showMessage("请求失败", "err");
    }
  });
}

boot();
