# calculator.py

MEGA_CITIES = [
    "москва", "санкт-петербург", "спб", "питер", "новосибирск",
    "екатеринбург", "казань", "нижний новгород", "челябинск",
    "самара", "омск", "ростов-на-дону", "уфа", "красноярск",
    "пермь", "воронеж", "волгоград"
]
LARGE_REGIONAL = [
    "хабаровск", "владивосток", "иркутск", "тюмень", "калининград",
    "ярославль", "ижевск", "барнаул", "ульяновск", "оренбург"
]


def get_city_config(city_name):
    city = city_name.lower().replace("ё", "е")
    if any(m in city for m in MEGA_CITIES):
        return {"type": "Топовая локация", "rent": 10000, "rev_low": 90000, "rev_high": 120000}
    elif any(c in city for c in LARGE_REGIONAL):
        return {"type": "Среднее арифметическое", "rent": 6000, "rev_low": 52000, "rev_high": 60000}
    else:
        return {"type": "Объемы локации", "rent": 3000, "rev_low": 30000, "rev_high": 45000}


def calculate_local(budget_num, city_name, user_name):
    # Определяем модель и количество аппаратов
    # Модель фиксированная — Юниорский (200 см) — 230 000 руб.
    model_price = 230000
    delivery_install = 0.1  # 10% на доставку/установку
    total_per_unit = model_price * (1 + delivery_install)
    units = budget_num // int(total_per_unit)
    if units < 1:
        units = 1

    cfg = get_city_config(city_name)
    rent = cfg["rent"]
    rev_low = cfg["rev_low"]
    rev_high = cfg["rev_high"]

    # Налоги (УСН 6% + эквайринг) — берём из таблицы
    if cfg["type"] == "Топовая локация":
        tax = 6000
    elif cfg["type"] == "Среднее арифметическое":
        tax = 3500
    else:
        tax = 2000

    # Выручка, аренда, налоги — на 1 аппарат
    rev_low_per = rev_low
    rev_high_per = rev_high

    # Чистая прибыль на 1 аппарат = выручка - аренда - налоги (упрощённо)
    net_low = rev_low_per - rent - tax
    net_high = rev_high_per - rent - tax

    # Окупаемость = цена аппарата / чистая прибыль в месяц
    payback_low = model_price / net_high if net_high > 0 else 0
    payback_high = model_price / net_low if net_low > 0 else 0

    def fmt(v):
        return f"{v:,}".replace(",", " ")

    avg_net = (net_low + net_high) // 2
    avg_payback = round((payback_low + payback_high) / 2, 1)

    return (
        f"Здравствуйте, {user_name}! Я — Rocky Boxer, аналитик завода «ЛЕО БОКСЕР».\n\n"
        f"- Модель: Юниорский — {fmt(model_price)} руб.\n"
        f"- Количество аппаратов: {units}\n"
        f"- Выручка в месяц: {fmt(rev_low_per)} – {fmt(rev_high_per)} руб.\n"
        f"- Аренда: ~{fmt(rent)} руб.\n"
        f"- Налоги: ~{fmt(tax)} руб.\n"
        f"- Чистая прибыль: {fmt(net_low)} – {fmt(net_high)} руб./мес.\n"
        f"- Окупаемость: {payback_low:.0f} – {payback_high:.0f} мес.\n\n"
        f"Средняя чистая прибыль ~{fmt(avg_net)} руб./мес, окупаемость {avg_payback:.0f} мес.\n"
        f"Оставьте контакты, менеджер свяжется и подберёт лучшие точки."
    )