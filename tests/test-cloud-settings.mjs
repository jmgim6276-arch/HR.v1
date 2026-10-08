import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync(
  new URL("../extension/service-worker/sw.js", import.meta.url),
  "utf8",
);
const start = source.indexOf("async function cloudSettingsGetRequest");
const end = source.indexOf('console.log(\n  "[SW] =====', start);
assert.ok(start > 0 && end > start, "找不到云同步代码区段");
const section = source.slice(start, end);

const data = {};
const changeListeners = [];
const cloud = new Map();
let beforePutReturn = null;
const profiles = {
  tokenA: { id: "userA", email: "a@example.com" },
  tokenB: { id: "userB", email: "b@example.com" },
  tokenC: { id: "userC", email: "c@example.com" },
};

function pick(keys) {
  if (keys == null) return structuredClone(data);
  const list = Array.isArray(keys) ? keys : [keys];
  return Object.fromEntries(
    list
      .filter((key) => Object.prototype.hasOwnProperty.call(data, key))
      .map((key) => [key, structuredClone(data[key])]),
  );
}

async function emitChanges(changes) {
  for (const listener of changeListeners) listener(changes, "local");
  await new Promise((resolve) => setImmediate(resolve));
}

const chrome = {
  storage: {
    local: {
      async get(keys) {
        return pick(keys);
      },
      async set(values) {
        const changes = {};
        for (const [key, value] of Object.entries(values)) {
          changes[key] = {
            oldValue: structuredClone(data[key]),
            newValue: structuredClone(value),
          };
          data[key] = structuredClone(value);
        }
        await emitChanges(changes);
      },
      async remove(keys) {
        const changes = {};
        for (const key of Array.isArray(keys) ? keys : [keys]) {
          if (!Object.prototype.hasOwnProperty.call(data, key)) continue;
          changes[key] = { oldValue: structuredClone(data[key]) };
          delete data[key];
        }
        await emitChanges(changes);
      },
    },
    onChanged: {
      addListener(listener) {
        changeListeners.push(listener);
      },
    },
  },
  alarms: {
    create: async () => {},
    onAlarm: {
      addListener: () => {},
    },
  },
};

async function api(path, { method = "GET", body, accessToken } = {}) {
  const user = profiles[accessToken];
  assert.ok(user, `无效测试 token: ${accessToken}`);
  if (path === "/users/me") return structuredClone(user);
  if (path !== "/users/me/settings") throw new Error(`未知路径 ${path}`);
  const record = cloud.get(user.id);
  if (method === "GET") {
    return record
      ? { exists: true, ...structuredClone(record) }
      : { exists: false, settings: {}, revision: 0, updated_at: null };
  }
  const revision = record?.revision || 0;
  if (body.base_revision !== revision) {
    const error = new Error("revision conflict");
    error.code = "SETTINGS_REVISION_CONFLICT";
    throw error;
  }
  const next = {
    settings: structuredClone(body.settings),
    revision: revision + 1,
    updated_at: new Date().toISOString(),
  };
  cloud.set(user.id, next);
  if (beforePutReturn) await beforePutReturn();
  return { exists: true, ...structuredClone(next) };
}

const context = vm.createContext({
  chrome,
  structuredClone,
  console,
  JSON,
  Date,
  Object,
  Number,
  Boolean,
  Promise,
  setImmediate,
  setTimeout: () => 1,
  clearTimeout: () => {},
  R: { PROFILE_AUTH: "profileAuth" },
  $t: api,
  As: (token) => api("/users/me", { accessToken: token }),
  hasCurrentPrivacyConsent: async () => true,
  y: () => {},
});
context.rn = async (fn, ...args) => {
  const auth = data.profileAuth || {};
  if (!auth.accessToken) throw new Error("未登录");
  return fn(auth.accessToken, ...args);
};

vm.runInContext(
  `${section}
globalThis.__cloudSettingsTest = {
  syncCloudSettingsForLogin,
  markCloudSettingsDirty,
  pushCloudSettingsNow,
  readCloudSettingsSnapshot
};`,
  context,
);
const sync = context.__cloudSettingsTest;

// 旧版本首次升级：本地设置自动归入当前账号，历史凭证字段不上传。
Object.assign(data, {
  profileAuth: { accessToken: "tokenA" },
  jobConfigs: [{ id: "jobA", name: "会计" }],
  modelConfig: {
    apiUrl: "https://api.example.com",
    apiKey: "device-key-A",
    model: "model-A",
  },
  talentPool: [{ name: "不得同步的人才" }],
});
await sync.syncCloudSettingsForLogin("tokenA", profiles.tokenA);
assert.equal(cloud.get("userA").revision, 1);
assert.equal(cloud.get("userA").settings.jobConfigs[0].id, "jobA");
assert.equal(cloud.get("userA").settings.modelConfig.apiKey, undefined);
assert.equal(cloud.get("userA").settings.talentPool, undefined);
assert.equal(data.modelConfig.apiKey, "device-key-A");

// 同一浏览器切换账号：云端配置切换，不能复制上一账号配置或历史凭证。
cloud.set("userB", {
  settings: {
    jobConfigs: [{ id: "jobB", name: "审计" }],
    modelConfig: { apiUrl: "https://api.b.example", model: "model-B" },
  },
  revision: 3,
  updated_at: new Date().toISOString(),
});
data.profileAuth = { accessToken: "tokenB" };
await sync.syncCloudSettingsForLogin("tokenB", profiles.tokenB);
assert.equal(data.jobConfigs[0].id, "jobB");
assert.equal(data.modelConfig.apiKey, "");

// 切回账号 A：恢复账号 A 的云端配置和当前设备为 A 保存的历史凭证。
data.profileAuth = { accessToken: "tokenA" };
await sync.syncCloudSettingsForLogin("tokenA", profiles.tokenA);
assert.equal(data.jobConfigs[0].id, "jobA");
assert.equal(data.modelConfig.apiKey, "device-key-A");

// 本地编辑后按 revision 上传。
data.jobConfigs = [{ id: "jobA2", name: "财务经理" }];
await sync.markCloudSettingsDirty({ jobConfigs: { newValue: data.jobConfigs } });
await sync.pushCloudSettingsNow();
assert.equal(cloud.get("userA").revision, 2);
assert.equal(cloud.get("userA").settings.jobConfigs[0].id, "jobA2");

// 上传期间继续编辑，不能被刚完成的旧快照回写覆盖。
data.jobConfigs = [{ id: "jobA3", name: "审计经理" }];
await sync.markCloudSettingsDirty({ jobConfigs: { newValue: data.jobConfigs } });
beforePutReturn = async () => {
  beforePutReturn = null;
  data.jobConfigs = [{ id: "jobA4", name: "财务总监" }];
  await sync.markCloudSettingsDirty({
    jobConfigs: { newValue: data.jobConfigs },
  });
};
await sync.pushCloudSettingsNow();
assert.equal(data.jobConfigs[0].id, "jobA4");
assert.equal(data.cloudSettingsMeta.dirty, true);
await sync.pushCloudSettingsNow();
assert.equal(cloud.get("userA").settings.jobConfigs[0].id, "jobA4");

// 新账号云端为空时不能继承当前账号 A 的配置。
data.profileAuth = { accessToken: "tokenC" };
await sync.syncCloudSettingsForLogin("tokenC", profiles.tokenC);
assert.deepEqual(cloud.get("userC").settings, {});
assert.equal(data.jobConfigs, undefined);

console.log("✅ 云同步首次迁移、账号隔离、历史凭证不上传与 revision 上传全部通过");
