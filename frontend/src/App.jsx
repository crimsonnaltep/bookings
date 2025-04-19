import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

export default function App() {
  const API_URL = "http://localhost:8000";
  const CELL_WIDTH = 60;
  const CELL_HEIGHT = 40;
  const LABEL_WIDTH = 100;

  // Генерация временных слотов (30 минут)
  const TIMESLOTS = [];
  for (let i = 12 * 60; i < 24 * 60; i += 30) {
    TIMESLOTS.push(
      `${String(Math.floor(i / 60)).padStart(2, "0")}:${String(i % 60).padStart(
        2,
        "0"
      )}`
    );
  }
  for (let i = 0; i < 12 * 60; i += 30) {
    TIMESLOTS.push(
      `${String(Math.floor(i / 60)).padStart(2, "0")}:${String(i % 60).padStart(
        2,
        "0"
      )}`
    );
  }

  const TABLES = [
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "CS",
    "DOTA",
    "TWITCH",
    "GTA",
    "MAFIA",
    "ANIME",
    "STAR WARS",
  ];

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [bookings, setBookings] = useState([]);
  const [selection, setSelection] = useState(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [nowOffset, setNowOffset] = useState(0);

  // Загрузка при смене даты
  useEffect(() => {
    fetchBookings();
  }, [selectedDate]);

  // Обновление линии текущего времени
  useEffect(() => {
    const update = () => {
      const d = new Date();
      let m = d.getHours() * 60 + d.getMinutes();
      if (m < 12 * 60) m += 24 * 60;
      setNowOffset(((m - 12 * 60) / 30) * CELL_WIDTH);
    };
    update();
    const iv = setInterval(update, 60000);
    return () => clearInterval(iv);
  }, []);

  // CRUD
  const fetchBookings = async () => {
    try {
      const res = await axios.get(`${API_URL}/bookings/`, {
        params: { date: selectedDate },
      });
      setBookings(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const changeDate = (offset) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + offset);
    setSelectedDate(d.toISOString().split("T")[0]);
  };

  // Выделение ячеек
  const onMouseDown = (table, slot) => {
    setIsSelecting(true);
    setSelection({ table, start: slot, end: slot + 1 });
  };
  const onMouseEnter = (table, slot) => {
    if (isSelecting && selection.table === table) {
      setSelection((s) => ({ ...s, end: slot + 1 }));
    }
  };
  const onMouseUp = () => {
    if (isSelecting && selection) {
      openModal({
        ...selection,
        name: "",
        phone: "",
        reqAmount: "",
        fromWho: "",
        amountFact: "",
        comment: "",
        status: "booked",
        date: selectedDate,
      });
    }
    setIsSelecting(false);
  };

  // Модалка
  const openModal = (data) => setModalData(data);
  const closeModal = () => setModalData(null);

  const saveBooking = async () => {
    try {
      if (modalData.id) {
        await axios.put(`${API_URL}/bookings/${modalData.id}`, modalData);
      } else {
        await axios.post(`${API_URL}/bookings/`, modalData);
      }
      fetchBookings();
      closeModal();
    } catch (e) {
      alert(e.response?.data?.detail || "Error");
    }
  };

  const handleAction = async (b, action) => {
    try {
      if (action === "delete") {
        await axios.delete(`${API_URL}/bookings/${b.id}`);
      }
      if (action === "occupied") {
        await axios.put(`${API_URL}/bookings/${b.id}`, {
          ...b,
          status: "occupied",
        });
      }
      fetchBookings();
      closeModal();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="booking-app" onMouseUp={onMouseUp}>
      <h1>Бронирования на {selectedDate}</h1>
      <div className="calendar-nav">
        <button onClick={() => changeDate(-1)}>←</button>
        <span className="date-display">{selectedDate}</span>
        <button onClick={() => changeDate(1)}>→</button>
      </div>

      <div className="grid-container">
        <div className="labels-column">
          <div
            className="corner-cell"
            style={{ width: LABEL_WIDTH, height: CELL_HEIGHT }}
          />
          {TABLES.map((t) => (
            <div
              key={t}
              className="label-cell"
              style={{ width: LABEL_WIDTH, height: CELL_HEIGHT }}
            >
              {t}
            </div>
          ))}
        </div>

        <div
          className="scroll-panel"
          style={{
            width: `calc(100% - ${LABEL_WIDTH}px)`,
            overflowX: "auto",
          }}
        >
          <div className="time-header">
            {TIMESLOTS.map((t, i) => (
              <div
                key={i}
                className="time-cell"
                style={{ width: CELL_WIDTH, height: CELL_HEIGHT }}
              >
                {t}
              </div>
            ))}
          </div>

          <div className="body-rows">
            {TABLES.map((table) => (
              <div key={table} className="row" style={{ height: CELL_HEIGHT }}>
                {TIMESLOTS.map((_, si) => (
                  <div
                    key={si}
                    className={`cell${
                      selection &&
                      selection.table === table &&
                      si >= Math.min(selection.start, selection.end - 1) &&
                      si < Math.max(selection.start, selection.end)
                        ? " selected"
                        : ""
                    }`}
                    style={{ width: CELL_WIDTH, height: CELL_HEIGHT }}
                    onMouseDown={() => onMouseDown(table, si)}
                    onMouseEnter={() => onMouseEnter(table, si)}
                    onClick={() => {
                      const b = bookings.find(
                        (x) =>
                          x.table === table &&
                          x.date === selectedDate &&
                          si >= x.start &&
                          si < x.end
                      );
                      if (b) openModal({ ...b });
                    }}
                  />
                ))}
              </div>
            ))}

            {/* Линия текущего времени */}
            <div
              className="current-line"
              style={{
                position: "absolute",
                top: 0,
                left: nowOffset,
                width: 2,
                height: TABLES.length * CELL_HEIGHT,
              }}
            />
            <div
              className="current-label"
              style={{
                position: "absolute",
                top: -CELL_HEIGHT,
                left: nowOffset - 20,
              }}
            >
              {new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              })}
            </div>

            {/* Блоки броней */}
            {bookings
              .filter((b) => b.date === selectedDate)
              .map((b) => (
                <div
                  key={b.id}
                  className={`booking-block${
                    b.status === "occupied" ? " occupied" : ""
                  }`}
                  style={{
                    top: TABLES.indexOf(b.table) * CELL_HEIGHT,
                    left: b.start * CELL_WIDTH,
                    width: (b.end - b.start) * CELL_WIDTH,
                    height: CELL_HEIGHT,
                  }}
                  onClick={() => openModal({ ...b })}
                >
                  <span>{b.name}</span>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Модальное окно */}
      {modalData && (
        <div
          className="modal-overlay"
          onClick={(e) =>
            e.target.className === "modal-overlay" && closeModal()
          }
        >
          <div className="modal">
            <h2>{modalData.id ? "Редактировать бронь" : "Новая бронь"}</h2>
            <label>Столик: {modalData.table}</label>
            <label>
              Начало:
              <select
                value={modalData.start}
                onChange={(e) =>
                  setModalData((m) => ({
                    ...m,
                    start: +e.target.value,
                  }))
                }
              >
                {TIMESLOTS.map((t, i) => (
                  <option key={i} value={i}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Конец:
              <select
                value={modalData.end}
                onChange={(e) =>
                  setModalData((m) => ({
                    ...m,
                    end: +e.target.value,
                  }))
                }
              >
                {TIMESLOTS.map((t, i) => (
                  <option key={i} value={i + 1}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <label>
              ФИО*:
              <input
                type="text"
                value={modalData.name}
                onChange={(e) =>
                  setModalData((m) => ({
                    ...m,
                    name: e.target.value,
                  }))
                }
              />
            </label>
            <label>
              Телефон*:
              <input
                type="text"
                value={modalData.phone}
                onChange={(e) =>
                  setModalData((m) => ({
                    ...m,
                    phone: e.target.value,
                  }))
                }
              />
            </label>
            <label>
              Кол-во заявок:
              <input
                type="number"
                value={modalData.reqAmount}
                onChange={(e) =>
                  setModalData((m) => ({
                    ...m,
                    reqAmount: e.target.value,
                  }))
                }
              />
            </label>
            <label>
              От кого:
              <input
                type="text"
                value={modalData.fromWho}
                onChange={(e) =>
                  setModalData((m) => ({
                    ...m,
                    fromWho: e.target.value,
                  }))
                }
              />
            </label>
            <label>
              Кол-во факт:
              <input
                type="number"
                value={modalData.amountFact}
                onChange={(e) =>
                  setModalData((m) => ({
                    ...m,
                    amountFact: e.target.value,
                  }))
                }
              />
            </label>
            <label>
              Комментарии:
              <textarea
                value={modalData.comment}
                onChange={(e) =>
                  setModalData((m) => ({
                    ...m,
                    comment: e.target.value,
                  }))
                }
              />
            </label>
            <label>
              Статус:
              <select
                value={modalData.status}
                onChange={(e) =>
                  setModalData((m) => ({
                    ...m,
                    status: e.target.value,
                  }))
                }
              >
                <option value="booked">Бронь</option>
                <option value="occupied">Занято</option>
              </select>
            </label>
            <div className="modal-actions">
              <button onClick={saveBooking}>💾</button>
              {modalData.id && (
                <button onClick={() => handleAction(modalData, "delete")}>
                  ⊘
                </button>
              )}
              <button onClick={closeModal}>✖</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
