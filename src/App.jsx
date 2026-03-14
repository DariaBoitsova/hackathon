import React from "react";
import ReactDOM from "react-dom/client";

const { useEffect, useMemo, useRef, useState } = React;

const C = {
  bgStart: "#3D2B2B",
  bgEnd: "#1A3A2E",
  textLight: "#F0E6D5",
  darkGreen: "#1A3A2E",
  heroBg: "#D8EDE0",
  textDark: "#1A3A2E",
  cardBg: "#F5F0E8",
  textMuted: "#7A8A85",
  danger: "#B23B3B",
  warning: "#C97C3D",
  success: "#2D6A4F",
  dropdownBg: "#1e3d2e",
  onlineDot: "#5ef5a0",
  footerText: "#A0B0A8",
  border: "rgba(240,230,213,0.2)",
  overlay: "rgba(0,0,0,0.55)",
  white: "#FFFFFF",
  black: "#000000",
};

const API_CHAT_URL = "/api/chat";
const DEFAULT_MODEL = "openrouter/hunter-alpha";

const STORAGE_KEYS = {
  USERS: "chitayu_users",
  SESSION: "chitayu_session",
  HISTORY_PREFIX: "chitayu_history_",
};

function sanitizeAIResponse(text) {
  return String(text || "").replace(/```json|```/g, "").trim();
}

async function fetchWithRetry(url, options = {}, retries = 3, delayMs = 700) {
  let lastError = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, options);
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        const errorText = payload?.error?.message || `Ошибка: ${res.status}`;
        throw new Error(errorText);
      }
      return res;
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        if (error.message.includes("429")) {
          const wait = 2000;
          await new Promise(r => setTimeout(r, wait));
        } else {
          await new Promise(r => setTimeout(r, delayMs * (attempt + 1)));
        }
      }
    }
  }
  throw lastError || new Error("Ошибка после повторных попыток");
}

async function groqFetch(messages, config = {}) {
  const payload = {
    messages,
    model: config.model || DEFAULT_MODEL,
    temperature: config.temperature ?? 0.2,
    max_tokens: config.maxTokens ?? 2048,
  };
  const res = await fetchWithRetry(API_CHAT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

function Reveal({ children, delay = 0 }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setVisible(true);
        });
      },
      { threshold: 0.12 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(20px)",
        transition: `opacity 0.6s ease-out, transform 0.6s ease-out`,
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

const BoyReading = ({ size = 300, reading = false }) => (
  <svg width={size} height={size} viewBox="0 0 200 220" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label={reading ? "Мальчик читает кредитный договор" : "Мальчик изучает кредитный договор"}>
    <ellipse cx="100" cy="200" rx="45" ry="12" fill="#000" opacity="0.12"/>
    <rect x="84" y="162" width="13" height="36" rx="6.5" fill="#2C5F4A"/>
    <rect x="103" y="162" width="13" height="36" rx="6.5" fill="#2C5F4A"/>
    <rect x="72" y="108" width="56" height="60" rx="14" fill="#3D7A5E"/>
    {reading ? (
      <>
        <rect x="50" y="112" width="26" height="11" rx="5.5" fill="#2C5F4A" transform="rotate(12 50 112)"/>
        <rect x="124" y="112" width="26" height="11" rx="5.5" fill="#2C5F4A" transform="rotate(-12 150 112)"/>
        <rect x="62" y="130" width="76" height="50" rx="7" fill="#F5F0E8"/>
        <rect x="70" y="139" width="60" height="3" rx="1.5" fill="#1A3A2E" opacity="0.25"/>
        <rect x="70" y="147" width="44" height="3" rx="1.5" fill="#1A3A2E" opacity="0.25"/>
        <rect x="70" y="155" width="52" height="3" rx="1.5" fill="#B23B3B" opacity="0.45"/>
        <rect x="70" y="163" width="36" height="3" rx="1.5" fill="#1A3A2E" opacity="0.25"/>
      </>
    ) : (
      <>
        <rect x="52" y="122" width="24" height="11" rx="5.5" fill="#2C5F4A"/>
        <rect x="124" y="122" width="24" height="11" rx="5.5" fill="#2C5F4A"/>
        <rect x="60" y="112" width="80" height="58" rx="8" fill="#F5F0E8"/>
        <rect x="68" y="122" width="64" height="3" rx="1.5" fill="#1A3A2E" opacity="0.2"/>
        <rect x="68" y="130" width="48" height="3" rx="1.5" fill="#C97C3D" opacity="0.4"/>
        <rect x="68" y="138" width="56" height="3" rx="1.5" fill="#1A3A2E" opacity="0.2"/>
        <rect x="68" y="146" width="40" height="3" rx="1.5" fill="#B23B3B" opacity="0.35"/>
        <rect x="68" y="154" width="52" height="3" rx="1.5" fill="#1A3A2E" opacity="0.2"/>
      </>
    )}
    <rect x="91" y="90" width="18" height="20" rx="9" fill="#E8C9A0"/>
    <ellipse cx="100" cy="74" rx="28" ry="30" fill="#E8C9A0"/>
    <ellipse cx="100" cy="48" rx="29" ry="15" fill="#5C3D1E"/>
    <ellipse cx="75" cy="64" rx="8" ry="11" fill="#5C3D1E"/>
    <ellipse cx="125" cy="64" rx="8" ry="11" fill="#5C3D1E"/>
    <ellipse cx="89" cy="74" rx="5" ry={reading ? "3.5" : "5"} fill="#2C1A0E"/>
    <ellipse cx="111" cy="74" rx="5" ry={reading ? "3.5" : "5"} fill="#2C1A0E"/>
    <circle cx="91" cy="73" r="1.5" fill="white"/>
    <circle cx="113" cy="73" r="1.5" fill="white"/>
    <path d={reading ? "M92 84 Q100 87 108 84" : "M92 84 Q100 90 108 84"} stroke="#8B5A2B" strokeWidth="2" strokeLinecap="round" fill="none"/>
    {reading && (
      <>
        <circle cx="89" cy="74" r="7" stroke="#5C3D1E" strokeWidth="1.5" fill="none"/>
        <circle cx="111" cy="74" r="7" stroke="#5C3D1E" strokeWidth="1.5" fill="none"/>
        <line x1="96" y1="74" x2="104" y2="74" stroke="#5C3D1E" strokeWidth="1.5"/>
        <line x1="73" y1="73" x2="82" y2="74" stroke="#5C3D1E" strokeWidth="1.5"/>
        <line x1="118" y1="74" x2="127" y2="73" stroke="#5C3D1E" strokeWidth="1.5"/>
        <circle cx="40" cy="88" r="3" fill="#F0E6D5" opacity="0.5"/>
        <circle cx="160" cy="82" r="2" fill="#F0E6D5" opacity="0.45"/>
      </>
    )}
  </svg>
);

function loadStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function hashPassword(password) {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return String(hash);
}

function authRegister(email, password, name) {
  if (!email || !password || !name) return { ok: false, error: "Все поля обязательны" };
  if (!validateEmail(email)) return { ok: false, error: "Некорректный email" };
  if (password.length < 6) return { ok: false, error: "Пароль должен быть не менее 6 символов" };

  const users = loadStorage(STORAGE_KEYS.USERS, {});
  if (users[email]) return { ok: false, error: "Пользователь уже существует" };

  const user = {
    email,
    name: name.trim(),
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString(),
  };
  users[email] = user;
  saveStorage(STORAGE_KEYS.USERS, users);
  return { ok: true, user: { email, name } };
}

function authLogin(email, password) {
  if (!email || !password) return { ok: false, error: "Введите email и пароль" };
  const users = loadStorage(STORAGE_KEYS.USERS, {});
  const user = users[email];
  if (!user || user.passwordHash !== hashPassword(password)) {
    return { ok: false, error: "Неверный email или пароль" };
  }
  return { ok: true, user: { email, name: user.name } };
}

function saveSession(user) {
  saveStorage(STORAGE_KEYS.SESSION, user);
}

function clearSession() {
  localStorage.removeItem(STORAGE_KEYS.SESSION);
}

function getCurrentUser() {
  return loadStorage(STORAGE_KEYS.SESSION, null);
}

function getUserHistoryKey(email) {
  return STORAGE_KEYS.HISTORY_PREFIX + email;
}

function loadUserHistory(email) {
  if (!email) return [];
  return loadStorage(getUserHistoryKey(email), []);
}

function saveUserHistory(email, history) {
  if (!email) return;
  saveStorage(getUserHistoryKey(email), history);
}

async function extractTextFromImageWithOCR(file, onProgress) {
  const module = await import("https://cdn.jsdelivr.net/npm/tesseract.js@5.0.5/+esm");
  const Tesseract = module?.default || module;
  const result = await Tesseract.recognize(file, "eng+rus", {
    logger: m => {
      if (m.status === "recognizing text" && onProgress) {
        onProgress(m.progress);
      }
    }
  });
  return String(result?.data?.text || "").trim();
}

async function readFileAsText(file, onOcrProgress) {
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf")) {
    const module = await import("https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/+esm");
    const pdfjs = module?.default || module;
    pdfjs.GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js";
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const strings = content.items.map(item => item.str);
      fullText += strings.join(" ") + "\n";
    }
    if (fullText.split(/\s+/).length < 30) {
      return extractTextFromImageWithOCR(file, onOcrProgress);
    }
    return fullText.trim();
  }
  if (name.endsWith(".docx")) {
    const module = await import("https://cdn.jsdelivr.net/npm/mammoth@1.7.0/+esm");
    const mammoth = module?.default || module;
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value.trim();
  }
  if (file.type.startsWith("image/")) {
    return extractTextFromImageWithOCR(file, onOcrProgress);
  }
  return file.text();
}

function buildPrompt(text, mode = "analyze") {
  if (mode === "analyze") {
  return [
    {
      role: "system",
      content: `Ты — эксперт по финансовым договорам и защите прав потребителей. 
Твоя задача — анализировать кредитные договоры и объяснять их содержание простым языком без юридических терминов.

Отвечай ТОЛЬКО в формате JSON (без markdown, без \`\`\`json):
{
  "summary": "краткое резюме договора 2-3 предложения",
  "real_rate": "реальная полная стоимость кредита (ПСК) в % годовых если указана, иначе 'не указана'",
  "loan_amount": "сумма кредита",
  "term": "срок кредита",
  "monthly_payment": "ежемесячный платёж если указан",
  "hidden_fees": [
    { "name": "название комиссии/платежа", "amount": "сумма или %", "danger": "high|medium|low", "explanation": "объяснение простым языком" }
  ],
  "traps": [
    { "title": "название ловушки", "danger": "high|medium|low", "description": "что это значит для заёмщика простым языком" }
  ],
  "positive": [ "что хорошего в договоре" ],
  "verdict": "ОПАСНО|ОСТОРОЖНО|НОРМАЛЬНО",
  "verdict_reason": "почему такой вердикт, 1-2 предложения",
  "recommendations": [ "конкретная рекомендация заёмщику" ]
}`,
    },
    { role: "user", content: text.slice(0, 30000) }
  ];
}
  if (mode === "compare") {
  return [
    {
      role: "system",
      content: `Ты финансовый аналитик. Проанализируй несколько кредитных предложений, которые будут приведены ниже. Каждое предложение отделено разделителем "---". Для каждого предложения верни JSON-объект с подробными характеристиками. Итоговый ответ должен быть JSON-массивом объектов, где каждый объект соответствует одному предложению в том же порядке, в котором они приведены.

Формат объекта для каждого предложения:
{
  "name": "название предложения (если не указано, используй 'Предложение N')",
  "loan_amount": "сумма кредита",
  "term": "срок в месяцах",
  "real_rate": "ПСК или ставка в % годовых",
  "monthly_payment": "ежемесячный платёж",
  "total_overpayment": "общая переплата или 'не указана'",
  "hidden_fees_count": число (количество скрытых комиссий),
  "hidden_fees_total": "общая сумма скрытых комиссий или описание",
  "hidden_fees": [{ "name": "название", "amount": "сумма или %", "danger": "high|medium|low" }],
  "traps_count": число,
  "biggest_trap": "самая опасная ловушка одним предложением или 'нет критичных'",
  "verdict": "ОПАСНО|ОСТОРОЖНО|НОРМАЛЬНО",
  "verdict_reason": "почему такой вердикт, 1-2 предложения",
  "score": число от 1 до 10,
  "recommendation": "брать или не брать — коротко и честно одним предложением"
}

Только JSON, без пояснений.`,
    },
    { role: "user", content: text.slice(0, 30000) }
  ];
}
  return [];
}

function parseJSONSafe(raw) {
    if (!raw) return null;
    let cleaned = raw.replace(/```json|```/g, '').trim();
    // Пытаемся найти JSON объект или массив в строке
    const firstObj = cleaned.indexOf('{');
    const lastObj = cleaned.lastIndexOf('}');
    const firstArr = cleaned.indexOf('[');
    const lastArr = cleaned.lastIndexOf(']');

    if (firstObj !== -1 && lastObj > firstObj) {
        const candidate = cleaned.substring(firstObj, lastObj + 1);
        try {
            return JSON.parse(candidate);
        } catch (e) { }
    }
    if (firstArr !== -1 && lastArr > firstArr) {
        const candidate = cleaned.substring(firstArr, lastArr + 1);
        try {
            return JSON.parse(candidate);
        } catch (e) { }
    }
    try {
        return JSON.parse(cleaned);
    } catch {
        return null;
    }
}

function AuthModal({ isOpen, onClose, onLogin }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const reset = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setName("");
    setError("");
    setShowPassword(false);
    setShowConfirm(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    if (mode === "login") {
      const result = authLogin(email, password);
      if (result.ok) {
        saveSession(result.user);
        onLogin(result.user);
        reset();
        onClose();
      } else {
        setError(result.error);
      }
    } else {
      if (password !== confirmPassword) {
        setError("Пароли не совпадают");
        return;
      }
      const result = authRegister(email, password, name);
      if (result.ok) {
        saveSession(result.user);
        onLogin(result.user);
        reset();
        onClose();
      } else {
        setError(result.error);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, background: C.overlay,
      backdropFilter: "blur(6px)", zIndex: 500,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 16, animation: "fadeInUp 0.3s ease-out"
    }}>
      <div style={{
        background: C.cardBg, borderRadius: 28, padding: 40,
        maxWidth: 420, width: "100%", boxShadow: "0 20px 40px rgba(0,0,0,0.4)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: C.darkGreen, margin: 0 }}>
            {mode === "login" ? "Вход" : "Регистрация"}
          </h2>
          <button onClick={() => { reset(); onClose(); }} style={{
            width: 32, height: 32, borderRadius: "50%", border: "none",
            background: "rgba(26,58,46,0.1)", color: C.darkGreen,
            fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
          }}>✕</button>
        </div>
        <div style={{ display: "flex", background: "rgba(26,58,46,0.07)", borderRadius: 12, padding: 4, marginBottom: 24 }}>
          <button onClick={() => setMode("login")} style={{
            flex: 1, padding: "10px 0", border: "none", borderRadius: 12,
            background: mode === "login" ? C.white : "transparent",
            fontWeight: 600, color: C.darkGreen, cursor: "pointer",
            boxShadow: mode === "login" ? "0 2px 8px rgba(0,0,0,0.05)" : "none"
          }}>Войти</button>
          <button onClick={() => setMode("register")} style={{
            flex: 1, padding: "10px 0", border: "none", borderRadius: 12,
            background: mode === "register" ? C.white : "transparent",
            fontWeight: 600, color: C.darkGreen, cursor: "pointer",
            boxShadow: mode === "register" ? "0 2px 8px rgba(0,0,0,0.05)" : "none"
          }}>Регистрация</button>
        </div>
        <form onSubmit={handleSubmit}>
          {mode === "register" && (
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 14, color: C.textMuted, marginBottom: 6 }}>Имя</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                style={{
                  width: "100%", padding: "12px 16px", borderRadius: 12,
                  border: `1px solid rgba(26,58,46,0.2)`, fontSize: 16,
                  outline: "none", boxSizing: "border-box"
                }}
                required
              />
            </div>
          )}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 14, color: C.textMuted, marginBottom: 6 }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{
                width: "100%", padding: "12px 16px", borderRadius: 12,
                border: `1px solid rgba(26,58,46,0.2)`, fontSize: 16,
                outline: "none", boxSizing: "border-box"
              }}
              required
            />
          </div>
          <div style={{ marginBottom: mode === "register" ? 20 : 24, position: "relative" }}>
            <label style={{ display: "block", fontSize: 14, color: C.textMuted, marginBottom: 6 }}>Пароль</label>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{
                width: "100%", padding: "12px 16px", borderRadius: 12,
                border: `1px solid rgba(26,58,46,0.2)`, fontSize: 16,
                outline: "none", boxSizing: "border-box", paddingRight: 40
              }}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute", right: 12, top: 38, background: "none",
                border: "none", fontSize: 14, color: C.textMuted, cursor: "pointer"
              }}
            >{showPassword ? "👁" : "👁‍🗨"}</button>
          </div>
          {mode === "register" && (
            <div style={{ marginBottom: 24, position: "relative" }}>
              <label style={{ display: "block", fontSize: 14, color: C.textMuted, marginBottom: 6 }}>Повторите пароль</label>
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                style={{
                  width: "100%", padding: "12px 16px", borderRadius: 12,
                  border: `1px solid rgba(26,58,46,0.2)`, fontSize: 16,
                  outline: "none", boxSizing: "border-box", paddingRight: 40
                }}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                style={{
                  position: "absolute", right: 12, top: 38, background: "none",
                  border: "none", fontSize: 14, color: C.textMuted, cursor: "pointer"
                }}
              >{showConfirm ? "👁" : "👁‍🗨"}</button>
            </div>
          )}
          {error && (
            <div style={{
              background: "#B23B3B15", border: "1px solid #B23B3B40",
              borderRadius: 10, padding: "10px 12px", fontSize: 13,
              color: C.danger, marginBottom: 20
            }}>
              {error}
            </div>
          )}
          <button
            type="submit"
            style={{
              width: "100%", height: 52, borderRadius: 40, border: "none",
              background: C.darkGreen, color: C.textLight, fontSize: 16,
              fontWeight: 700, cursor: "pointer", transition: "opacity 0.2s"
            }}
          >
            {mode === "login" ? "Войти" : "Зарегистрироваться"}
          </button>
        </form>
        <div style={{ textAlign: "center", marginTop: 20, fontSize: 14, color: C.textMuted }}>
          {mode === "login" ? "Нет аккаунта? " : "Уже есть аккаунт? "}
          <button
            onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
            style={{ background: "none", border: "none", color: C.darkGreen, fontWeight: 600, cursor: "pointer" }}
          >
            {mode === "login" ? "Зарегистрируйтесь" : "Войдите"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Navbar({ user, onLogout, onAuthClick, historyCount }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <Reveal>
      <div style={{
        position: "sticky", top: 0, zIndex: 100,
        height: 80, background: "rgba(26,58,46,0.88)",
        backdropFilter: "blur(14px)", borderBottom: `1px solid ${C.border}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 32px"
      }}>
        <div style={{ fontSize: 24, fontWeight: 600, color: C.textLight, letterSpacing: "-0.5px" }}>
          Читаю за тебя
        </div>
        <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
          {historyCount > 0 && (
            <div style={{ position: "relative" }} ref={dropdownRef}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                style={{
                  background: "rgba(255,255,255,0.08)", border: `1px solid ${C.border}`,
                  borderRadius: 10, padding: "8px 12px", color: C.textLight,
                  fontSize: 13, display: "flex", alignItems: "center", gap: 6,
                  cursor: "pointer"
                }}
              >
                <span>📋</span> История ({historyCount})
              </button>
              {showDropdown && (
                <div style={{
                  position: "absolute", top: "100%", right: 0, marginTop: 8,
                  width: 320, background: C.dropdownBg, borderRadius: 16,
                  boxShadow: "0 20px 40px rgba(0,0,0,0.4)", padding: 12,
                  border: `1px solid ${C.border}`
                }}>
                  <div style={{ color: C.textLight, fontSize: 14, marginBottom: 8 }}>
                    Последние записи
                  </div>
                  {/* Здесь будет динамический список, но пока заглушка */}
                  <div style={{ color: C.textMuted, fontSize: 13, padding: "8px 0" }}>
                    Скоро тут появятся ваши анализы
                  </div>
                </div>
              )}
            </div>
          )}
          {!user ? (
            <>
              <button
                onClick={() => onAuthClick("login")}
                style={{
                  background: "none", border: "none", color: C.textLight,
                  fontSize: 16, cursor: "pointer", padding: "8px 0"
                }}
              >Войти</button>
              <button
                onClick={() => onAuthClick("register")}
                style={{
                  background: C.textLight, border: "none", borderRadius: 40,
                  padding: "8px 24px", color: C.darkGreen, fontSize: 14,
                  fontWeight: 700, cursor: "pointer"
                }}
              >Регистрация</button>
            </>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 30, height: 30, borderRadius: "50%",
                background: C.success, color: C.white,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, fontWeight: 700
              }}>{user.name.charAt(0).toUpperCase()}</div>
              <span style={{ color: C.textLight, fontSize: 14 }}>{user.name}</span>
              <button
                onClick={onLogout}
                style={{
                  background: "none", border: "none", color: C.textMuted,
                  fontSize: 13, cursor: "pointer", opacity: 0.7,
                  transition: "opacity 0.2s", padding: "4px 8px"
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = 1}
                onMouseLeave={e => e.currentTarget.style.opacity = 0.7}
              >Выйти</button>
            </div>
          )}
        </div>
      </div>
    </Reveal>
  );
}

function Hero() {
  return (
    <Reveal>
      <div style={{
        minHeight: "calc(100vh - 80px)",
        display: "grid", gridTemplateColumns: "60% 40%", gap: 48,
        padding: "60px 20px", alignItems: "center"
      }}>
        <div style={{
          background: C.heroBg, borderRadius: 24, padding: 48,
          opacity: 0.94
        }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(26,58,46,0.1)", borderRadius: 99,
            padding: "8px 16px", marginBottom: 24
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.success }}></span>
            <span style={{ fontSize: 13, color: C.darkGreen }}>AI-анализ за секунды</span>
          </div>
          <h1 style={{
            fontSize: 48, fontWeight: 700, color: C.darkGreen,
            lineHeight: 1.15, letterSpacing: "-1.2px", margin: "0 0 24px"
          }}>
            Разберитесь в кредитном договоре <br />с помощью ИИ
          </h1>
          <p style={{
            fontSize: 20, color: C.darkGreen, opacity: 0.8,
            lineHeight: 1.6, marginBottom: 32
          }}>
            Загрузите договор, и нейросеть укажет на скрытые комиссии, ловушки и риски.
          </p>
          <div style={{ display: "flex", gap: 16 }}>
            <button style={{
              background: C.darkGreen, color: C.textLight,
              border: "none", borderRadius: 40, padding: "16px 32px",
              fontSize: 16, fontWeight: 700, cursor: "pointer",
              transition: "transform 0.2s, box-shadow 0.2s",
              boxShadow: "0 4px 12px rgba(0,0,0,0.2)"
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.3)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)"; }}
            >Загрузить договор</button>
            <button style={{
              background: "transparent", border: `1.5px solid ${C.darkGreen}`,
              borderRadius: 40, padding: "16px 32px", fontSize: 16,
              fontWeight: 500, color: C.darkGreen, cursor: "pointer",
              opacity: 0.75, transition: "background 0.2s"
            }}
              onMouseEnter={e => { e.currentTarget.style.background = C.darkGreen; e.currentTarget.style.color = C.textLight; e.currentTarget.style.opacity = 1; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.darkGreen; e.currentTarget.style.opacity = 0.75; }}
            >Задать вопрос ассистенту</button>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <BoyReading reading={false} size={280} />
        </div>
      </div>
    </Reveal>
  );
}

function FileUpload({ onFileSelect, onTextChange, text, error, analyzing }) {
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      setFileName(file.name);
      onFileSelect(file);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFileName(file.name);
      onFileSelect(file);
    }
  };

  const clearFile = () => {
    setFileName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div style={{
      maxWidth: 600, margin: "0 auto", background: C.cardBg,
      borderRadius: 24, padding: 32, boxShadow: "0 20px 30px rgba(0,0,0,0.22)"
    }}>
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${dragActive ? C.darkGreen : C.darkGreen}`,
          borderRadius: 16, padding: "44px 20px", textAlign: "center",
          background: dragActive ? "rgba(26,58,46,0.06)" : "transparent",
          transition: "background 0.2s, border-style 0.2s",
          borderStyle: dragActive ? "solid" : "dashed",
          marginBottom: fileName ? 16 : 0
        }}
      >
        <div style={{ fontSize: 38, marginBottom: 12 }}>📄</div>
        <div style={{ fontSize: 16, color: C.textMuted, marginBottom: 16 }}>
          Перетащите файл сюда или <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              background: "none", border: "none", color: C.darkGreen,
              fontWeight: 600, textDecoration: "underline", cursor: "pointer"
            }}
          >выберите</button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.txt,image/*"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
        <div style={{ fontSize: 13, color: C.textMuted }}>PDF · DOCX · TXT · изображения</div>
      </div>

      {fileName && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "rgba(26,58,46,0.07)", borderRadius: 12,
          padding: "14px 18px", marginTop: 16
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 16 }}>📎</span>
            <span style={{ fontWeight: 700, color: C.darkGreen }}>{fileName}</span>
          </div>
          <button onClick={clearFile} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: C.textMuted }}>✕</button>
        </div>
      )}

      {!fileName && (
        <>
          <div style={{ textAlign: "center", fontSize: 14, color: C.textMuted, margin: "16px 0 8px" }}>или вставьте текст напрямую</div>
          <textarea
            value={text}
            onChange={e => onTextChange(e.target.value)}
            placeholder="Вставьте текст договора сюда..."
            rows={6}
            disabled={analyzing}
            style={{
              width: "100%", padding: 12, borderRadius: 12,
              border: `1.5px solid rgba(26,58,46,0.18)`, fontSize: 14,
              background: "rgba(26,58,46,0.04)", color: C.darkGreen,
              resize: "vertical", outline: "none", boxSizing: "border-box"
            }}
          />
        </>
      )}

      {error && (
        <div style={{
          background: "#B23B3B12", border: "1px solid #B23B3B35",
          borderRadius: 10, padding: "10px 12px", fontSize: 13,
          color: C.danger, marginTop: 16
        }}>
          {error}
        </div>
      )}
    </div>
  );
}

function LoadingScreen({ isOcr, ocrProgress, pageInfo }) {
  return (
    <div style={{ textAlign: "center", padding: "20px 20px 80px", animation: "fadeInUp 0.4s" }}>
      <BoyReading reading={true} size={170} />
      <h2 style={{ fontSize: isOcr ? 28 : 32, fontWeight: 700, color: C.textLight, marginBottom: 12 }}>
        {isOcr ? "Распознаю текст (OCR)..." : "Читаю договор..."}
      </h2>
      {isOcr && pageInfo && (
        <p style={{ fontSize: 15, color: C.textMuted, marginBottom: 16 }}>{pageInfo}</p>
      )}
      {isOcr ? (
        <div style={{ maxWidth: 260, margin: "0 auto", background: "rgba(255,255,255,0.12)", borderRadius: 10, height: 6 }}>
          <div style={{ width: `${ocrProgress * 100}%`, background: C.textLight, height: 6, borderRadius: 10, transition: "width 0.2s" }} />
        </div>
      ) : (
        <div style={{ width: 48, height: 48, border: "3px solid rgba(255,255,255,0.2)", borderTopColor: C.textLight, borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto" }} />
      )}
    </div>
  );
}

function VerdictCard({ analysis, onToggleDetails, showDetails, onDownloadPdf }) {
  const getColor = () => {
    if (analysis.verdict === "ОПАСНО") return C.danger;
    if (analysis.verdict === "ОСТОРОЖНО") return C.warning;
    return C.success;
  };

  return (
    <div style={{
      background: getColor(),
      borderRadius: 24, padding: "36px 40px",
      backgroundImage: "radial-gradient(circle at 15% 60%, rgba(255,255,255,0.12), transparent 55%)",
      marginBottom: 16
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
        <span style={{ width: 16, height: 16, borderRadius: "50%", background: "rgba(0,0,0,0.25)" }} />
        <span style={{ fontSize: 40, fontWeight: 700, color: C.white }}>{analysis.verdict}</span>
      </div>
      <p style={{ fontSize: 20, color: C.white, opacity: 0.9, marginBottom: 24 }}>{analysis.verdict_reason}</p>
      <div style={{ display: "flex", gap: 16 }}>
        <button
          onClick={onToggleDetails}
          style={{
            background: "transparent", border: `1px solid rgba(240,230,213,0.55)`,
            borderRadius: 40, padding: "12px 24px", color: C.white,
            fontSize: 15, fontWeight: 500, cursor: "pointer"
          }}
          onMouseEnter={e => { e.currentTarget.style.background = C.textLight; e.currentTarget.style.color = C.darkGreen; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.white; }}
        >
          {showDetails ? "Скрыть подробности" : "Показать подробности"}
        </button>
        <button
          onClick={onDownloadPdf}
          style={{
            background: "rgba(255,255,255,0.12)", border: `1px solid rgba(240,230,213,0.3)`,
            borderRadius: 40, padding: "12px 24px", color: C.white,
            fontSize: 15, fontWeight: 500, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 8
          }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.2)"}
          onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.12)"}
        >
          <span>📥</span> Скачать PDF
        </button>
      </div>
    </div>
  );
}

function AccordionDetails({ analysis }) {
  const DANGER_MAP = {
    high: { color: C.danger, label: "Опасно" },
    medium: { color: C.warning, label: "Внимание" },
    low: { color: C.success, label: "Ок" },
  };

  return (
    <div style={{ maxHeight: 6000, overflow: "hidden", transition: "max-height 0.45s ease-in-out" }}>
      <div style={{ background: C.cardBg, borderRadius: 24, padding: 36, marginTop: 16 }}>
        <h3 style={{ fontSize: 22, fontWeight: 700, color: C.darkGreen, marginBottom: 24 }}>Параметры кредита</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
          {[
            { label: "Сумма кредита", value: analysis.loan_amount },
            { label: "Срок (мес)", value: analysis.term },
            { label: "Реальная ставка", value: analysis.real_rate },
            { label: "Платёж в месяц", value: analysis.monthly_payment },
          ].map((item, i) => (
            <div key={i} style={{ background: C.white, borderRadius: 16, padding: 20, boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}>
              <div style={{ fontSize: 14, color: C.textMuted, marginBottom: 8 }}>{item.label}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: C.darkGreen }}>{item.value ?? "—"}</div>
            </div>
          ))}
        </div>

        <p style={{ fontSize: 15, color: C.textMuted, lineHeight: 1.7, marginBottom: 28 }}>{analysis.summary}</p>

        {analysis.hidden_fees?.length > 0 && (
          <>
            <div style={{ height: 1, background: "rgba(26,58,46,0.1)", margin: "28px 0" }} />
            <h3 style={{ fontSize: 22, fontWeight: 700, color: C.darkGreen, marginBottom: 16 }}>Скрытые комиссии</h3>
            {analysis.hidden_fees.map((fee, idx) => (
              <div key={idx} style={{ display: "flex", gap: 16, padding: "14px 0", borderBottom: idx < analysis.hidden_fees.length - 1 ? "1px solid rgba(26,58,46,0.08)" : "none" }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: DANGER_MAP[fee.danger]?.color || C.textMuted, flexShrink: 0, marginTop: 6 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 16, fontWeight: 500, color: C.darkGreen }}>{fee.name}</span>
                    <span style={{ fontSize: 16, fontWeight: 700, color: C.darkGreen }}>{fee.amount}</span>
                  </div>
                  {fee.explanation && <p style={{ fontSize: 14, color: C.textMuted, lineHeight: 1.55 }}>{fee.explanation}</p>}
                </div>
              </div>
            ))}
          </>
        )}

        {analysis.traps?.length > 0 && (
          <>
            <div style={{ height: 1, background: "rgba(26,58,46,0.1)", margin: "28px 0" }} />
            <h3 style={{ fontSize: 22, fontWeight: 700, color: C.darkGreen, marginBottom: 16 }}>Ловушки в договоре</h3>
            {analysis.traps.map((trap, idx) => (
              <div key={idx} style={{ display: "flex", gap: 16, padding: "14px 0", borderBottom: idx < analysis.traps.length - 1 ? "1px solid rgba(26,58,46,0.08)" : "none" }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: DANGER_MAP[trap.danger]?.color || C.textMuted, flexShrink: 0, marginTop: 6 }} />
                <div>
                  <div style={{ fontSize: 16, fontWeight: 500, color: C.darkGreen, marginBottom: 5 }}>{trap.title}</div>
                  <p style={{ fontSize: 14, color: C.textMuted, lineHeight: 1.55 }}>{trap.description}</p>
                </div>
              </div>
            ))}
          </>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 28 }}>
          {analysis.positive?.length > 0 && (
            <div style={{ background: C.cardBg, borderRadius: 20, padding: 28 }}>
              <h4 style={{ fontSize: 18, fontWeight: 700, color: C.success, marginBottom: 16 }}>Что хорошего</h4>
              {analysis.positive.map((item, idx) => (
                <div key={idx} style={{ display: "flex", gap: 8, marginBottom: 12, fontSize: 15, color: C.textMuted }}>
                  <span style={{ color: C.success }}>✓</span> {item}
                </div>
              ))}
            </div>
          )}
          {analysis.recommendations?.length > 0 && (
            <div style={{ background: C.cardBg, borderRadius: 20, padding: 28 }}>
              <h4 style={{ fontSize: 18, fontWeight: 700, color: C.danger, marginBottom: 16 }}>На что обратить внимание</h4>
              {analysis.recommendations.map((item, idx) => (
                <div key={idx} style={{ display: "flex", gap: 8, marginBottom: 12, fontSize: 15, color: C.textMuted }}>
                  <span style={{ color: C.danger }}>!</span> {item}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ marginTop: 32, background: "rgba(240,230,213,0.07)", border: `1px solid ${C.border}`, borderRadius: 20, padding: "24px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.textLight }}>Остались вопросы?</div>
            <div style={{ fontSize: 14, opacity: 0.6, color: C.textLight }}>Спросите у ассистента</div>
          </div>
          <button style={{ background: C.textLight, border: "none", borderRadius: 40, padding: "12px 24px", color: C.darkGreen, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Спросить ассистента</button>
        </div>
      </div>
    </div>
  );
}

function ComparisonSection() {
    const [offers, setOffers] = useState([{ id: 1, name: "Предложение 1", file: null, text: "", analyzing: false, result: null }]);
    const [compareResults, setCompareResults] = useState(null);
    const [loadingCompare, setLoadingCompare] = useState(false);
    const [compareError, setCompareError] = useState("");

    const addOffer = () => {
        if (offers.length < 4) {
            setOffers([...offers, { id: offers.length + 1, name: `Предложение ${offers.length + 1}`, file: null, text: "", analyzing: false, result: null }]);
        }
    };

    const updateOffer = (id, data) => {
        setOffers(prev => prev.map(o => o.id === id ? { ...o, ...data } : o));
    };

    const removeOffer = (id) => {
        if (offers.length > 1) {
            setOffers(prev => prev.filter(o => o.id !== id));
        }
    };

    const analyzeOffer = async (offer) => {
        if (!offer.text && !offer.file) return;
        updateOffer(offer.id, { analyzing: true });
        try {
            const text = offer.file ? await readFileAsText(offer.file) : offer.text;
            const prompt = buildPrompt(text, "analyze");
            const ai = await groqFetch(prompt, { maxTokens: 1500 });
            const parsed = parseJSONSafe(ai?.choices?.[0]?.message?.content || "");
            updateOffer(offer.id, { result: parsed, analyzing: false });
        } catch {
            updateOffer(offer.id, { analyzing: false });
        }
    };

    const handleCompare = async () => {
        const validOffers = offers.filter(o => o.text || o.file);
        if (validOffers.length < 2) return;
        setLoadingCompare(true);
        setCompareError("");
        setCompareResults(null);
        try {
            const texts = await Promise.all(validOffers.map(async o => {
                if (o.file) return readFileAsText(o.file);
                return o.text;
            }));
            const combined = texts.map((t, i) => `Предложение ${i + 1}:\n${t}`).join("\n\n---\n\n");
            const prompt = buildPrompt(combined, "compare");
            const ai = await groqFetch(prompt, { maxTokens: 4000 });
            const content = ai?.choices?.[0]?.message?.content || "";
            console.log("Raw compare response:", content);
            const parsed = parseJSONSafe(content);
            console.log("Parsed compare response:", parsed);

            let resultsArray = null;
            if (parsed && Array.isArray(parsed)) {
                resultsArray = parsed;
                const mappedResults = resultsArray.map(item => ({
                  amount: item.loan_amount,
                  term: item.term,
                  rate: item.real_rate,
                  monthlyPayment: item.monthly_payment,
                  hiddenFeesTotal: item.hidden_fees_total,
                  verdict: item.verdict,
                  score: item.score,
                  summary: item.verdict_reason
                }));

                // Далее используем mappedResults вместо resultsArray
                const resultsWithIds = offers.map(offer => {
                    const idx = validOffers.findIndex(o => o.id === offer.id);
                    return idx >= 0 ? mappedResults[idx] : null;
                });
                setCompareResults(resultsWithIds);
            } else if (parsed && parsed.results && Array.isArray(parsed.results)) {
                resultsArray = parsed.results;
            } else {
                throw new Error("Не удалось распознать ответ от ИИ");
            }

            if (resultsArray.length !== validOffers.length) {
                console.warn(`Expected ${validOffers.length} results, got ${resultsArray.length}`);
                if (resultsArray.length < validOffers.length) {
                    resultsArray = [...resultsArray, ...Array(validOffers.length - resultsArray.length).fill(null)];
                } else {
                    resultsArray = resultsArray.slice(0, validOffers.length);
                }
            }

            const resultsWithIds = offers.map(offer => {
                const idx = validOffers.findIndex(o => o.id === offer.id);
                return idx >= 0 ? resultsArray[idx] : null;
            });
            setCompareResults(resultsWithIds);
        } catch (e) {
            console.error(e);
            setCompareError(e.message || "Ошибка при сравнении");
        } finally {
            setLoadingCompare(false);
        }
    };

    return (
        <Reveal>
            <div style={{ padding: "80px 20px" }}>
                <h2 style={{ fontSize: 32, fontWeight: 700, color: C.textLight, marginBottom: 8 }}>Сравнение предложений</h2>
                <p style={{ fontSize: 16, color: C.textMuted, marginBottom: 32 }}>Загрузите до 4 договоров для сравнения</p>

                <div style={{ display: "grid", gridTemplateColumns: `repeat(${offers.length}, 1fr)`, gap: 16 }}>
                    {offers.map((offer) => (
                        <div key={offer.id} style={{
                            background: "rgba(255,255,255,0.07)", border: `1px solid ${C.border}`,
                            borderRadius: 20, padding: 20
                        }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                                <input
                                    type="text"
                                    value={offer.name}
                                    onChange={(e) => updateOffer(offer.id, { name: e.target.value })}
                                    style={{
                                        background: "transparent", border: "none", color: C.textLight,
                                        fontSize: 14, fontWeight: 700, outline: "none", width: "70%"
                                    }}
                                />
                                {offers.length > 1 && (
                                    <button onClick={() => removeOffer(offer.id)} style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", fontSize: 18 }}>✕</button>
                                )}
                            </div>

                            <div
                                style={{
                                    border: "1.5px dashed rgba(255,255,255,0.25)", borderRadius: 12,
                                    padding: "28px 12px", textAlign: "center", cursor: "pointer",
                                    transition: "border-color 0.2s"
                                }}
                                onClick={() => document.getElementById(`file-${offer.id}`).click()}
                                onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.5)"}
                                onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)"}
                            >
                                <div style={{ fontSize: 24, marginBottom: 8 }}>📎</div>
                                <div style={{ fontSize: 12, color: C.textMuted }}>Выбрать файл</div>
                                <input
                                    id={`file-${offer.id}`}
                                    type="file"
                                    accept=".pdf,.docx,.txt,image/*"
                                    style={{ display: "none" }}
                                    onChange={(e) => {
                                        const file = e.target.files[0];
                                        if (file) updateOffer(offer.id, { file, text: "" });
                                    }}
                                />
                            </div>

                            {offer.file && (
                                <div style={{
                                    display: "flex", alignItems: "center", justifyContent: "space-between",
                                    background: "rgba(255,255,255,0.1)", borderRadius: 8,
                                    padding: "8px 12px", marginTop: 8
                                }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6, overflow: "hidden" }}>
                                        <span style={{ fontSize: 14 }}>📎</span>
                                        <span style={{ fontSize: 13, color: C.textLight, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 140 }}>
                                            {offer.file.name}
                                        </span>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            updateOffer(offer.id, { file: null, text: "" });
                                        }}
                                        style={{
                                            background: "none", border: "none", color: C.textMuted,
                                            fontSize: 16, cursor: "pointer", padding: "0 4px"
                                        }}
                                        title="Удалить файл"
                                    >✕</button>
                                </div>
                            )}

                            <textarea
                                value={offer.text}
                                onChange={(e) => updateOffer(offer.id, { text: e.target.value, file: null })}
                                placeholder="Или вставьте текст"
                                rows={4}
                                style={{
                                    width: "100%", marginTop: 12, padding: 8,
                                    background: "rgba(255,255,255,0.06)", border: `1px solid rgba(255,255,255,0.15)`,
                                    borderRadius: 10, color: C.textLight, fontSize: 12,
                                    resize: "vertical", outline: "none"
                                }}
                            />

                            {offer.analyzing && (
                                <div style={{ marginTop: 12, fontSize: 14, color: C.textMuted, display: "flex", alignItems: "center", gap: 8 }}>
                                    <div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.2)", borderTopColor: C.textLight, borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                                    Анализ...
                                </div>
                            )}

                            {offer.result && (
                                <div style={{ marginTop: 12, fontSize: 13, color: C.textLight }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: offer.result.verdict === "ОПАСНО" ? C.danger : offer.result.verdict === "ОСТОРОЖНО" ? C.warning : C.success }} />
                                        {offer.result.verdict} (оценка {offer.result.score ?? "?"})
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}

                    {offers.length < 4 && (
                        <button
                            onClick={addOffer}
                            style={{
                                border: `2px dashed ${C.border}`, background: "rgba(255,255,255,0.05)",
                                borderRadius: 20, minHeight: 120, display: "flex", alignItems: "center",
                                justifyContent: "center", fontSize: 24, color: C.textMuted,
                                cursor: "pointer", transition: "opacity 0.2s", borderStyle: "dashed"
                            }}
                            onMouseEnter={e => { e.currentTarget.style.opacity = 0.85; e.currentTarget.style.borderColor = C.textLight; }}
                            onMouseLeave={e => { e.currentTarget.style.opacity = 0.5; e.currentTarget.style.borderColor = C.border; }}
                        >
                            +
                        </button>
                    )}
                </div>

                {offers.filter(o => o.text || o.file).length >= 2 && (
                    <div style={{ textAlign: "center", marginTop: 32 }}>
                        <button
                            onClick={handleCompare}
                            disabled={loadingCompare}
                            style={{
                                background: loadingCompare ? "rgba(240,230,213,0.2)" : C.textLight,
                                border: "none", borderRadius: 40, padding: "16px 40px",
                                fontSize: 16, fontWeight: 700, color: loadingCompare ? C.textMuted : C.darkGreen,
                                cursor: loadingCompare ? "default" : "pointer"
                            }}
                        >
                            {loadingCompare ? "Сравниваем..." : "Сравнить"}
                        </button>
                    </div>
                )}

                {compareError && (
                    <div style={{ textAlign: "center", marginTop: 16, color: C.danger }}>
                        {compareError}
                    </div>
                )}

                {compareResults && (
                    <div style={{ marginTop: 48, background: C.cardBg, borderRadius: 20, padding: 32 }}>
                        <h3 style={{ fontSize: 24, fontWeight: 700, color: C.darkGreen, marginBottom: 24 }}>Результаты сравнения</h3>
                        <div style={{ display: "grid", gridTemplateColumns: `repeat(${offers.length}, 1fr)`, gap: 16, marginBottom: 32 }}>
                            {offers.map((offer, idx) => {
                                const res = compareResults[idx];
                                if (!res) return null;
                                const allScores = compareResults.filter(r => r).map(r => r.score);
                                const isBest = res.score === Math.max(...allScores);
                                return (
                                    <div key={offer.id} style={{
                                        background: isBest ? "rgba(45,106,79,0.3)" : "rgba(255,255,255,0.06)",
                                        border: isBest ? `2px solid ${C.success}` : `1px solid ${C.border}`,
                                        borderRadius: 16, padding: 20, position: "relative"
                                    }}>
                                        {isBest && <span style={{ position: "absolute", top: -10, right: 10, background: C.success, color: C.white, fontSize: 12, fontWeight: 700, padding: "4px 8px", borderRadius: 20 }}>🏆 Лучшее</span>}
                                        <div style={{ fontSize: 20, fontWeight: 700, color: C.darkGreen, marginBottom: 8 }}>{offer.name}</div>
                                        <div style={{ fontSize: 28, fontWeight: 700, color: C.darkGreen, marginBottom: 8 }}>{res.score}</div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: res.verdict === "ОПАСНО" ? C.danger : res.verdict === "ОСТОРОЖНО" ? C.warning : C.success }} />
                                            <span style={{ fontSize: 13, color: C.darkGreen }}>{res.verdict}</span>
                                        </div>
                                        <div style={{ fontSize: 13, color: C.textMuted }}>{res.summary}</div>
                                    </div>
                                );
                            })}
                        </div>

                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                            <thead>
                                <tr style={{ background: "rgba(26,58,46,0.05)" }}>
                                    <th style={{ padding: 12, textAlign: "left", color: C.textMuted, fontWeight: 600 }}>Параметр</th>
                                    {offers.map(o => <th key={o.id} style={{ padding: 12, textAlign: "left", color: C.darkGreen }}>{o.name}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {["amount", "term", "rate", "monthlyPayment", "hiddenFeesTotal"].map((field, idx) => (
                                    <tr key={field} style={{ background: idx % 2 === 0 ? "rgba(26,58,46,0.02)" : "transparent" }}>
                                        <td style={{ padding: 12, fontWeight: 600, color: C.darkGreen }}>
                                            {field === "amount" ? "Сумма" : field === "term" ? "Срок" : field === "rate" ? "Ставка" : field === "monthlyPayment" ? "Платёж" : "Скрытые комиссии"}
                                        </td>
                                        {offers.map((o, i) => {
                                            const val = compareResults[i]?.[field];
                                            return <td key={o.id} style={{ padding: 12, color: C.darkGreen }}>{val ?? "—"}</td>;
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </Reveal>
    );
}
function ChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Здравствуйте! Я помогу разобраться с кредитным договором. Что вас интересует?" }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const suggestions = ["Какие риски в этом договоре?", "Что такое скрытые комиссии?", "На что обратить внимание в первую очередь?", "Сравните с другим предложением"];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = { role: "user", content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);
    try {
      const context = ""; // можно добавить контекст текущего анализа
      const ai = await groqFetch([
        { role: "system", content: "Ты дружелюбный финансовый консультант. Отвечай кратко, по делу, без юридических советов. На русском." },
        { role: "user", content: context + "\n\n" + input }
      ], { maxTokens: 800 });
      const answer = ai?.choices?.[0]?.message?.content || "Извините, не могу ответить сейчас.";
      setMessages(prev => [...prev, { role: "assistant", content: answer }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: "assistant", content: "Ошибка связи. Попробуйте позже." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {isOpen && (
        <div style={{
          position: "fixed", bottom: 104, right: 32,
          width: 360, height: 520, background: C.cardBg,
          borderRadius: 20, boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
          zIndex: 200, display: "flex", flexDirection: "column"
        }}>
          <div style={{
            background: C.darkGreen, padding: "16px 20px",
            borderTopLeftRadius: 20, borderTopRightRadius: 20,
            display: "flex", alignItems: "center", justifyContent: "space-between"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: C.onlineDot }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: C.textLight }}>AI-ассистент</span>
              <span style={{ fontSize: 12, opacity: 0.55, color: C.textLight }}>— вопросы по кредитам</span>
            </div>
            <button onClick={() => setIsOpen(false)} style={{ background: "none", border: "none", color: C.textLight, fontSize: 20, cursor: "pointer", opacity: 0.6 }}>✕</button>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
            {messages.map((msg, idx) => (
              <div key={idx} style={{
                alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                maxWidth: "80%",
                background: msg.role === "user" ? C.darkGreen : C.white,
                color: msg.role === "user" ? C.textLight : C.darkGreen,
                borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                padding: "12px 16px", fontSize: 13, lineHeight: 1.6,
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
              }}>
                {msg.content}
              </div>
            ))}
            {isTyping && (
              <div style={{ display: "flex", gap: 4, padding: 12, background: C.white, borderRadius: "16px 16px 16px 4px", alignSelf: "flex-start", width: 60 }}>
                <span style={{ width: 6, height: 6, background: C.textMuted, borderRadius: "50%", animation: "chatBounce 1.4s infinite ease-in-out" }}></span>
                <span style={{ width: 6, height: 6, background: C.textMuted, borderRadius: "50%", animation: "chatBounce 1.4s infinite ease-in-out 0.2s" }}></span>
                <span style={{ width: 6, height: 6, background: C.textMuted, borderRadius: "50%", animation: "chatBounce 1.4s infinite ease-in-out 0.4s" }}></span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {messages.length === 1 && (
            <div style={{ padding: "0 16px 16px", display: "flex", flexWrap: "wrap", gap: 8 }}>
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => { setInput(s); sendMessage(); }}
                  style={{
                    background: "transparent", border: `1px solid #d0d8d4`,
                    borderRadius: 99, padding: "6px 12px", fontSize: 11,
                    color: C.darkGreen, cursor: "pointer"
                  }}
                >{s}</button>
              ))}
            </div>
          )}

          <div style={{ padding: 16, borderTop: "1px solid #e0e8e4", background: C.white }}>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendMessage()}
                placeholder="Введите вопрос..."
                style={{
                  flex: 1, padding: "10px 12px", border: `1.5px solid #d0d8d4`,
                  borderRadius: 10, fontSize: 13, outline: "none"
                }}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim()}
                style={{
                  background: input.trim() ? C.darkGreen : "#d0d8d4",
                  border: "none", borderRadius: 10, padding: "10px 16px",
                  color: C.white, fontSize: 16, cursor: input.trim() ? "pointer" : "default"
                }}
              >→</button>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: "fixed", bottom: 32, right: 32,
          width: 60, height: 60, borderRadius: "50%",
          background: C.darkGreen, border: "none",
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          cursor: "pointer", display: "flex", alignItems: "center",
          justifyContent: "center", zIndex: 150,
          animation: "chatPulse 3s ease-in-out infinite"
        }}
        onMouseEnter={e => e.currentTarget.style.transform = "scale(1.1)"}
        onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={C.textLight} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </button>
    </>
  );
}

function Footer() {
  return (
    <Reveal>
      <div style={{
        minHeight: 80, display: "flex", alignItems: "center",
        justifyContent: "center", gap: 32,
        borderTop: `1px solid ${C.border}`
      }}>
        <a href="#" style={{ color: C.footerText, fontSize: 14, textDecoration: "none", transition: "color 0.2s" }}
          onMouseEnter={e => e.currentTarget.style.color = C.textLight}
          onMouseLeave={e => e.currentTarget.style.color = C.footerText}
        >Напишите отзыв</a>
        <span style={{ color: C.footerText, fontSize: 14 }}>© 2026</span>
      </div>
    </Reveal>
  );
}

export default function App() {
  const [user, setUser] = useState(getCurrentUser);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");

  const [file, setFile] = useState(null);
  const [rawText, setRawText] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [isOcr, setIsOcr] = useState(false);
  const [ocrPageInfo, setOcrPageInfo] = useState("");

  const [history, setHistory] = useState(() => {
    if (user) return loadUserHistory(user.email);
    return [];
  });

  useEffect(() => {
    if (user) {
      saveUserHistory(user.email, history);
    }
  }, [history, user]);

  const handleLogin = (userData) => {
    setUser(userData);
    setHistory(loadUserHistory(userData.email));
  };

  const handleLogout = () => {
    clearSession();
    setUser(null);
    setHistory([]);
  };

  const handleFileSelect = async (selectedFile) => {
    setFile(selectedFile);
    setError("");
    setOcrProgress(0);
    setIsOcr(false);
    try {
      const text = await readFileAsText(selectedFile, (progress) => {
        setIsOcr(true);
        setOcrProgress(progress);
        setOcrPageInfo(`Страница ${Math.ceil(progress * 10)} из 10`); // упрощённо
      });
      setRawText(text);
    } catch (e) {
      setError(e.message);
    }
  };

  const handleAnalyze = async () => {
    if (!rawText.trim()) {
      setError("Введите текст или загрузите файл");
      return;
    }
    setError("");
    setLoading(true);
    setAnalysis(null);
    try {
      const ai = await groqFetch(buildPrompt(rawText, "analyze"), { maxTokens: 4000 });
      const content = ai?.choices?.[0]?.message?.content || "";
      const parsed = parseJSONSafe(content) || {
        verdict: "ОСТОРОЖНО",
        verdict_reason: "Не удалось распознать структуру",
        loan_amount: null,
        term: null,
        real_rate: null,
        monthly_payment: null,
        summary: "",
        hidden_fees: [],
        traps: [],
        positive: [],
        recommendations: []
      };
      setAnalysis(parsed);
      const historyEntry = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        fileName: file?.name || "Текст",
        verdict: parsed.verdict,
        score: parsed.score || 0,
        summary: parsed.verdict_reason
      };
      setHistory(prev => [historyEntry, ...prev].slice(0, 20));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setIsOcr(false);
    }
  };

  const downloadPdf = async () => {
    if (!analysis) return;
    const module = await import("https://cdn.jsdelivr.net/npm/jspdf@2.5.1/+esm");
    const jsPDF = module.jsPDF || module.default?.jsPDF || module.default;
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Анализ кредитного договора", 10, 20);
    doc.setFontSize(12);
    doc.text(`Вердикт: ${analysis.verdict}`, 10, 40);
    doc.text(`Причина: ${analysis.reason}`, 10, 50);
    doc.text(`Сумма: ${analysis.amount || "—"}`, 10, 60);
    doc.text(`Срок: ${analysis.term || "—"} мес`, 10, 70);
    doc.text(`Ставка: ${analysis.rate || "—"}%`, 10, 80);
    doc.text(`Платёж: ${analysis.monthlyPayment || "—"}`, 10, 90);
    doc.save("analiz-dogovora.pdf");
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: `linear-gradient(135deg, ${C.bgStart}, ${C.bgEnd})`,
      color: C.textLight,
      fontFamily: "'Plus Jakarta Sans', sans-serif"
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes chatBounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-8px); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes chatPulse {
          0% { box-shadow: 0 0 0 0 rgba(45,106,79,0.7); }
          70% { box-shadow: 0 0 0 15px rgba(45,106,79,0); }
          100% { box-shadow: 0 0 0 0 rgba(45,106,79,0); }
        }
      `}</style>

      <Navbar
        user={user}
        onLogout={handleLogout}
        onAuthClick={(mode) => { setAuthMode(mode); setAuthModalOpen(true); }}
        historyCount={history.length}
      />

      <Hero />

      <Reveal>
        <div style={{ padding: "20px 20px 40px" }}>
          <FileUpload
            onFileSelect={handleFileSelect}
            onTextChange={setRawText}
            text={rawText}
            error={error}
            analyzing={loading}
          />
          {rawText && !loading && (
            <div style={{ textAlign: "center", marginTop: 24 }}>
              <button
                onClick={handleAnalyze}
                style={{
                  background: C.success, border: "none", borderRadius: 40,
                  padding: "16px 48px", fontSize: 16, fontWeight: 700,
                  color: C.white, cursor: "pointer", boxShadow: "0 4px 12px rgba(0,0,0,0.2)"
                }}
              >Анализировать</button>
            </div>
          )}
        </div>
      </Reveal>

      {loading && (
        <LoadingScreen isOcr={isOcr} ocrProgress={ocrProgress} pageInfo={ocrPageInfo} />
      )}

      {analysis && !loading && (
        <Reveal>
          <div style={{ padding: "0 20px 80px" }}>
            <VerdictCard
              analysis={analysis}
              onToggleDetails={() => setShowDetails(!showDetails)}
              showDetails={showDetails}
              onDownloadPdf={downloadPdf}
            />
            {showDetails && <AccordionDetails analysis={analysis} />}
          </div>
        </Reveal>
      )}

      <ComparisonSection />

      <ChatAssistant />

      <Footer />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onLogin={handleLogin}
      />
    </div>
  );
}