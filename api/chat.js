import fs from "node:fs";
import path from "node:path";
import Busboy from "busboy";


const UPSTREAM_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "openrouter/hunter-alpha";
const REQUEST_TIMEOUT_MS = 600000;
const KEY_CANDIDATES = ["DEEPSEEK_API_KEY", "GEMINI_API_KEY", "GOOGLE_API_KEY"];
const MAX_FILE_SIZE = 1024 * 1024;

function json(res, status, payload) {
    res.status(status).setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    return res.end(JSON.stringify(payload));
}

function getRequestBody(req) {
    if (req.body && typeof req.body === "object") return req.body;
    try {
        return JSON.parse(req.body || "{}");
    } catch {
        return null;
    }
}

function sanitizeMessages(messages) {
    if (!Array.isArray(messages)) return [];
    return messages
        .filter((msg) => msg && typeof msg === "object")
        .map((msg) => ({
            role: String(msg.role || "user").slice(0, 30),
            content: String(msg.content || "").slice(0, 30000),
        }))
        .filter((msg) => msg.content.trim().length > 0);
}

function stripWrappingQuotes(value) {
    if (typeof value !== "string") return "";
    const trimmed = value.trim();
    if (!trimmed) return "";
    if (
        (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
        (trimmed.startsWith("'") && trimmed.endsWith("'"))
    ) {
        return trimmed.slice(1, -1).trim();
    }
    return trimmed;
}

function parseEnvText(content) {
    const map = {};
    const lines = String(content || "").split(/\r?\n/);
    for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line || line.startsWith("#")) continue;
        const normalized = line.startsWith("export ") ? line.slice(7).trim() : line;
        const eqIndex = normalized.indexOf("=");
        if (eqIndex <= 0) continue;
        const key = normalized.slice(0, eqIndex).trim();
        const value = stripWrappingQuotes(normalized.slice(eqIndex + 1));
        if (!key) continue;
        map[key] = value;
    }
    return map;
}

function readEnvFile(envPath) {
    try {
        if (!fs.existsSync(envPath)) {
            return { exists: false, parsed: {} };
        }
        const raw = fs.readFileSync(envPath, "utf8");
        return { exists: true, parsed: parseEnvText(raw) };
    } catch {
        return { exists: false, parsed: {} };
    }
}

function loadMergedEnvFiles() {
    const cwd = process.cwd();
    const localPath = path.join(cwd, ".env.local");
    const basePath = path.join(cwd, ".env");
    const localResult = readEnvFile(localPath);
    const baseResult = readEnvFile(basePath);
    return {
        files: {
            ".env.local": localResult.exists,
            ".env": baseResult.exists,
        },
        values: {
            ...baseResult.parsed,
            ...localResult.parsed,
        },
    };
}

function resolveApiKey() {
    for (const keyName of KEY_CANDIDATES) {
        const fromProcess = stripWrappingQuotes(process.env[keyName] || "");
        if (fromProcess) {
            return { value: fromProcess, keyName, source: "process.env" };
        }
    }
    const localEnv = loadMergedEnvFiles();
    for (const keyName of KEY_CANDIDATES) {
        const fromFile = stripWrappingQuotes(localEnv.values[keyName] || "");
        if (fromFile) {
            return { value: fromFile, keyName, source: "local-file" };
        }
    }
    return { value: "", keyName: "", source: "missing" };
}

async function extractTextFromFile(fileBuffer, filename, mimeType) {
    const ext = path.extname(filename).toLowerCase();
    if (mimeType === "application/pdf" || ext === ".pdf") {
        const pdf = await import('pdf-parse');
        const pdfParse = pdf.default || pdf; // универсально
        const data = await pdfParse(fileBuffer);
        return data.text;
    } else if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || ext === ".docx") {
        const mammoth = await import('mammoth');
        const mammothLib = mammoth.default || mammoth;
        const result = await mammothLib.extractRawText({ buffer: fileBuffer });
        return result.value;
    } else if (mimeType.startsWith("text/") || ext === ".txt") {
        return fileBuffer.toString("utf-8");
    } else {
        throw new Error(`Unsupported file type: ${mimeType || ext}`);
    }
}

function parseMultipart(req) {
    return new Promise((resolve, reject) => {
        const busboy = Busboy({ headers: req.headers, limits: { fileSize: MAX_FILE_SIZE } });
        const fields = {};
        const fileBuffers = [];

        busboy.on("field", (fieldname, val) => {
            fields[fieldname] = val;
        });

        busboy.on("file", (fieldname, file, { filename, encoding, mimeType }) => {
            const chunks = [];
            file.on("data", (data) => chunks.push(data));
            file.on("end", () => {
                const buffer = Buffer.concat(chunks);
                fileBuffers.push({ filename, mimeType, buffer });
            });
        });

        busboy.on("error", (err) => reject(err));
        busboy.on("finish", () => resolve({ fields, fileBuffers }));

        req.pipe(busboy);
    });
}

export default async function handler(req, res) {
    if (req.method === "OPTIONS") {
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type");
        return res.status(200).end();
    }

    if (req.method !== "POST") {
        res.setHeader("Allow", "POST");
        return json(res, 405, { error: { message: "Метод не поддерживается" } });
    }

    const contentType = req.headers["content-type"] || "";

    let body;
    let files = [];

    if (contentType.includes("multipart/form-data")) {
        try {
            const { fields, fileBuffers } = await parseMultipart(req);
            body = fields;
            files = fileBuffers;
        } catch (err) {
            return json(res, 400, { error: { message: `Ошибка обработки файлов: ${err.message}` } });
        }
    } else {
        body = getRequestBody(req);
    }

    if (!body) {
        return json(res, 400, { error: { message: "Некорректный JSON в теле запроса" } });
    }

    let messages = body.messages ? sanitizeMessages(body.messages) : [];

    if (files.length > 0) {
        const fileTexts = [];
        for (const file of files) {
            try {
                const text = await extractTextFromFile(file.buffer, file.filename, file.mimeType);
                fileTexts.push(`[Файл: ${file.filename}]\n${text}`);
            } catch (err) {
                return json(res, 400, { error: { message: `Не удалось обработать файл ${file.filename}: ${err.message}` } });
            }
        }
        const combinedContent = fileTexts.join("\n\n---\n\n");
        const lastUserMsgIndex = [...messages].reverse().findIndex(m => m.role === "user");
        if (lastUserMsgIndex !== -1) {
            const idx = messages.length - 1 - lastUserMsgIndex;
            messages[idx].content += "\n\n" + combinedContent;
        } else {
            messages.push({ role: "user", content: combinedContent });
        }
    }

    if (messages.length === 0) {
        return json(res, 400, { error: { message: "Нет сообщений или файлов для обработки" } });
    }

    const apiKeyState = resolveApiKey();
    const apiKey = apiKeyState.value;
    if (!apiKey) {
        return json(res, 500, {
            error: {
                message:
                    "Сервер не настроен: отсутствует API-ключ. Добавьте DEEPSEEK_API_KEY, GEMINI_API_KEY или GOOGLE_API_KEY в .env.local и перезапустите vercel dev.",
            },
        });
    }

    const model = String(body.model || DEFAULT_MODEL).slice(0, 120);
    const temperature = Number.isFinite(body.temperature) ? body.temperature : 0.2;
    const maxTokens = Number.isFinite(body.max_tokens) ? body.max_tokens : 2048;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
        const upstreamRes = await fetch(UPSTREAM_ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model,
                messages,
                temperature,
                max_tokens: maxTokens,
            }),
            signal: controller.signal,
        });

        const text = await upstreamRes.text();
        const data = (() => {
            try {
                return JSON.parse(text);
            } catch {
                return { error: { message: text || "Некорректный ответ внешнего AI-сервиса" } };
            }
        })();

        if (!upstreamRes.ok) {
            const status = upstreamRes.status || 502;
            const message = data?.error?.message || "Ошибка внешнего AI-сервиса";
            return json(res, status, { error: { message } });
        }

        return json(res, 200, data);
    } catch (error) {
        if (error?.name === "AbortError") {
            return json(res, 504, { error: { message: "Таймаут при обращении к внешнему AI-сервису" } });
        }
        return json(res, 500, { error: { message: "Внутренняя ошибка сервера" } });
    } finally {
        clearTimeout(timeoutId);
    }
}