import time
from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

app = FastAPI()

# Монтируем папку static (CSS, JS, изображения) по маршруту /static
app.mount("/static", StaticFiles(directory="static"), name="static")

# Инициализируем шаблоны из папки templates
templates = Jinja2Templates(directory="templates")

# Регистрируем глобальную функцию для кэш-брейкинга
def url_with_timestamp(path: str) -> str:
    """
    Возвращает URL статического ресурса с добавленным параметром ?v=<timestamp>,
    чтобы браузер всегда загружал актуальную версию файла (CSS, JS).
    Используется в шаблонах: {{ url_with_timestamp('css/style.css') }}
    """
    timestamp = int(time.time())
    return f"/static/{path.lstrip('/')}?v={timestamp}"

templates.env.globals["url_with_timestamp"] = url_with_timestamp

@app.get("/")
async def index(request: Request):
    """Главная страница лендинга."""
    return templates.TemplateResponse("index.html", {"request": request})

@app.post("/api/chat")
async def ai_chat():
    """
    Заглушка для будущего AI-эндпоинта (OpenAI / DeepSeek).
    """
    return {"status": "ok", "message": "Chat endpoint is ready."}