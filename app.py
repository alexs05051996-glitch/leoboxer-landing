import sys
import os
import subprocess
import time
from pathlib import Path

# ------------------------------------------------------------
# 1. Автоматическая настройка виртуального окружения
# ------------------------------------------------------------
def setup_venv():
    """
    Проверяет наличие .venv и необходимых библиотек.
    Если чего-то нет – создаёт окружение и устанавливает пакеты.
    """
    project_dir = Path(__file__).resolve().parent
    venv_dir = project_dir / ".venv"

    # Определяем путь к Python внутри venv (Windows/Linux совместимость)
    if os.name == "nt":
        python_venv = venv_dir / "Scripts" / "python.exe"
    else:
        python_venv = venv_dir / "bin" / "python"

    # Если папки venv нет или отсутствует python внутри неё – создаём
    if not venv_dir.exists() or not python_venv.exists():
        print("🛠  Виртуальное окружение не найдено. Создаю .venv ...")
        subprocess.check_call([sys.executable, "-m", "venv", str(venv_dir)])
        print("✅ .venv успешно создан.")

    # Установка пакетов, если они ещё не стоят (проверяем наличие fastapi)
    required_packages = ["fastapi", "uvicorn", "jinja2", "python-multipart"]
    try:
        import fastapi
        import uvicorn
        import jinja2
        print("✅ Все необходимые библиотеки уже установлены.")
    except ImportError:
        print("📦 Устанавливаю зависимости внутри .venv ...")
        # Используем pip из созданного окружения
        pip_command = [str(python_venv), "-m", "pip", "install", "--quiet"] + required_packages
        subprocess.check_call(pip_command)
        print("✅ Установка завершена.")

    # Возвращаем путь к python внутри .venv для возможного дальнейшего использования
    return python_venv


# ------------------------------------------------------------
# 2. Инициализация FastAPI (только после гарантированной настройки)
# ------------------------------------------------------------
from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

app = FastAPI()

# Монтируем папку со статикой
app.mount("/static", StaticFiles(directory="static"), name="static")

# Шаблоны
templates = Jinja2Templates(directory="templates")

def get_css_version() -> int:
    """Cache‑breaking для CSS: возвращает текущий Unix‑timestamp."""
    return int(time.time())

@app.get("/")
async def index(request: Request):
    """Главная страница лендинга."""
    return templates.TemplateResponse(
        "index.html",
        {
            "request": request,
            "css_version": get_css_version()
        }
    )

@app.post("/api/chat")
async def ai_chat():
    """
    Заглушка для будущего AI-эндпоинта.
    """
    return {"status": "ok", "message": "Chat endpoint is ready."}


# ------------------------------------------------------------
# 3. Точка входа: настройка + запуск uvicorn из виртуального окружения
# ------------------------------------------------------------
if __name__ == "__main__":
    # Сначала выполняем проверку и автонастройку
    python_venv_path = setup_venv()

    # Запускаем uvicorn из виртуального окружения
    # (чтобы не зависеть от глобально установленного uvicorn)
    print("🚀 Запускаю сервер...")
    uvicorn_cmd = [
        str(python_venv_path), "-m", "uvicorn",
        "app:app",
        "--host", "127.0.0.1",
        "--port", "8000",
        "--reload"
    ]
    subprocess.run(uvicorn_cmd)
