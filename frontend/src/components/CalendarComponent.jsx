import React from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import dayjs from "dayjs";

export default function CalendarComponent() {
  // Пример событий — здесь они выступают в роли броней.
  const events = [
    {
      title: "Бронь: Стол 1",
      start: dayjs().hour(14).minute(0).toDate(),
      end: dayjs().hour(15).minute(0).toDate(),
    },
    {
      title: "Бронь: Стол 2",
      start: dayjs().hour(16).minute(30).toDate(),
      end: dayjs().hour(17).minute(30).toDate(),
    },
  ];

  return (
    <div style={{ maxWidth: "100%", overflow: "auto" }}>
      <FullCalendar
        plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
        initialView="timeGridDay"
        nowIndicator={true} // Включает индикатор текущего времени
        slotMinTime="12:00:00" // Начало отображаемого интервала — 12:00
        slotMaxTime="06:00:00" // Конец интервала — 06:00 следующего дня
        events={events} // События (брони)
        eventClick={(arg) => alert("Нажали на бронь: " + arg.event.title)}
        height="auto" // Высота подстраивается под содержимое
        // Вы можете дополнительно настроить внешний вид календаря через CSS
      />
    </div>
  );
}
