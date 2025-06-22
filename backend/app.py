# app.py
from flask import Flask, jsonify
from flask_cors import CORS
import requests
import os # Імпортуємо модуль os для доступу до змінних середовища

app = Flask(__name__)
CORS(app) 

# --- КОНФІГУРАЦІЯ SHOPIFY API ---
# Отримуємо конфіденційні дані зі змінних середовища.
# ЦЕ БЕЗПЕЧНІШИЙ СПОСІБ ЗБЕРІГАННЯ, НІЖ ЖОРСТКЕ КОДУВАННЯ У ФАЙЛ!
# Переконайтеся, що ці змінні встановлені на вашій VM перед запуском.
SHOPIFY_STORE_NAME = os.environ.get("SHOPIFY_STORE_NAME")
SHOPIFY_API_KEY = os.environ.get("SHOPIFY_API_KEY")
SHOPIFY_ACCESS_TOKEN = os.environ.get("SHOPIFY_ACCESS_TOKEN")

# Актуальна версія Shopify Admin API
SHOPIFY_API_VERSION = "2025-04" 

# Перевірка наявності необхідних змінних середовища
if not all([SHOPIFY_STORE_NAME, SHOPIFY_API_KEY, SHOPIFY_ACCESS_TOKEN]):
    # Якщо будь-яка зі змінних відсутня, виводимо попередження
    # У продакшені це може бути оброблено як помилка, що зупиняє додаток
    print("WARNING: Shopify API credentials are not fully set in environment variables!")
    # Можете додати sys.exit(1) тут, щоб додаток не запускався без ключів
    # import sys
    # sys.exit(1)

# Базовий URL для Shopify Admin API
SHOPIFY_BASE_URL = f"https://{SHOPIFY_STORE_NAME}.myshopify.com/admin/api/{SHOPIFY_API_VERSION}"

# Заголовки для автентифікації запиту до Shopify API
HEADERS = {
    "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
    "Content-Type": "application/json"
}

@app.route('/')
def home():
    """Домашня сторінка бекенду."""
    return "Бекенд для замовлень Shopify працює!"

@app.route('/api/orders')
def get_orders():
    """Ендпоінт для отримання даних про замовлення безпосередньо з Shopify API."""
    # Перевіряємо, чи доступні облікові дані перед виконанням запиту
    if not all([SHOPIFY_STORE_NAME, SHOPIFY_API_KEY, SHOPIFY_ACCESS_TOKEN]):
        return jsonify({"error": "Shopify API credentials are not configured on the server."}), 500

    all_orders = []
    next_link = None
    has_next_page = True

    while has_next_page:
        url = f"{SHOPIFY_BASE_URL}/orders.json?status=any&limit=250"
        if next_link:
            url = next_link # Використовуємо URL для наступної сторінки з заголовка Link

        try:
            response = requests.get(url, headers=HEADERS)
            response.raise_for_status() # Виклик винятку для HTTP-помилок (4xx або 5xx)
            data = response.json()
            orders = data.get('orders', [])

            for order in orders:
                customer = order.get('customer', {})
                line_items = order.get('line_items', [])

                product_titles = "; ".join([item.get('title', '') for item in line_items])
                product_quantities = "; ".join([str(item.get('quantity', '')) for item in line_items])

                shipping_cost = sum(float(line.get('price', 0)) for line in order.get('shipping_lines', []))

                formatted_order = {
                    'ID Замовлення Shopify': str(order.get('id', '')),
                    'Номер Замовлення': order.get('name', ''),
                    'Дата Замовлення': order.get('created_at', ''),
                    'Статус Замовлення Shopify': order.get('financial_status', ''),
                    'Ім\'я Клієнта': f"{customer.get('first_name', '')} {customer.get('last_name', '')}".strip(),
                    'Email Клієнта': customer.get('email', ''),
                    'Телефон Клієнта': customer.get('phone', ''),
                    'Загальна Сума': float(order.get('total_price', 0)),
                    'Валюта': order.get('currency', ''),
                    'URL Замовлення Shopify': f"https://{SHOPIFY_STORE_NAME}.myshopify.com/admin/orders/{order.get('id', '')}",
                    'Товари Замовлення (Назва)': product_titles,
                    'Товари Замовлення (Кількість)': product_quantities,
                    'Статус Виготовлення': 'Нове', 
                    'Вартість Товарів': float(order.get('total_line_items_price', 0)),
                    'Вартість Доставки': shipping_cost,
                    'Чистий Прибуток': '' 
                }
                all_orders.append(formatted_order)

            link_header = response.headers.get('Link')
            if link_header:
                links = parse_link_header(link_header)
                next_link = links.get('next', {}).get('href')
                if not next_link:
                    has_next_page = False
            else:
                has_next_page = False

        except requests.exceptions.HTTPError as e:
            print(f"Помилка HTTP під час отримання замовлень Shopify: {e.response.status_code} - {e.response.text}")
            return jsonify({"error": f"Помилка Shopify API: {e.response.status_code} - {e.response.text}"}), e.response.status_code
        except requests.exceptions.RequestException as e:
            print(f"Помилка запиту до Shopify API: {e}")
            return jsonify({"error": f"Помилка запиту до Shopify API: {e}"}), 500
        except Exception as e:
            print(f"Неочікувана помилка: {e}")
            return jsonify({"error": f"Неочікувана помилка: {e}"}), 500
    
    all_orders.sort(key=lambda x: x.get('Дата Замовлення', ''), reverse=True)

    return jsonify(all_orders)

def parse_link_header(header):
    """
    Парсить заголовок Link HTTP-відповіді.
    Використовується для курсорної пагінації Shopify API.
    """
    links = {}
    parts = header.split(',')
    for part in parts:
        segments = part.split(';')
        if len(segments) < 2:
            continue
        url = segments[0].strip('<> ')
        rel = None
        for seg in segments[1:]:
            match = seg.strip().split('=')
            if len(match) == 2 and match[0] == 'rel':
                rel = match[1].strip('"')
                break
        if rel:
            links[rel] = {'href': url}
    return links

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)

