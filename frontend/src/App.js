// src/App.jsx (або src/App.js)
import React, { useState, useEffect } from 'react';

function App() {
  const [orders, setOrders] = useState([]); // Стан для зберігання даних замовлень
  const [loading, setLoading] = useState(true); // Стан для індикатора завантаження
  const [error, setError] = useState(null); // Стан для зберігання помилок

  // URL вашого бекенду. Оскільки Nginx буде проксіювати запити з /api на ваш бекенд,
  // використовуємо відносний шлях '/api'. Якщо бекенд доступний безпосередньо
  // за IP:портом, можна вказати повний URL (наприклад, 'http://ВАШ_IP_АДРЕСА_VM:5000').
  // Для розгортання на одній VM з Nginx, '/api' - найкращий варіант.
  const API_BASE_URL = '/api'; 

  useEffect(() => {
    // Функція для отримання даних замовлень з бекенду
    const fetchOrders = async () => {
      try {
        // ВИПРАВЛЕНО: Змінено URL запиту, щоб уникнути подвійного "/api".
        // Тепер це формує "/api/orders" (через Nginx проксі) або
        // "http://ВАШ_IP_АДРЕСА_VM:5000/orders" (якщо API_BASE_URL було змінено на повний URL).
        const response = await fetch(`${API_BASE_URL}/orders`); // Запит до ендпоінту бекенду
        if (!response.ok) {
          // Якщо відповідь не успішна (наприклад, 404, 500)
          throw new Error(`Помилка HTTP! Статус: ${response.status} - ${response.statusText}`);
        }
        const data = await response.json(); // Парсинг JSON-відповіді
        setOrders(data); // Оновлюємо стан замовлень
      } catch (e) {
        console.error("Помилка під час отримання замовлень:", e);
        setError("Не вдалося завантажити дані замовлень. Перевірте, чи працює бекенд і Nginx."); // Встановлюємо повідомлення про помилку
      } finally {
        setLoading(false); // Завершуємо стан завантаження, незалежно від результату
      }
    };

    fetchOrders(); // Викликаємо функцію отримання даних при першому рендері компонента
  }, []); // Пустий масив залежностей означає, що ефект запускається лише один раз після монтування компонента

  // Відображення стану завантаження
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 font-sans p-4">
        <div className="text-xl text-gray-700">Завантаження замовлень...</div>
      </div>
    );
  }

  // Відображення стану помилки
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-red-100 font-sans p-4">
        <div className="text-xl text-red-700">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 font-sans p-4 sm:p-6 lg:p-8">
      {/* Заголовок дашборду */}
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-6 text-center rounded-lg p-4 bg-white shadow-md">
        Дашборд Замовлень Shopify
      </h1>

      {/* Контейнер таблиці з горизонтальною прокруткою для адаптивності на малих екранах */}
      <div className="overflow-x-auto rounded-lg shadow-lg">
        <table className="min-w-full bg-white border border-gray-200">
          {/* Заголовки таблиці */}
          <thead className="bg-gray-200 text-gray-700 uppercase text-sm leading-normal">
            <tr>
              {/* Зверніть увагу: ключі тут мають ТОЧНО відповідати ключам, які повертає ваш Python-бекенд */}
              <th className="py-3 px-6 text-left">ID Замовлення Shopify</th>
              <th className="py-3 px-6 text-left">Номер Замовлення</th>
              <th className="py-3 px-6 text-left">Дата Замовлення</th>
              <th className="py-3 px-6 text-left">Статус Shopify</th>
              <th className="py-3 px-6 text-left">Ім'я Клієнта</th>
              <th className="py-3 px-6 text-left">Email Клієнта</th>
              <th className="py-3 px-6 text-left">Телефон Клієнта</th>
              <th className="py-3 px-6 text-left">Загальна Сума</th>
              <th className="py-3 px-6 text-left">Валюта</th>
              <th className="py-3 px-6 text-left">Товари (Назва)</th>
              <th className="py-3 px-6 text-left">Товари (Кількість)</th>
              <th className="py-3 px-6 text-left">Статус Виготовлення</th>
              <th className="py-3 px-6 text-left">Вартість Товарів</th>
              <th className="py-3 px-6 text-left">Вартість Доставки</th>
              <th className="py-3 px-6 text-left">URL Замовлення</th>
            </tr>
          </thead>
          {/* Тіло таблиці з даними замовлень */}
          <tbody className="text-gray-600 text-sm font-light">
            {orders.map((order, index) => (
              <tr 
                // Використовуємо ID Замовлення Shopify як унікальний ключ для рядка
                key={order['ID Замовлення Shopify'] || index} 
                className="border-b border-gray-200 hover:bg-gray-100"
              >
                <td className="py-3 px-6 text-left whitespace-nowrap rounded-l-lg">{order['ID Замовлення Shopify']}</td>
                <td className="py-3 px-6 text-left">{order['Номер Замовлення']}</td>
                {/* Форматування дати: Shopify повертає ISO 8601, JavaScript Date може його парсити */}
                <td className="py-3 px-6 text-left">{new Date(order['Дата Замовлення']).toLocaleString()}</td>
                <td className="py-3 px-6 text-left">
                  {/* Стилізація статусу замовлення Shopify */}
                  <span className={`py-1 px-3 rounded-full text-xs font-semibold 
                    ${order['Статус Замовлення Shopify'] === 'paid' ? 'bg-green-200 text-green-600' : 
                      order['Статус Замовлення Shopify'] === 'pending' ? 'bg-yellow-200 text-yellow-600' : 
                      'bg-gray-200 text-gray-600'}`}>
                    {order['Статус Замовлення Shopify']}
                  </span>
                </td>
                {/* Поля з даними клієнтів (можуть бути порожніми через обмеження Shopify Basic плану) */}
                <td className="py-3 px-6 text-left">{order['Ім\'я Клієнта']}</td>
                <td className="py-3 px-6 text-left">{order['Email Клієнта']}</td>
                <td className="py-3 px-6 text-left">{order['Телефон Клієнта']}</td>
                <td className="py-3 px-6 text-left font-medium">{order['Загальна Сума']} {order['Валюта']}</td>
                <td className="py-3 px-6 text-left">{order['Товари Замовлення (Назва)']}</td>
                <td className="py-3 px-6 text-left">{order['Товари Замовлення (Кількість)']}</td>
                <td className="py-3 px-6 text-left">
                  {/* Стилізація статусу виготовлення */}
                  <span className={`py-1 px-3 rounded-full text-xs font-semibold 
                    ${order['Статус Виготовлення'] === 'Нове' ? 'bg-blue-200 text-blue-600' : 
                      order['Статус Виготовлення'] === 'В роботі' ? 'bg-orange-200 text-orange-600' : 
                      order['Статус Виготовлення'] === 'Виконано' ? 'bg-purple-200 text-purple-600' : 
                      'bg-gray-200 text-gray-600'}`}>
                    {order['Статус Виготовлення']}
                  </span>
                </td>
                <td className="py-3 px-6 text-left">{order['Вартість Товарів']}</td>
                <td className="py-3 px-6 text-left">{order['Вартість Доставки']}</td>
                <td className="py-3 px-6 text-left rounded-r-lg">
                  {/* Посилання на замовлення в адмін-панелі Shopify */}
                  <a href={order['URL Замовлення Shopify']} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                    Посилання
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Повідомлення, якщо немає замовлень */}
      {orders.length === 0 && !loading && !error && (
        <div className="text-center text-gray-600 mt-8 text-lg">Немає замовлень для відображення.</div>
      )}
      
      {/* Підключення Tailwind CSS та Google Fonts (Inter) через CDN */}
      {/* Це дозволяє працювати без повної інсталяції Tailwind, але для великих проектів краще встановити Tailwind npm-пакетом */}
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <style>{`
        body {
          font-family: 'Inter', sans-serif;
        }
      `}</style>
      <script src="https://cdn.tailwindcss.com"></script>
    </div>
  );
}

export default App;
