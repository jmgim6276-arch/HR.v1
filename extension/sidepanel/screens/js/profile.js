/**
 * 个人中心页面脚本
 * 管理用户登录、订阅方案选择和退出登录
 *
 * API 后端地址：https://hr.uf-tree.com
 * 在线文档：https://hr.uf-tree.com/docs
 */
(function () {
  "use strict";

  const AUTH_KEY = "profileAuth";
  const SUBSCRIPTION_KEY = "profileSubscription";
  const PRIVACY_CONSENT_KEY = "privacyConsent";
  const PRIVACY_CONSENT_VERSION = "2026-07-29";
  let codeTimer = null; // 验证码倒计时
  let codeCountdown = 0; // 倒计时秒数
  let productsCache = null; // 套餐列表缓存

  /**
   * 加载个人中心，根据登录状态显示对应视图
   * 已登录时从 API 刷新数据
   */
  async function loadProfile() {
    try {
      const result = await chrome.storage.local.get([
        AUTH_KEY,
        SUBSCRIPTION_KEY,
        PRIVACY_CONSENT_KEY,
      ]);
      const auth = result[AUTH_KEY] || {};
      const consent = result[PRIVACY_CONSENT_KEY] || {};
      updatePrivacyConsentControls(consent);

      if (auth.isLoggedIn && auth.accessToken) {
        // 已登录：显示个人中心，并从 API 刷新数据
        showProfileView(auth, result[SUBSCRIPTION_KEY] || {});
        refreshProfileFromAPI(auth);
      } else {
        showLoginView();
      }
    } catch (err) {
      console.error("[Profile] 加载状态失败:", err);
      showLoginView();
    }
  }

  /**
   * 从 API 刷新用户信息和订阅状态
   * @param {Object} auth - 认证信息（含 accessToken）
   */
  async function refreshProfileFromAPI(auth) {
    try {
      // 调用已有的同步订阅接口，内部调用 GET /api/v1/users/me 并保存到 storage
      const subscription = await sendToSW("cmd_profile_sync_subscription");
      // subscription 已由 SW 保存到 storage，直接更新 UI
      showProfileView(auth, subscription);
    } catch (err) {
      console.warn("[Profile] 刷新用户信息失败:", err.message);
      // 使用本地缓存数据继续显示
    }
    // 无论刷新是否成功，都尝试加载套餐列表
    loadProducts();
  }

  /** 显示登录视图，隐藏个人中心视图 */
  function showLoginView() {
    document.getElementById("loginView").style.display = "block";
    document.getElementById("profileView").style.display = "none";
  }

  /** 显示个人中心视图，隐藏登录视图 */
  function showProfileView(auth, sub) {
    document.getElementById("loginView").style.display = "none";
    document.getElementById("profileView").style.display = "block";

    // 填充个人信息
    document.getElementById("profileEmail").textContent = auth.email || "-";

    const planLabel = document.getElementById("profilePlan");
    if (sub.isVip) {
      planLabel.className = "tag-vip";
      planLabel.textContent = sub.planName || "专业版";
    } else {
      planLabel.className = "tag-free";
      planLabel.textContent = "免费版";
    }

    document.getElementById("profileExpire").textContent = formatExpireDate(
      sub.expireDate,
    );
  }

  /**
   * 格式化到期时间
   * @param {string} dateStr - ISO 日期字符串
   * @returns {string}
   */
  function formatExpireDate(dateStr) {
    if (!dateStr) return "未订阅";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("zh-CN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (e) {
      return dateStr;
    }
  }

  /**
   * 加载套餐列表，渲染到页面
   */
  async function loadProducts() {
    try {
      // 使用缓存的套餐数据
      if (productsCache) {
        renderProducts(productsCache);
        return;
      }
      const result = await sendToSW("cmd_profile_get_products");
      const products = result?.products || [];
      if (products.length > 0) {
        productsCache = products;
        renderProducts(products);
        return;
      }
    } catch (err) {
      console.warn("[Profile] 加载套餐列表失败:", err.message);
    }
    // 加载失败或套餐为空 → 隐藏加载提示，保留 HTML 中硬编码的默认套餐
    const hint = document.getElementById("planLoadHint");
    if (hint) hint.style.display = "none";
  }

  /**
   * 格式化价格：带小数就显示1位小数，整数不显示小数
   * @param {number} cents - 分单位的价格
   * @returns {string}
   */
  function formatPrice(cents) {
    const yuan = cents / 100;
    return yuan % 1 === 0 ? yuan.toFixed(0) : yuan.toFixed(1);
  }

  function escapeHtml(value) {
    const div = document.createElement("div");
    div.textContent = value == null ? "" : String(value);
    return div.innerHTML;
  }

  /**
   * 渲染套餐列表到 planSelector 容器
   * @param {Array} products - 产品列表
   */
  function renderProducts(products) {
    const container = document.getElementById("planSelector");
    const hint = document.getElementById("planLoadHint");
    if (!container) return;

    // 从 products 中提取所有 plans
    const allPlans = [];
    for (const product of products) {
      for (const plan of product.plans || []) {
        allPlans.push({
          ...plan,
          productId: product.id,
          productName: product.name,
        });
      }
    }

    if (allPlans.length === 0) {
      // 没有从 API 获取到套餐，隐藏加载提示
      if (hint) hint.style.display = "none";
      // 保留 HTML 中硬编码的默认套餐项
      return;
    }

    // 读取当前订阅的套餐，用于高亮匹配
    chrome.storage.local
      .get(SUBSCRIPTION_KEY)
      .then((result) => {
        const sub = result[SUBSCRIPTION_KEY] || {};
        const subscribedPlanId = sub.plan || "";
        const subscribedPlanType = sub.planType || "";

        let html = "";
        for (const plan of allPlans) {
          const price = formatPrice(plan.price_cents);
          const billingLabel = plan.billing_label || `${plan.duration_days}天`;
          // 判断该套餐是否为当前订阅的套餐
          const isActive =
            plan.id === subscribedPlanId ||
            plan.plan_type === subscribedPlanType;
          const active = isActive ? " active" : "";

          html += `
          <div class="plan-item${active}">
            <div class="plan-name">${escapeHtml(plan.name)}</div>
            <div class="plan-price">¥${price} <span>/${escapeHtml(billingLabel)}</span></div>
          </div>
        `;
        }

        if (html) {
          container.innerHTML = html;
        }
        // 隐藏加载提示
        if (hint) hint.style.display = "none";
      })
      .catch(() => {
        if (hint) hint.textContent = "加载套餐信息失败";
      });
  }

  /* ==================== 登录功能 ==================== */

  function updatePrivacyConsentControls(consent) {
    const accepted =
      consent?.version === PRIVACY_CONSENT_VERSION &&
      Boolean(consent?.acceptedAt) &&
      consent?.candidateDataAuthorized === true &&
      consent?.aiTransferAcknowledged === true &&
      consent?.cloudSettingsAcknowledged === true;
    const loginCheckbox = document.getElementById("privacyConsent");
    if (loginCheckbox) loginCheckbox.checked = accepted;
    const profileCheckbox = document.getElementById("profilePrivacyConsent");
    const saveButton = document.getElementById("btnSavePrivacyConsent");
    const status = document.getElementById("privacyConsentStatus");
    if (profileCheckbox) profileCheckbox.checked = accepted;
    if (saveButton)
      saveButton.textContent = accepted ? "已同意当前隐私政策" : "同意并保存";
    if (status) {
      status.textContent = accepted
        ? `已于 ${new Date(consent.acceptedAt).toLocaleString("zh-CN")} 完成授权`
        : "启动自动化任务前需要完成本次授权";
    }
  }

  async function savePrivacyConsent(email) {
    const consent = {
      version: PRIVACY_CONSENT_VERSION,
      acceptedAt: new Date().toISOString(),
      email: email || "",
      candidateDataAuthorized: true,
      aiTransferAcknowledged: true,
      cloudSettingsAcknowledged: true,
    };
    await chrome.storage.local.set({ [PRIVACY_CONSENT_KEY]: consent });
    updatePrivacyConsentControls(consent);
    return consent;
  }

  /** 确认并保存当前版本的隐私授权；发送邮箱验证码前即要求主动同意。 */
  async function requirePrivacyConsent(email) {
    const checkbox = document.getElementById("privacyConsent");
    if (!checkbox || !checkbox.checked) {
      showToast("请先阅读并同意隐私政策与数据处理说明");
      checkbox?.focus();
      return false;
    }
    await savePrivacyConsent(email);
    return true;
  }

  async function saveLoggedInPrivacyConsent() {
    const checkbox = document.getElementById("profilePrivacyConsent");
    if (!checkbox?.checked) {
      showToast("请先勾选隐私政策与数据处理说明");
      return;
    }
    const result = await chrome.storage.local.get(AUTH_KEY);
    const auth = result[AUTH_KEY] || {};
    await savePrivacyConsent(auth.email || "");
    try {
      await sendToSW("cmd_profile_sync_settings");
      showToast("✅ 授权已保存，账号配置已同步");
    } catch (error) {
      showToast("授权已保存，云端配置将在网络恢复后同步");
    }
  }

  /**
   * 发送验证码
   */
  async function sendCode() {
    const email = document.getElementById("loginEmail").value.trim();
    if (!email) {
      showToast("请输入邮箱地址");
      return;
    }
    // 简单邮箱格式校验
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showToast("请输入有效的邮箱地址");
      return;
    }
    if (!(await requirePrivacyConsent(email))) return;

    // 开始倒计时
    const btn = document.getElementById("btnSendCode");
    codeCountdown = 60;
    btn.disabled = true;
    updateCodeBtn(btn);

    codeTimer = setInterval(() => {
      codeCountdown--;
      if (codeCountdown <= 0) {
        clearInterval(codeTimer);
        codeTimer = null;
        btn.disabled = false;
        btn.textContent = "获取验证码";
      } else {
        updateCodeBtn(btn);
      }
    }, 1000);

    // 通过 SW 代理调用后端 API
    try {
      await sendToSW("cmd_profile_send_code", { email });
      showToast("✅ 验证码已发送至 " + email);
    } catch (err) {
      showToast("❌ 发送失败: " + err.message);
      // 发送失败时停止倒计时
      clearInterval(codeTimer);
      codeTimer = null;
      btn.disabled = false;
      btn.textContent = "重新发送";
    }
  }

  /** 更新验证码按钮文本 */
  function updateCodeBtn(btn) {
    btn.textContent = codeCountdown + "s 后重试";
  }

  /**
   * 执行登录
   * 流程：验证验证码 → 获取订阅信息 → 保存到本地 → 显示个人中心
   */
  async function login() {
    const email = document.getElementById("loginEmail").value.trim();
    const code = document.getElementById("loginCode").value.trim();

    if (!email || !code) {
      showToast("请输入邮箱和验证码");
      return;
    }
    if (!(await requirePrivacyConsent(email))) return;

    try {
      showToast("🔄 登录中...");
      // 通过 SW 代理调用后端验证 API
      let result = await sendToSW("cmd_profile_login", {
        email,
        code,
        forceLogin: false,
      });
      if (result.loginConflict) {
        const confirmed = window.confirm(
          "该账号已在其他设备登录。继续登录将立即退出原设备，是否继续？",
        );
        if (!confirmed) {
          showToast("已取消登录");
          return;
        }
        result = await sendToSW("cmd_profile_login", {
          email,
          code,
          forceLogin: true,
        });
      }

      // 提取 tokens
      const tokens = result.tokens || {};
      const accessToken = tokens.access_token || "";

      if (!accessToken) {
        showToast("❌ 登录失败: 未获取到访问令牌");
        return;
      }

      // 保存认证信息
      const authData = {
        email: email,
        userId: result.user?.id || result.settingsSync?.ownerUserId || "",
        isLoggedIn: true,
        loginTime: new Date().toISOString(),
        accessToken: accessToken,
        refreshToken: tokens.refresh_token || "",
        sessionId: result.session?.id || "",
      };

      // 从登录响应中提取订阅信息
      const subscription = result.subscription || {
        plan: "free",
        planName: "免费版",
        isVip: false,
        expireDate: null,
      };

      await chrome.storage.local.set({
        [AUTH_KEY]: authData,
        [SUBSCRIPTION_KEY]: subscription,
      });

      showToast(
        result.settingsSync?.ok === false
          ? "登录成功，但云端配置同步失败，请检查网络后重试"
          : "✅ 登录成功，账号配置已同步",
      );
      showProfileView(authData, subscription);
      // 异步加载套餐列表
      loadProducts();
    } catch (err) {
      showToast("❌ 登录失败: " + err.message);
    }
  }

  /* ==================== 二维码图片加载 ==================== */

  /**
   * 加载二维码图片，图片不存在时显示 SVG 占位图
   */
  function loadQRCodes() {
    const pairs = [
      { img: "qrPayImg", fallback: "qrPayFallback" },
      { img: "qrWxImg", fallback: "qrWxFallback" },
    ];
    for (const { img: imgId, fallback: fallbackId } of pairs) {
      const imgEl = document.getElementById(imgId);
      const fallbackEl = document.getElementById(fallbackId);
      if (!imgEl || !fallbackEl) continue;

      // 图片加载成功 → 隐藏 fallback
      imgEl.addEventListener("load", () => {
        fallbackEl.style.display = "none";
      });
      // 图片加载失败 → 隐藏 img，显示 fallback
      imgEl.addEventListener("error", () => {
        imgEl.style.display = "none";
        fallbackEl.style.display = "flex";
      });
      // 如果图片已缓存完成，手动触发 load
      if (imgEl.complete && imgEl.naturalWidth > 0) {
        fallbackEl.style.display = "none";
      } else if (imgEl.complete && imgEl.naturalWidth === 0) {
        imgEl.style.display = "none";
        fallbackEl.style.display = "flex";
      }
    }
    // 图片放大预览：点击图片打开弹窗
    for (const { img: imgId } of pairs) {
      const container = document.getElementById(imgId)?.parentElement;
      if (!container) continue;
      container.addEventListener("click", (e) => {
        const imgEl = document.getElementById(imgId);
        if (!imgEl || imgEl.style.display === "none") return; // 占位图不放大
        openPreview(imgEl.src);
      });
      container.addEventListener("keydown", (e) => {
        if (e.key !== "Enter" && e.key !== " ") return;
        e.preventDefault();
        const imgEl = document.getElementById(imgId);
        if (!imgEl || imgEl.style.display === "none") return;
        openPreview(imgEl.src);
      });
    }
  }

  /**
   * 打开图片预览弹窗
   * @param {string} src - 图片地址
   */
  function openPreview(src) {
    const overlay = document.getElementById("imgPreview");
    const img = document.getElementById("imgPreviewSrc");
    if (!overlay || !img) return;
    img.src = src;
    overlay.classList.add("show");
  }

  /**
   * 关闭图片预览弹窗
   */
  function closePreview() {
    const overlay = document.getElementById("imgPreview");
    if (!overlay) return;
    overlay.classList.remove("show");
  }

  /* ==================== 套餐展示（只读） ==================== */

  /**
   * 套餐仅用于展示，不支持点击订阅
   * 如需订阅请扫描收款二维码付款，付款时备注账号+套餐
   */

  /* ==================== 同步订阅状态 ==================== */

  /** 同步订阅状态（通过 SW 代理调用后端） */
  async function syncSubscription() {
    showToast("🔄 正在同步...");
    try {
      const subData = await sendToSW("cmd_profile_sync_subscription");
      await sendToSW("cmd_profile_sync_settings");
      // 更新本地存储的订阅信息
      const result = await chrome.storage.local.get(AUTH_KEY);
      const auth = result[AUTH_KEY] || {};
      await chrome.storage.local.set({ [SUBSCRIPTION_KEY]: subData });
      showProfileView(auth, subData);
      showToast("✅ 订阅与账号配置已同步");
    } catch (err) {
      showToast("❌ 同步失败: " + err.message);
    }
  }

  /* ==================== 退出登录 ==================== */

  /** 退出登录 */
  async function logout() {
    try {
      // 先调用后端登出 API（通过 SW 代理），再清除本地数据
      try {
        await sendToSW("cmd_profile_logout");
      } catch (e) {
        /* 忽略 */
      }
      await chrome.storage.local.remove([AUTH_KEY, SUBSCRIPTION_KEY]);
      showToast("✅ 已退出登录");
      showLoginView();
      // 清空登录表单
      document.getElementById("loginEmail").value = "";
      document.getElementById("loginCode").value = "";
    } catch (err) {
      showToast("❌ 退出失败: " + err.message);
    }
  }

  /* ==================== 工具函数 ==================== */

  /**
   * 通过 Shell API 或 chrome.runtime 发送消息到 Service Worker
   * @param {string} action - 动作名
   * @param {Object} [data] - 附加数据
   * @returns {Promise<any>}
   */
  async function sendToSW(action, data) {
    const api = window.parent && window.parent.__shellAPI;
    if (api && typeof api.sendToSW === "function") {
      return api.sendToSW(action, data);
    }
    return chrome.runtime.sendMessage({ action, data });
  }

  /** 显示 Toast 提示消息 */
  function showToast(msg) {
    const el = document.getElementById("toast");
    if (!el) return;
    el.textContent = msg;
    el.style.opacity = "1";
    setTimeout(() => {
      el.style.opacity = "0";
    }, 2500);
  }

  // DOM 就绪时初始化
  document.addEventListener("DOMContentLoaded", () => {
    loadProfile();
    loadQRCodes();

    // 登录相关事件
    document.getElementById("btnSendCode").addEventListener("click", sendCode);
    document.getElementById("btnLogin").addEventListener("click", login);

    // 套餐仅用于展示，不支持操作。如需订阅请扫描收款二维码付款，备注账号+套餐

    // 图片预览：点击遮罩关闭
    document
      .getElementById("imgPreview")
      .addEventListener("click", closePreview);

    // ESC 键关闭预览
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closePreview();
    });

    // 同步订阅状态
    document
      .getElementById("btnSync")
      .addEventListener("click", syncSubscription);

    // 退出登录
    document.getElementById("btnLogout").addEventListener("click", logout);
    document
      .getElementById("btnSavePrivacyConsent")
      .addEventListener("click", saveLoggedInPrivacyConsent);

    // 回车快速登录
    document.getElementById("loginCode").addEventListener("keydown", (e) => {
      if (e.key === "Enter") login();
    });
  });

  /**
   * 监听来自父窗口的消息
   * 当侧边栏主页面通知状态变化时，刷新数据
   */
  window.addEventListener("message", (event) => {
    if (event.data?.type === "STATUS_UPDATE") {
      // 状态变化时，如果已登录则刷新个人中心数据
      chrome.storage.local
        .get(AUTH_KEY)
        .then((result) => {
          const auth = result[AUTH_KEY] || {};
          if (auth.isLoggedIn) {
            loadProducts();
          }
        })
        .catch(() => {});
    }
  });

  // 页面可见性变化时刷新数据
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      // 页面重新可见时，检查并刷新
      chrome.storage.local
        .get(AUTH_KEY)
        .then((result) => {
          const auth = result[AUTH_KEY] || {};
          if (auth.isLoggedIn) {
            // 静默刷新（不显示 toast）
            loadProducts();
          }
        })
        .catch(() => {});
    }
  });
})();
