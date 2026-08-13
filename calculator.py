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
        return {"type": "мегаполис", "rent": 15_000, "low_rev": 150_000, "peak_rev": 350_000}
    elif any(c in city for c in LARGE_REGIONAL):
        return {"type": "крупный областной центр", "rent": 10_000, "low_rev": 100_000, "peak_rev": 280_000}
    else:
        return {"type": "средний / малый город", "rent": 6_000, "low_rev": 80_000, "peak_rev": 220_000}

def calculate_local(budget_num, city_name, user_name):
    if budget_num < 400_000:
        units = 1
    elif budget_num <= 750_000:
        units = 2
    else:
        units = 4

    city_cfg = get_city_config(city_name)
    rent_per_unit = city_cfg["rent"]
    low_rev = city_cfg["low_rev"]
    peak_rev = city_cfg["peak_rev"]
    avg_rev = (low_rev + peak_rev) // 2

    def calc(revenue_per_unit):
        total = revenue_per_unit * units
        tax = total * 0.06
        acq = total * 0.02
        elect = 800 * units
        rent = rent_per_unit * units
        expenses = tax + acq + elect + rent
        net = total - expenses
        return round(net), round(expenses)

    net_low, exp_low = calc(low_rev)
    net_avg, exp_avg = calc(avg_rev)
    net_peak, exp_peak = calc(peak_rev)

    return (
        f"🥊 {user_name}, здравствуй! На связи Rocky Boxer, старший аналитик завода «ЛЕО БОКСЕР».\n"
        f"Разбираем твой проект в городе {city_name} ({city_cfg['type']}).\n"
        f"Бюджет {budget_num:,} руб. — ты берёшь {units} аппарат(а) Classic.\n\n"
        f"Вот реальная экономика без копеечных фантазий:\n\n"
        f"📊 СЕЗОННАЯ ВИЛКА (на {units} аппарат(а)):\n"
        f"❄️ Низкий сезон (выручка {low_rev:,} ₽/аппарат):\n"
        f"   Чистая прибыль: {net_low:,} ₽/мес\n"
        f"   Расходы: {exp_low:,} ₽/мес\n\n"
        f"📈 Средний сезон (выручка {avg_rev:,} ₽/аппарат):\n"
        f"   Чистая прибыль: {net_avg:,} ₽/мес\n"
        f"   Расходы: {exp_avg:,} ₽/мес\n\n"
        f"🔥 Пик сезона (выручка {peak_rev:,} ₽/аппарат):\n"
        f"   Чистая прибыль: {net_peak:,} ₽/мес\n"
        f"   Расходы: {exp_peak:,} ₽/мес\n\n"
        f"📍 ТАКТИКА ПО ЛОКАЦИЯМ В {city_name.upper()}:\n"
        f"• Летом: набережные, парки, центральные площади.\n"
        f"• Зимой: крупные ТЦ с фудкортом и кинотеатром.\n\n"
        f"⚠️ РЕАЛЬНЫЕ РИСКИ И ЗАЩИТА:\n"
        f"• Вандализм: стальной корпус 2 мм, порошковая покраска.\n"
        f"• Воровство: сейфовый замок и антивандальный купюроприемник.\n"
        f"• Контроль: Boxnet мониторит всё 24/7, мгновенные SMS при сбоях.\n\n"
        f"Итог: средняя чистая прибыль ~{(net_low + net_avg) // 2:,} ₽/мес, окупаемость 2.5–3 месяца.\n"
        f"Оставляй контакты, менеджер завода свяжется и забронирует лучшие точки в {city_name}."
    )