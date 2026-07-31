from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import os

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
    # Рендерим главную страницу и передаем ТОЛЬКО словарь контекста
    return templates.TemplateResponse(request, "index.html", {"request": request})

@app.post("/api/chat")
async def ai_chat():
    return {"status": "ok", "message": "Чат готов"}