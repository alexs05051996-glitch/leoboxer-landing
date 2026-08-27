from fastapi import FastAPI, Request, Form, BackgroundTasks
from fastapi.responses import HTMLResponse, JSONResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import os
from datetime import datetime
import json
import asyncio

from dotenv import load_dotenv
load_dotenv()

import openai
import gspread
from oauth2client.service_account import ServiceAccountCredentials

# ===== Конфигурация =====

# OpenRouter
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
OPENROUTER_MODEL = "deepseek/deepseek-v4-flash-latest"

# Google Sheets
GS_SPREADSHEET_ID = os.getenv('GS_SPREADSHEET_ID')
if GS_SPREADSHEET_ID is None:
    raise ValueError("Missing GS_SPREADSHEET_ID in .env")
CREDENTIALS_FILE = "credentials.json"

# ===== Клиент OpenRouter =====
ai_client = openai.OpenAI(
    base_url=OPENROUTER_BASE_URL,
    api_key=OPENROUTER_API_KEY,
    default_headers={
        "HTTP-Referer": "https://leoboxer.ru",
        "X-Title": "Leoboxer AI Calculator",
    }
)

# ===== Google Sheets клиент =====
def get_sheet():
    scope = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]
    creds = ServiceAccountCredentials.from_json_keyfile_name(CREDENTIALS_FILE, scope)
    client = gspread.authorize(creds)
    sheet = client.open_by_key(GS_SPREADSHEET_ID).sheet1
    return sheet

def insert_lead_row(name, phone, city, budget, model):
    """
    Синхронная запись лида в Google Sheets:
    A — ФИО, B — Телефон, C — Город, D — Бюджет, E — Модель, F — Статус
    Возвращает номер строки (1-based), куда записан лид.
    """
    sheet = get_sheet()
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    # Формат: A=ФИО (+дата), B=Телефон, C=Город, D=Бюджет, E=Модель, F=Статус
    new_row = [f"{name} ({now_str})", phone, city, budget, model, "Начало генерации"]
    result = sheet.append_row(new_row, value_input_option="USER_ENTERED")
    # gspread возвращает dict с ключом 'updates' -> 'updatedRange' вида "A1:F7"
    updated_range = result.get('updates', {}).get('updatedRange', '')
    if updated_range:
        import re
        match = re.search(r'A(\d+):F(\d+)', updated_range)
        if match:
            return int(match.group(1))
    return None

def update_lead_result(row_number, final_text):
    """
    Фоновая дозапись полного текста расчёта в колонку F (столбец 6).
    Вызывается после завершения SSE-стриминга.
    """
    if row_number is None or not final_text:
        return
    try:
        sheet = get_sheet()
        # Колонка F = 6 (1-based) — заменяем "Начало генерации" на полный текст
        sheet.update(f"F{row_number}", [[final_text]], value_input_option="USER_ENTERED")
    except Exception as e:
        print(f"[Google Sheets background update error] {e}")

# ===== Системный промпт для ИИ (читается из файла) =====
with open("system_prompt.txt", "r", encoding="utf-8") as f:
    SYSTEM_PROMPT = f.read()

# ===== FastAPI приложение =====
app = FastAPI()

# Подключаем статику (картинки, стили)
app.mount("/static", StaticFiles(directory="static"), name="static")

# Подключаем шаблоны из правильной папки
templates = Jinja2Templates(directory="templates")

# Чистая функция кэш-брейкинга без побочных эффектов
def url_with_timestamp(filename: str):
    path = os.path.join("static", filename)
    if os.path.exists(path):
        return f"/static/{filename}?v={int(os.path.getmtime(path))}"
    return f"/static/{filename}"

# ПРАВИЛЬНАЯ РЕГИСТРАЦИЯ: строго через знак равенства (никаких запятых!)
templates.env.globals['url_with_timestamp'] = url_with_timestamp

# Отключаем кэш шаблонов для совместимости с Jinja2 3.1.6 (баг с нехешируемым ключом)
templates.env.cache = None


@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    return templates.TemplateResponse(request, "index.html", {"request": request})


@app.post("/api/chat")
async def ai_chat():
    return {"status": "ok", "message": "Чат готов"}


# ===== SSE-эндпоинт для пошагового чата =====
@app.post("/api/stream-calculation")
async def stream_calculation(request: Request, background_tasks: BackgroundTasks):
    body = await request.json()
    user_name = body.get("user_name", "").strip()
    user_phone = body.get("user_phone", "").strip()
    user_city = body.get("user_city", "").strip()
    user_budget = body.get("user_budget", "").strip()
    user_model = body.get("user_model", "").strip()

    # Валидация
    if not all([user_name, user_phone, user_city, user_budget, user_model]):
        return JSONResponse(
            status_code=400,
            content={"status": "error", "message": "Все поля обязательны"}
        )

    # Парсим бюджет для fallback-калькулятора
    try:
        budget_num = int(user_budget)
    except ValueError:
        return JSONResponse(
            status_code=400,
            content={"status": "error", "message": "Бюджет должен быть числом"}
        )

    # 1) Синхронная запись лида в Google Sheets (A–E) + статус "Начало генерации"
    row_number = None
    try:
        row_number = insert_lead_row(user_name, user_phone, user_city, user_budget, user_model)
    except Exception as e:
        print(f"[Google Sheets insert error] {e}")

    # Контейнер для накопленного результата (для фоновой задачи)
    result_holder = [""]

    async def generate():
        """Асинхронный генератор, читающий поток от OpenRouter DeepSeek."""
        full_response = ""
        try:
            # 2) Вызов OpenRouter через openai SDK с stream=True
            user_prompt = (
                f"Клиент: {user_name}\n"
                f"Город: {user_city}\n"
                f"Бюджет: {budget_num:,} руб.\n"
                f"Выбранная модель: {user_model}\n\n"
                f"Сгенерируй краткий расчёт прибыли и окупаемости для установки силомеров в городе {user_city} строго по данным из таблицы. Ответ должен соответствовать формату, указанному в системном промпте."
            )

            stream = ai_client.chat.completions.create(
                model=OPENROUTER_MODEL,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.7,
                max_tokens=2048,
                stream=True
            )

            for chunk in stream:
                delta = chunk.choices[0].delta if chunk.choices else None
                content = delta.content if delta and delta.content else ""
                if content:
                    full_response += content
                    yield f"data: {json.dumps({'token': content, 'full': full_response})}\n\n"
                    await asyncio.sleep(0)  # yield control back to event loop

        except Exception as e:
            # Fallback: локальный калькулятор
            print(f"[OpenRouter stream error] {e}")
            try:
                from calculator import calculate_local
                fallback_text = calculate_local(budget_num, user_city, user_name)
                full_response = fallback_text
                yield f"data: {json.dumps({'token': fallback_text, 'full': fallback_text})}\n\n"
            except Exception as calc_e:
                print(f"[Fallback calculate error] {calc_e}")
                yield f"data: {json.dumps({'token': '⚠️ Произошла ошибка при расчёте. Попробуйте позже.', 'full': ''})}\n\n"

        # Сохраняем полный ответ для фоновой задачи
        result_holder[0] = full_response
        yield "data: [DONE]\n\n"

    # Создаём StreamingResponse
    response = StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )

    # Добавляем фоновую задачу для дозаписи результата в Google Sheets
    # Важно: background_tasks выполняются после завершения StreamingResponse
    current_row = row_number
    current_holder = result_holder  # захват ссылки для замыкания
    def finalize_lead():
        nonlocal current_holder
        update_lead_result(current_row, current_holder[0])
    background_tasks.add_task(finalize_lead)

    return response


# ===== Старый эндпоинт (Fallback — оставлен для обратной совместимости) =====
@app.post("/api/calculate/")
async def calculate_profit(
    user_name: str = Form(...),
    user_phone: str = Form(...),
    user_city: str = Form(...),
    user_budget: str = Form(...)
):
    # Валидация
    if not all([user_name, user_phone, user_city, user_budget]):
        return JSONResponse(
            status_code=400,
            content={"status": "error", "message": "Все поля обязательны"}
        )
    try:
        budget_num = int(user_budget)
    except ValueError:
        return JSONResponse(
            status_code=400,
            content={"status": "error", "message": "Бюджет должен быть числом"}
        )

    try:
        # ===== 1. Запрос к OpenRouter =====
        user_prompt = (
            f"Клиент: {user_name}\n"
            f"Город: {user_city}\n"
            f"Бюджет: {budget_num:,} руб.\n\n"
            f"Сгенерируй B2B-анализ рынка с математическим расчётом сезонной прибыли и расходов "
            f"для открытия франшизы силомеров ЛЕО БОКСЕР в городе {user_city}."
        )

        completion = ai_client.chat.completions.create(
            model=OPENROUTER_MODEL,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.7,
            max_tokens=2048
        )

        ai_result = completion.choices[0].message.content.strip()

    except Exception as e:
        # Если OpenRouter не сработал — используем локальный калькулятор как fallback
        from calculator import calculate_local
        ai_result = calculate_local(budget_num, user_city, user_name)
        # Но сообщаем о проблеме
        print(f"[OpenRouter error] {e}")

    try:
        # ===== 2. Запись в Google Sheets =====
        sheet = get_sheet()
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        new_row = [now_str, user_name, user_phone, user_city, user_budget, "", ai_result]
        sheet.append_row(new_row)
    except Exception as e:
        # Логируем ошибку записи в таблицу, но не прерываем ответ пользователю
        print(f"[Google Sheets error] {e}")

    return JSONResponse(content={"status": "success", "result": ai_result})