/**
 * 回复引擎岗位范围三态链（2026-09-02 拍板：岗位列表开关 = 打招呼+自动回复总开关，
 * 编辑页「为本岗位定制回复设置」勾选已废，replyPositionConfigs 退化为按岗位名的设置存储）。
 *
 * 规则：
 *  1. jobConfigs 非空 → whitelist = 启用的 jobConfigs（同名 rpc 条目仅借 autoReplyLimit 等设置）；
 *     全部关闭 → none（待机：不回任何岗位、不开任何会话，消掉旧"全关=全回"悖论）。
 *  2. jobConfigs 空 & replyPositionConfigs 有启用 → whitelist（1.5.0 前旧回复配置页遗留用户）。
 *  3. 两者皆空 → all（全岗位兜底，新装/从未配置用户行为不变）。
 *
 * ⚠️ content-script/index.js 是经典脚本无法 import，We()/start() 内有同规则内联副本；
 *    sidepanel 两处显示逻辑也是内联副本。改这里必须同步那三处。
 *
 * @param {Array} jobConfigs 岗位列表（job-list 页开关写这里）
 * @param {Array} replyPositionConfigs 按岗位名的回复设置（enabled 字段仅服务遗留回退）
 * @returns {{mode: 'whitelist'|'none'|'all', entries: Array}}
 *   entries 元素：{ ...同名rpc设置(含autoReplyLimit等), name, enabled:true }
 */
export function resolveReplyScope(jobConfigs, replyPositionConfigs) {
  const jobs = Array.isArray(jobConfigs) ? jobConfigs : [];
  const rpc = Array.isArray(replyPositionConfigs) ? replyPositionConfigs : [];
  const norm = (s) =>
    String(s || "").normalize("NFKC").replace(/\s+/g, "").toLowerCase();

  if (jobs.length > 0) {
    const entries = jobs
      .filter((j) => j && j.enabled !== false && j.name)
      .map((j) => {
        const cfg = rpc.find((c) => norm(c && c.name) === norm(j.name)) || {};
        return { ...cfg, name: j.name, enabled: true };
      });
    return { mode: entries.length > 0 ? "whitelist" : "none", entries };
  }

  const legacy = rpc.filter((c) => c && c.enabled !== false);
  return legacy.length > 0
    ? { mode: "whitelist", entries: legacy }
    : { mode: "all", entries: [] };
}
