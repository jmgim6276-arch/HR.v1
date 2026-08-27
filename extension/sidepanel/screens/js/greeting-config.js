/**
 * 打招呼匹配规则配置页面脚本
 * 管理岗位的筛选条件、匹配规则和打招呼话术
 */
(function() {
  'use strict';

  const GREETING_CONFIGS_KEY = 'greetingConfigs';
  const JOBS_KEY = 'jobConfigs';
  const REPLY_POSITION_CONFIGS_KEY = 'replyPositionConfigs';   // 回复引擎白名单（UI 合一：本页双写，引擎不动）
  let currentJobId = null;      // 当前编辑的岗位ID，null 表示新建
  let ruleCount = 0;            // 匹配规则计数器
  let isSaving = false;         // 防止重复保存

  /** 支持多选的筛选条件字段列表（存储层字段 ID） */
  const MULTI_SELECT_FIELDS = ['院校', '学历要求', '经验要求', '求职意向'];

  /**
   * chip data-value → 中文显示文本映射
   * 用于将 chip 编码值转为 BOSS 页面上可匹配的中文文本
   */
  const VALUE_ID_TO_TEXT = {
    just_active: '刚刚活跃', today_active: '今日活跃', three_days: '3日内活跃',
    this_week: '本周活跃', this_month: '本月活跃',
    male: '男', female: '女',
    '985': '985', '211': '211', double_first: '双一流院校',
    overseas: '留学', famous: '国内外名校', public_bachelor: '公办本科',
    '14_days': '近14天没有',
    no_recent: '近一个月没有',
    stable: '5年少于3份', avg_year: '平均每份工作大于1年',
    middle: '初中及以下', technical: '中专/中技', high_school: '高中',
    college: '大专', bachelor: '本科', master: '硕士', doctor: '博士',
    campus: '在校/应届', grad_25: '25年毕业', grad_26: '26年毕业',
    grad_after_26: '26年后毕业', under_1yr: '1年以内',
    '1-3yr': '1-3年', '3-5yr': '3-5年', '5-10yr': '5-10年', '10yr_plus': '10年以上',
    resigned: '离职-随时到岗', employed_no: '在职-暂不考虑',
    employed_open: '在职-考虑机会', employed_month: '在职-月内到岗',
    under_3k: '3K以下', '3-5k': '3-5K', '5-10k': '5-10K',
    '10-20k': '10-20K', '20-50k': '20-50K', '50k_plus': '50K以上',
  };

  /** 中文显示文本 → chip data-value 反向映射 */
  const TEXT_TO_VALUE_ID = {};
  for (const [id, text] of Object.entries(VALUE_ID_TO_TEXT)) {
    TEXT_TO_VALUE_ID[text] = id;
  }

  /** 是否只读模式（查看详情） */
  let isReadonly = false;

  /**
   * 解析 URL 参数获取 jobId
   * @returns {string|null} 岗位ID
   */
  function getJobIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('jobId') || null;
  }

  /**
   * 解析 URL 参数获取只读标志
   * @returns {boolean} 是否只读模式
   */
  function getReadonlyFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('readonly') === 'true';
  }

  /**
   * 应用只读模式：禁用所有编辑功能，隐藏操作按钮
   */
  function applyReadonlyMode() {
    document.body.classList.add('readonly');
    // 隐藏保存按钮
    const saveWrapper = document.querySelector('.save-wrapper');
    if (saveWrapper) saveWrapper.style.display = 'none';
    // 隐藏"添加匹配规则"按钮
    const addRuleBtn = document.getElementById('btnAddRule');
    if (addRuleBtn) addRuleBtn.style.display = 'none';
    // 隐藏"添加打招呼话术"按钮
    const addMsgBtn = document.getElementById('btnAddMessage');
    if (addMsgBtn) addMsgBtn.style.display = 'none';
    // 修改标题和返回按钮
    document.title = '岗位详情';
    const backBtn = document.getElementById('btnBack');
    if (backBtn) backBtn.textContent = '← 返回岗位列表';
  }

  /**
   * 一次性迁移：把旧 replyPositionConfigs 的话术并入 greetingConfigs.replyMessages，
   * 并补齐 replyMessages/isDefault 字段。只补空、不覆盖用户已填内容；旧键保留不删。
   */
  async function migrateLegacyConfigs() {
    try {
      const result = await chrome.storage.local.get([GREETING_CONFIGS_KEY, 'replyPositionConfigs']);
      const configs = result[GREETING_CONFIGS_KEY] || [];
      const legacy = result['replyPositionConfigs'] || [];
      let changed = false;
      configs.forEach(c => {
        if (!Array.isArray(c.replyMessages)) { c.replyMessages = []; changed = true; }
        if (typeof c.isDefault !== 'boolean') { c.isDefault = false; changed = true; }
      });
      legacy.forEach(rc => {
        const msgs = Array.isArray(rc.greetingMessages) ? rc.greetingMessages.filter(Boolean) : [];
        if (!msgs.length) return;
        const target = configs.find(c => (c.jobName || '') === (rc.name || ''));
        if (target && target.replyMessages.length === 0) {
          target.replyMessages = msgs.slice();
          changed = true;
        }
      });
      if (changed) await chrome.storage.local.set({ [GREETING_CONFIGS_KEY]: configs });
    } catch (e) { console.error('配置迁移失败:', e); }
  }

  /**
   * 从 chrome.storage 加载配置
   */
  async function loadConfig() {
    currentJobId = getJobIdFromUrl();
    isReadonly = getReadonlyFromUrl();

    if (!currentJobId) {
      // 新建：使用默认值
      initDefault();
      if (isReadonly) applyReadonlyMode();
      return;
    }
    try {
      const result = await chrome.storage.local.get([GREETING_CONFIGS_KEY, JOBS_KEY]);
      const configs = result[GREETING_CONFIGS_KEY] || [];
      const config = configs.find(c => c.jobId === currentJobId);
      if (config) {
        applyConfig(config);
      } else {
        initDefault();
      }
      // 加载完成后，如果是只读模式则应用
      if (isReadonly) applyReadonlyMode();
    } catch (err) {
      console.error('加载配置失败:', err);
      initDefault();
      if (isReadonly) applyReadonlyMode();
    }
  }

  /**
   * 初始化默认空表单
   */
  function initDefault() {
    // 岗位名称空，默认打招呼人数100
    document.getElementById('jobNameInput').value = '';
    document.getElementById('greetCountInput').value = 20;
    // 初始化一条空规则
    rulesContainer.innerHTML = '';
    addRule();
    // 话术区域初始为空，用户通过按钮自行添加
    messagesContainer.innerHTML = '';
    // 回复话术与默认兜底重置
    document.getElementById('replyMessagesContainer').innerHTML = '';
    document.getElementById('isDefaultJob').checked = false;
    resetReplySettings();
  }

  /**
   * 将已保存的配置数据填充到表单
   * @param {Object} config - 配置对象
   */
  function applyConfig(config) {
    // 基本信息
    document.getElementById('jobNameInput').value = config.jobName || '';
    document.getElementById('greetCountInput').value = config.greetCount || 20;

    // 重置所有筛选条件为默认「不限」状态
    document.getElementById('vipAgeMin').value = '';
    document.getElementById('vipAgeMax').value = '';
    document.querySelectorAll('.chip-group').forEach(group => {
      group.querySelectorAll('.chip').forEach(chip => chip.classList.remove('active', 'active-vip'));
      const defaultChip = group.querySelector('.chip[data-value=""]');
      if (defaultChip) defaultChip.classList.add(group.closest('.vip-container') ? 'active-vip' : 'active');
    });

    // 从 bossFilters 数组加载筛选条件（[{ name, values }] 格式，参考推荐项目 BossFilterSetting）
    const bossFilters = config.bossFilters || [];
    for (const filter of bossFilters) {
      const { name, values } = filter;
      const valueList = Array.isArray(values) ? values : [values];

      // 年龄特殊处理：values[0] 为 "20-35" 格式，拆分到 ageMin/ageMax 输入框
      if (name === '年龄') {
        const rangeMatch = valueList[0] && String(valueList[0]).match(/^(\d+)-(\d+)$/);
        if (rangeMatch) {
          document.getElementById('vipAgeMin').value = rangeMatch[1];
          document.getElementById('vipAgeMax').value = rangeMatch[2];
        }
        continue;
      }

      // 直接通过页面中文名查找对应的 chip-group（data-field 已直接使用页面中文名）
      const chipGroup = document.querySelector(`.chip-group[data-field="${name}"]`);
      if (!chipGroup) continue;

      // 将中文值转回 chip data-value 并高亮
      for (const val of valueList) {
        const valueId = TEXT_TO_VALUE_ID[val];
        if (!valueId) continue;
        const chip = chipGroup.querySelector(`.chip[data-value="${valueId}"]`);
        if (chip) {
          chip.classList.add(chipGroup.closest('.vip-container') ? 'active-vip' : 'active');
        }
      }
      // 有选中值时去掉「不限」高亮
      if (valueList.length > 0 && valueList.some(v => v !== '')) {
        const defaultChip = chipGroup.querySelector('.chip[data-value=""]');
        if (defaultChip) defaultChip.classList.remove('active', 'active-vip');
      }
    }

    // 匹配规则
    rulesContainer.innerHTML = '';
    if (config.matchRules && config.matchRules.length > 0) {
      config.matchRules.forEach(rule => addRule(rule));
    } else {
      addRule();
    }

    // 打招呼话术
    messagesContainer.innerHTML = '';
    if (config.greetingMessages && config.greetingMessages.length > 0) {
      config.greetingMessages.forEach(msg => addMessage(msg));
    }

    // 自动回复话术 + 默认兜底
    const replyContainer = document.getElementById('replyMessagesContainer');
    replyContainer.innerHTML = '';
    if (config.replyMessages && config.replyMessages.length > 0) {
      config.replyMessages.forEach(msg => addReplyMessage(msg));
    }
    document.getElementById('isDefaultJob').checked = config.isDefault === true;
    loadReplySettings(config.jobName || '');
  }

  /**
   * 设置 chip 组的值（根据 data-value 匹配高亮）
   * 支持数组（多选字段）和字符串（单选字段）两种格式
   * @param {string} selector - chip-group 选择器
   * @param {string|string[]} value - 要选中的 chip 的 data-value，或值数组
   */
  function setChipValue(selector, value) {
    const group = document.querySelector(selector);
    if (!group) return;

    // 统一转为数组处理（兼容旧版单值字符串）
    const values = Array.isArray(value) ? value : (value ? [value] : []);

    group.querySelectorAll('.chip').forEach(chip => {
      chip.classList.remove('active', 'active-vip');
      if (values.length === 0 && chip.dataset.value === '') {
        // 无值时选中「不限」
        chip.classList.add(chip.closest('.vip-container') ? 'active-vip' : 'active');
      } else if (values.includes(chip.dataset.value)) {
        chip.classList.add(chip.closest('.vip-container') ? 'active-vip' : 'active');
      }
    });
  }

  /**
   * 收集指定 chip 组的值
   * @param {string} selector - chip-group 选择器
   * @returns {string} 选中的 chip 的 data-value
   */
  function getChipValue(selector) {
    const group = typeof selector === 'string' ? document.querySelector(selector) : selector;
    if (!group) return '';
    const active = group.querySelector('.chip.active, .chip.active-vip');
    return active ? active.dataset.value : '';
  }

  /**
   * 收集多选 chip 组的所有选中值（排除「不限」）
   * @param {string|Element} selector - chip-group 选择器或元素
   * @returns {string[]} 选中的 chip 的 data-value 数组，若仅「不限」则返回空数组
   */
  function getChipValues(selector) {
    const group = typeof selector === 'string' ? document.querySelector(selector) : selector;
    if (!group) return [];
    const active = group.querySelectorAll('.chip.active, .chip.active-vip');
    return Array.from(active)
      .map(c => c.dataset.value)
      .filter(v => v !== '');  // 排除「不限」
  }

  /* ==================== Chip 组事件（支持多选/单选） ==================== */
  document.addEventListener('click', function(e) {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    const group = chip.closest('.chip-group');
    if (!group) return;

    const field = group.dataset.field;                     // 当前 chip 组对应的字段名
    const isMultiSelect = MULTI_SELECT_FIELDS.includes(field);
    const isVip = !!chip.closest('.vip-container');
    const activeClass = isVip ? 'active-vip' : 'active';
    const isNoneOption = chip.dataset.value === '';        // 「不限」选项

    if (isMultiSelect) {
      if (isNoneOption) {
        // 点击「不限」：移除同组所有高亮，仅高亮「不限」
        group.querySelectorAll('.chip').forEach(c => c.classList.remove('active', 'active-vip'));
        chip.classList.add(activeClass);
      } else {
        // 切换当前 chip 的高亮状态（多选）
        chip.classList.toggle(activeClass);
        // 如果勾选了任一个非「不限」选项，取消「不限」的选中
        const noneChip = group.querySelector('.chip[data-value=""]');
        if (noneChip) noneChip.classList.remove('active', 'active-vip');
      }
    } else {
      // 单选字段：保持原行为（移除同组所有高亮，仅高亮当前点击的）
      group.querySelectorAll('.chip').forEach(c => c.classList.remove('active', 'active-vip'));
      chip.classList.add(activeClass);
    }
  });

  /* ==================== 标签输入（匹配规则关键词） ==================== */

  /**
   * 处理标签输入：Enter 键添加标签
   * @param {KeyboardEvent} e - 键盘事件
   */
  /**
   * 将输入的文本按中英文逗号拆分为关键词数组，
   * 过滤空白项，并跳过容器中已存在的标签
   * @param {string} raw - 原始输入文本
   * @param {HTMLElement} container - 标签容器 DOM
   * @returns {string[]} 不重复的有效关键词列表
   */
  function _splitKeywords(raw, container) {
    const values = raw.split(/[,，]/).map(v => v.trim()).filter(Boolean);
    const existingTexts = new Set(
      Array.from(container.querySelectorAll('.keyword-tag')).map(tag => {
        const textNode = Array.from(tag.childNodes).find(n => n.nodeType === 3);
        return textNode ? textNode.textContent.trim() : '';
      }).filter(Boolean)
    );
    return values.filter(v => !existingTexts.has(v));
  }

  function handleTagKeydown(e) {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const input = e.target;
    const rawValue = input.value.trim();
    if (!rawValue) return;

    const container = input.closest('.tag-input-container');
    if (!container) return;
    const isForbidden = container.classList.contains('forbidden-container');

    // 按中英文逗号拆分，批量创建标签
    const values = _splitKeywords(rawValue, container);
    for (const value of values) {
      const tag = document.createElement('span');
      tag.className = 'keyword-tag' + (isForbidden ? ' forbidden' : '');
      tag.innerHTML = escapeHtml(value) + '<span class="tag-close">×</span>';
      container.insertBefore(tag, input);
    }
    input.value = '';
  }

  /**
   * 处理标签输入框失焦事件：自动将未确认的输入内容按逗号分隔转换为标签
   * @param {FocusEvent} e - 失焦事件
   */
  function handleTagBlur(e) {
    const input = e.target;
    const rawValue = input.value.trim();
    if (!rawValue) return;

    const container = input.closest('.tag-input-container');
    if (!container) return;
    const isForbidden = container.classList.contains('forbidden-container');

    // 自动转换剩余文本为标签（必须包含和严禁包含通用）
    const values = _splitKeywords(rawValue, container);
    for (const value of values) {
      const tag = document.createElement('span');
      tag.className = 'keyword-tag' + (isForbidden ? ' forbidden' : '');
      tag.innerHTML = escapeHtml(value) + '<span class="tag-close">×</span>';
      container.insertBefore(tag, input);
    }
    input.value = '';
  }

  /**
   * 处理标签关闭点击
   */
  function handleTagClose(e) {
    const closeBtn = e.target.closest('.tag-close');
    if (!closeBtn) return;
    const tag = closeBtn.closest('.keyword-tag');
    if (tag) tag.remove();
  }

  /**
   * 获取标签输入容器中的所有标签文本
   * @param {string} containerId - 容器 ID
   * @returns {string[]} 标签文本数组
   */
  function getTags(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return [];
    return Array.from(container.querySelectorAll('.keyword-tag')).map(tag => {
      // 去掉关闭按钮的文本
      const textNode = tag.childNodes[0];
      return textNode ? textNode.textContent.trim() : '';
    }).filter(Boolean);
  }

  /* ==================== 匹配规则管理 ==================== */

  /**
   * 添加一条匹配规则
   * @param {Object} [ruleData] - 已有的规则数据（编辑时填充）
   */
  function addRule(ruleData) {
    ruleCount++;
    const container = document.getElementById('rulesContainer');
    const ruleId = ruleCount;
    const mustId = 'mustContainer_' + ruleId;
    const forbidId = 'forbidContainer_' + ruleId;
    const ruleCardId = 'ruleCard_' + ruleId;

    const mustKeywords = (ruleData && ruleData.mustKeywords) || [];
    const forbiddenKeywords = (ruleData && ruleData.forbiddenKeywords) || [];
    const matchMode = (ruleData && ruleData.matchMode) || 'or';

    // 构建必须关键词标签 HTML
    const mustTagsHtml = mustKeywords.map(kw =>
      '<span class="keyword-tag">' + escapeHtml(kw) + '<span class="tag-close">×</span></span>'
    ).join('');
    // 构建严禁关键词标签 HTML
    const forbidTagsHtml = forbiddenKeywords.map(kw =>
      '<span class="keyword-tag forbidden">' + escapeHtml(kw) + '<span class="tag-close">×</span></span>'
    ).join('');

    const card = document.createElement('div');
    card.className = 'rule-card';
    card.id = ruleCardId;
    card.innerHTML = `
      <div class="rule-header">
        <span class="rule-title">规则 ${ruleId}</span>
        <span class="delete-btn" data-action="remove-rule">删除</span>
      </div>
      <div class="field">
        <label>必须包含关键词</label>
        <div class="tag-input-container" id="${mustId}">
          ${mustTagsHtml}
          <input type="text" placeholder="输入并回车，支持逗号分隔">
        </div>
        <div style="margin-top: 8px; display: flex; gap: 12px;">
          <label style="display: flex; align-items: center; gap: 4px; font-size: 12px;">
            <input type="radio" name="match_mode_${ruleId}" value="or" ${matchMode === 'or' ? 'checked' : ''}> 满足其一 (OR)
          </label>
          <label style="display: flex; align-items: center; gap: 4px; font-size: 12px;">
            <input type="radio" name="match_mode_${ruleId}" value="and" ${matchMode === 'and' ? 'checked' : ''}> 满足全部 (AND)
          </label>
        </div>
      </div>
      <div class="field">
        <label>严禁包含关键词</label>
        <div class="tag-input-container forbidden-container" id="${forbidId}">
          ${forbidTagsHtml}
          <input type="text" placeholder="输入并回车，支持逗号分隔">
        </div>
      </div>
    `;
    container.appendChild(card);
    reindexRules();
  }

  /** 重新编号所有规则标题 */
  function reindexRules() {
    const titles = document.querySelectorAll('.rule-title');
    titles.forEach((title, index) => {
      title.textContent = '规则 ' + (index + 1);
    });
  }

  /**
   * 删除匹配规则卡片
   * @param {Element} cardEl - 要删除的规则卡片元素
   */
  function removeRuleCard(cardEl) {
    cardEl.remove();
    reindexRules();
  }

  /**
   * 收集所有匹配规则数据
   * @returns {Array} 规则数据数组
   */
  function collectRules() {
    const cards = document.querySelectorAll('#rulesContainer .rule-card');
    return Array.from(cards).map(card => {
      const ruleId = card.id ? card.id.replace('ruleCard_', '') : '';
      const mustContainer = card.querySelector('.tag-input-container:not(.forbidden-container)');
      const forbidContainer = card.querySelector('.tag-input-container.forbidden-container');
      const matchModeRadio = card.querySelector('input[name="match_mode_' + ruleId + '"]:checked');

      return {
        scope: 'resume',  // 默认始终匹配简历内容
        mustKeywords: mustContainer ? getTagTexts(mustContainer) : [],
        matchMode: matchModeRadio ? matchModeRadio.value : 'or',
        forbiddenKeywords: forbidContainer ? getTagTexts(forbidContainer) : [],
      };
    });
  }

  /**
   * 获取标签容器中所有标签的文本
   * @param {Element} container - 标签输入容器元素
   * @returns {string[]} 标签文本数组
   */
  function getTagTexts(container) {
    return Array.from(container.querySelectorAll('.keyword-tag')).map(tag => {
      const textNode = Array.from(tag.childNodes).find(n => n.nodeType === 3);
      return textNode ? textNode.textContent.trim() : '';
    }).filter(Boolean);
  }

  // 事件委托：规则容器中的删除、标签输入和标签关闭
  document.getElementById('rulesContainer').addEventListener('keydown', function(e) {
    if (e.target.matches('.tag-input-container input')) {
      handleTagKeydown(e);
    }
  });

  // 事件委托：规则容器中"必须包含关键词"输入框失焦提醒
  document.getElementById('rulesContainer').addEventListener('blur', function(e) {
    if (e.target.matches('.tag-input-container input')) {
      handleTagBlur(e);
    }
  }, true); // 使用捕获阶段，因为 blur 事件不会冒泡

  document.getElementById('rulesContainer').addEventListener('click', function(e) {
    // 删除规则
    if (e.target.closest('[data-action="remove-rule"]')) {
      const card = e.target.closest('.rule-card');
      if (card) removeRuleCard(card);
      return;
    }
    // 关闭标签
    handleTagClose(e);
  });

  /* ==================== 打招呼话术管理 ==================== */

  /**
   * 添加一条打招呼话术
   * @param {string} [text=''] - 话术文本
   */
  function addMessage(text) {
    const container = document.getElementById('messagesContainer');
    const wrapper = document.createElement('div');
    wrapper.className = 'message-box-simple';
    wrapper.innerHTML = `
      <textarea class="textarea" placeholder="例如：你好，看了你的简历感觉非常棒，特别是你的 [关键词] 经验，想和你沟通下。" rows="3">${escapeHtml(text || '')}</textarea>
      <span class="delete-icon" data-action="remove-message">✕</span>
    `;
    container.appendChild(wrapper);
  }

  /**
   * 收集所有话术文本
   * @returns {string[]} 话术文本数组
   */
  function collectMessages() {
    const wrappers = document.querySelectorAll('#messagesContainer .message-box-simple');
    return Array.from(wrappers).map(w => {
      const ta = w.querySelector('.textarea');
      return ta ? ta.value.trim() : '';
    }).filter(Boolean);
  }

  /**
   * 添加一条自动回复话术
   * @param {string} [text=''] - 话术文本
   */
  function addReplyMessage(text) {
    const container = document.getElementById('replyMessagesContainer');
    const wrapper = document.createElement('div');
    wrapper.className = 'message-box-simple';
    wrapper.innerHTML = `
      <textarea class="textarea" placeholder="例如：您好，感谢您对本岗位的关注，方便的话可以先发一份您的简历。" rows="3">${escapeHtml(text || '')}</textarea>
      <span class="delete-icon" data-action="remove-message">✕</span>
    `;
    container.appendChild(wrapper);
  }

  /**
   * 收集所有自动回复话术文本
   * @returns {string[]} 话术文本数组
   */
  function collectReplyMessages() {
    const wrappers = document.querySelectorAll('#replyMessagesContainer .message-box-simple');
    return Array.from(wrappers).map(w => {
      const ta = w.querySelector('.textarea');
      return ta ? ta.value.trim() : '';
    }).filter(Boolean);
  }

  /* ─── 回复设置（按岗位定制自动回复引擎；UI 合一，引擎不动） ─── */

  function setReplyCustomVisible(enabled) {
    const body = document.getElementById('replyCustomBody');
    if (body) body.style.display = enabled ? 'block' : 'none';
  }

  function resetReplySettings() {
    document.getElementById('replyCustomEnable').checked = false;
    document.getElementById('replyAutoLimit').value = 5;
    document.getElementById('replyKeywordReply').checked = true;
    document.getElementById('replyAiReply').checked = true;
    document.getElementById('replyKnowledgeBase').value = '';
    setReplyCustomVisible(false);
  }

  /** 编辑岗位时，从 replyPositionConfigs 回显该岗位的回复设置（按岗位名匹配）。 */
  async function loadReplySettings(jobName) {
    resetReplySettings();
    if (!jobName) return;
    try {
      const result = await chrome.storage.local.get(REPLY_POSITION_CONFIGS_KEY);
      const list = result[REPLY_POSITION_CONFIGS_KEY] || [];
      const cfg = list.find(c => (c.name || '') === jobName);
      if (!cfg) return;
      document.getElementById('replyCustomEnable').checked = cfg.enabled !== false;
      document.getElementById('replyAutoLimit').value = cfg.autoReplyLimit || 5;
      document.getElementById('replyKeywordReply').checked = cfg.keywordReply !== false;
      document.getElementById('replyAiReply').checked = cfg.aiReply !== false;
      document.getElementById('replyKnowledgeBase').value = cfg.positionKnowledgeBase || '';
      setReplyCustomVisible(true);
    } catch (err) { console.error('加载回复设置失败:', err); }
  }

  /** 读取回复设置区块。 */
  function collectReplySettings() {
    const enabled = document.getElementById('replyCustomEnable').checked === true;
    let limit = parseInt(document.getElementById('replyAutoLimit').value, 10);
    if (!Number.isInteger(limit) || limit < 1) limit = 5;
    if (limit > 20) limit = 20;
    return {
      enabled,
      autoReplyLimit: limit,
      keywordReply: document.getElementById('replyKeywordReply').checked === true,
      aiReply: document.getElementById('replyAiReply').checked === true,
      positionKnowledgeBase: document.getElementById('replyKnowledgeBase').value.trim(),
    };
  }

  /**
   * 双写 replyPositionConfigs（按岗位名）。
   * 关键：未勾选定制且该岗位无现存条目时【不写】，保持回复引擎默认「全岗位」行为，
   * 避免保存打招呼把引擎意外翻成「白名单」模式导致其它岗位不再自动回复。
   */
  async function syncReplyPositionConfig(jobName, settings) {
    if (!jobName) return;
    const result = await chrome.storage.local.get(REPLY_POSITION_CONFIGS_KEY);
    const list = result[REPLY_POSITION_CONFIGS_KEY] || [];
    const idx = list.findIndex(c => (c.name || '') === jobName);
    if (!settings.enabled && idx === -1) return; // 未定制且无条目：不动
    if (idx !== -1) {
      list[idx] = {
        ...list[idx],
        name: jobName,
        enabled: settings.enabled,
        autoReplyLimit: settings.autoReplyLimit,
        keywordReply: settings.keywordReply,
        aiReply: settings.aiReply,
        positionKnowledgeBase: settings.positionKnowledgeBase,
      };
    } else {
      list.push({
        id: 'rpc_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        name: jobName,
        enabled: settings.enabled,
        autoReplyLimit: settings.autoReplyLimit,
        keywordReply: settings.keywordReply,
        aiReply: settings.aiReply,
        positionKnowledgeBase: settings.positionKnowledgeBase,
        greetingMessages: [],
      });
    }
    await chrome.storage.local.set({ [REPLY_POSITION_CONFIGS_KEY]: list });
  }


  // 事件委托：回复话术删除
  document.getElementById('replyMessagesContainer').addEventListener('click', function(e) {
    if (e.target.closest('[data-action="remove-message"]')) {
      const wrapper = e.target.closest('.message-box-simple');
      if (wrapper) wrapper.remove();
    }
  });

  // 事件委托：话术删除和新增
  document.getElementById('messagesContainer').addEventListener('click', function(e) {
    if (e.target.closest('[data-action="remove-message"]')) {
      const wrapper = e.target.closest('.message-box-simple');
      if (wrapper) wrapper.remove();
    }
  });

  /* ==================== 保存逻辑 ==================== */

  /** 收集所有表单数据并保存 */
  async function saveConfig() {
    if (isSaving) return;
    isSaving = true;

    const saveBtn = document.getElementById('btnSave');
    saveBtn.textContent = '保存中…';
    saveBtn.disabled = true;

    try {
      const jobName = document.getElementById('jobNameInput').value.trim();
      if (!jobName) {
        showToast('请输入岗位名称');
        isSaving = false;
        saveBtn.textContent = '保存配置';
        saveBtn.disabled = false;
        return;
      }

      // 收集匹配规则数据
      const matchRules = collectRules();
      // 校验：至少有一条匹配规则
      if (matchRules.length === 0) {
        showToast('请至少添加一条匹配规则');
        isSaving = false;
        saveBtn.textContent = '保存配置';
        saveBtn.disabled = false;
        return;
      }
      // 校验：每条规则的"必须包含关键词"不能为空
      const emptyMustRule = matchRules.find(r => r.mustKeywords.length === 0);
      if (emptyMustRule) {
        showToast('每条匹配规则的"必须包含关键词"不能为空');
        isSaving = false;
        saveBtn.textContent = '保存配置';
        saveBtn.disabled = false;
        return;
      }

      // 收集打招呼话术
      const greetingMessages = collectMessages();
      // 校验：至少有一条打招呼话术
      if (greetingMessages.length === 0) {
        showToast('请至少添加一条打招呼话术');
        isSaving = false;
        saveBtn.textContent = '保存配置';
        saveBtn.disabled = false;
        return;
      }

      // 构建 bossFilters 数组（[{ name, values }] 格式，参考推荐项目 BossFilterSetting）
      const bossFilters = [];

      // 年龄筛选（范围输入格式 "min-max"）
      const ageMin = parseInt(document.getElementById('vipAgeMin').value);
      const ageMax = parseInt(document.getElementById('vipAgeMax').value);
      if (!isNaN(ageMin) && !isNaN(ageMax)) {
        bossFilters.push({ name: '年龄', values: [`${ageMin}-${ageMax}`] });
      }

      // 遍历所有 chip-group 收集筛选条件
      document.querySelectorAll('.chip-group').forEach(group => {
        const filterName = group.dataset.field;
        if (!filterName) return;

        const isMulti = MULTI_SELECT_FIELDS.includes(filterName);
        const activeValues = isMulti ? getChipValues(group) : [getChipValue(group)];
        // 过滤掉空值（"不限"）
        const filteredValues = activeValues.filter(v => v && v !== '');

        if (filteredValues.length === 0) return;

        // 将 chip data-value 转为中文显示文本
        const chineseValues = filteredValues.map(v => VALUE_ID_TO_TEXT[v] || v);
        bossFilters.push({ name: filterName, values: chineseValues });
      });

      const configData = {
        jobName: jobName,
        greetCount: parseInt(document.getElementById('greetCountInput').value) || 20,
        bossFilters: bossFilters,
        matchRules: matchRules,
        greetingMessages: greetingMessages,
        replyMessages: collectReplyMessages(),
        isDefault: document.getElementById('isDefaultJob').checked === true,
      };

      // 读存储
      const storage = await chrome.storage.local.get([GREETING_CONFIGS_KEY, JOBS_KEY]);
      let configs = storage[GREETING_CONFIGS_KEY] || [];
      let jobs = storage[JOBS_KEY] || [];

      if (currentJobId) {
        // 编辑已有配置
        const idx = configs.findIndex(c => c.jobId === currentJobId);
        if (idx !== -1) {
          configs[idx] = { ...configs[idx], ...configData };
        } else {
          configData.jobId = currentJobId;
          configs.push(configData);
        }
        // 同步更新 jobConfigs 中的岗位名称
        const jobIdx = jobs.findIndex(j => j.id === currentJobId);
        if (jobIdx !== -1) {
          jobs[jobIdx].name = jobName;
        }
      } else {
        // 新建：生成新 ID
        const newId = 'job_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
        configData.jobId = newId;
        configs.push(configData);

        // 同时在 jobConfigs 中创建新岗位
        jobs.push({
          id: newId,
          name: jobName,
          enabled: true,
        });
      }

      // 保证全库只有一个默认兜底岗位
      if (configData.isDefault) {
        const selfId = currentJobId || configData.jobId;
        configs.forEach(c => { if (c.jobId !== selfId) c.isDefault = false; });
      }

      // 写入存储
      await chrome.storage.local.set({
        [GREETING_CONFIGS_KEY]: configs,
        [JOBS_KEY]: jobs,
      });

      // UI 合一：同步本岗位回复设置到 replyPositionConfigs（引擎不动；未定制则不写）
      await syncReplyPositionConfig(configData.jobName, collectReplySettings());

      showToast('✅ 配置已保存');

      // 保存成功后延迟导航回岗位列表
      setTimeout(() => {
        try {
          window.parent.postMessage({ type: 'NAVIGATE', src: 'screens/job-list.html' }, '*');
        } catch (e) {
          // 降级
        }
      }, 800);

    } catch (err) {
      showToast('❌ 保存失败: ' + err.message);
      console.error(err);
    } finally {
      isSaving = false;
      saveBtn.textContent = '保存配置';
      saveBtn.disabled = false;
    }
  }

  /* ==================== 工具函数 ==================== */

  /** 转义 HTML 特殊字符 */
  function escapeHtml(text) {
    const d = document.createElement('div');
    d.textContent = text || '';
    return d.innerHTML;
  }

  /** 显示 Toast 提示消息 */
  function showToast(msg) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.style.opacity = '1';
    setTimeout(() => { el.style.opacity = '0'; }, 2500);
  }

  // DOM 就绪时初始化
  document.addEventListener('DOMContentLoaded', () => {
    migrateLegacyConfigs().then(loadConfig);

    // 返回按钮
    const backBtn = document.getElementById('btnBack');
    if (backBtn) backBtn.addEventListener('click', () => {
      try { window.parent.postMessage({ type: 'NAVIGATE', src: 'screens/job-list.html' }, '*'); }
      catch (e) { /* 降级 */ }
    });

    // 保存按钮
    document.getElementById('btnSave').addEventListener('click', saveConfig);

    // 添加规则按钮
    document.getElementById('btnAddRule').addEventListener('click', () => addRule());

    // 添加话术按钮
    document.getElementById('btnAddMessage').addEventListener('click', () => addMessage());

    // 添加回复话术按钮
    document.getElementById('btnAddReplyMessage').addEventListener('click', () => addReplyMessage());

    // 回复设置定制开关：显隐定制区
    document.getElementById('replyCustomEnable').addEventListener('change', (e) => {
      setReplyCustomVisible(e.target.checked);
    });
  });

})();
