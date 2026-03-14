# Читаю за тебя

AI‑веб‑приложение для разбора кредитных договоров на русском языке.

Приложение помогает:
- загружать договоры (PDF / DOCX / TXT / изображения),
- извлекать текст (включая OCR),
- получать структурированный AI‑анализ рисков,
- сравнивать несколько кредитных предложений,
- задавать вопросы AI‑ассистенту в чате.

---

## Текущий статус

Проект запускается как frontend + serverless API, но есть известные ограничения (см. раздел **Known Issues** ниже).

---

## Стек

### Frontend
- React
- Vite
- Recharts (графики)
- OCR и парсинг документов через CDN‑импорты в `src/App.jsx`:
  - `tesseract.js`
  - `pdfjs-dist`
  - `mammoth`

### Backend
- Vercel Serverless Function: `api/chat.js`
- Multipart parsing: `busboy`
- Обработка PDF на сервере: `pdf-parse`
- Обработка DOCX на сервере: `mammoth`
- Upstream AI endpoint: OpenRouter Chat Completions API

---

## Структура проекта

```text
.
├─ api/
│  └─ chat.js
├─ src/
│  ├─ App.jsx
│  └─ main.jsx
├─ index.html
└─ vite.config.js
```

---

## Как это работает

1. Пользователь загружает документ или вставляет текст.
2. `src/App.jsx` извлекает текст (включая OCR для изображений / сканов).
3. На основе режима (`analyze` / `compare`) формируется системный prompt.
4. Frontend вызывает `POST /api/chat` через `groqFetch`.
5. `api/chat.js`:
   - валидирует вход,
   - (при multipart) извлекает текст из файлов,
   - проксирует запрос в OpenRouter,
   - возвращает JSON‑ответ.
6. Frontend парсит/отображает анализ, графики и рекомендации.

---

## Переменные окружения

`api/chat.js` ищет API ключ в следующем порядке:

1. `DEEPSEEK_API_KEY`
2. `GEMINI_API_KEY`
3. `GOOGLE_API_KEY`

Можно положить ключ в `.env.local` (или `.env`).

Пример:

```env
DEEPSEEK_API_KEY=your_key_here
```

---

## Локальный запуск

> В текущем снапшоте нет `package.json`, поэтому стандартные команды `npm install` / `npm run dev` могут быть недоступны в этой копии проекта.
> Если у вас есть полный репозиторий с `package.json`, запускайте стандартно через Vite.

Общие шаги:
1. Установить Node.js (добавить в PATH).
2. Добавить `.env.local` с API ключом.
3. Запустить frontend (Vite) и serverless API (локально через Vercel/эквивалентный runtime).

---

## API

### `POST /api/chat`

Поддерживает:
- `application/json`
- `multipart/form-data`

Ожидаемый JSON payload:

```json
{
  "messages": [{ "role": "system", "content": "..." }, { "role": "user", "content": "..." }],
  "model": "openrouter/hunter-alpha",
  "temperature": 0.2,
  "max_tokens": 2048
}
```

Успех:
- Возвращает JSON в формате chat completion (как у upstream провайдера).

Ошибки:
- Возвращаются в виде `{ "error": { "message": "..." } }` с корректным HTTP‑кодом.

---

## Known Issues (важно)

1. **Отсутствует `api/generate-pdf`**
   - В `src/App.jsx` есть вызов `POST /api/generate-pdf` (`downloadPdf`),
   - но такой serverless route отсутствует.
   - Кнопка сохранения файла будет падать до добавления этого эндпоинта.

2. **Несовпадение полей в таблице сравнения**
   - Prompt сравнения возвращает поля типа `loan_amount`, `real_rate`, `monthly_payment`, `hidden_fees_total`.
   - Таблица рендерит поля `amount`, `rate`, `monthlyPayment`, `hiddenFeesTotal`.
   - Из‑за этого часть значений может отображаться как `—`.

3. **Чипсы подсказок в чате могут отправлять не тот текст**
   - Логика `setInput(s); sendMessage();` может использовать устаревшее значение `input`.

4. **Риски безопасности в клиентской авторизации**
   - Учетные данные хранятся в `localStorage`.
   - Используется упрощенный client-side hash.
   - Это не подходит для production‑уровня аутентификации.

---

## Рекомендации перед релизом

- Добавить `api/generate-pdf` (или убрать/заменить кнопку выгрузки).
- Унифицировать schema полей для сравнения.
- Исправить отправку сообщений из suggestion chips.
- Перенести auth на сервер (с безопасным хешированием пароля и сессиями/токенами).
- Добавить `package.json`/lockfile в репозиторий (если отсутствуют в текущей ветке).

---

## Лицензия

Добавьте выбранную лицензию (например, MIT) в отдельный файл `LICENSE`.
