import React, { useState, useEffect, useRef } from "react";
import dayjs from "dayjs";
import api from "../api";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";

// Генерируем временные слоты: от 12:00 до 23:30, затем от 0:00 до 5:30
const timeSlots = [];
for (let hour = 12; hour < 24; hour++) {
  timeSlots.push(`${hour}:00`, `${hour}:30`);
}
for (let hour = 0; hour <= 5; hour++) {
  timeSlots.push(`${hour}:00`, `${hour}:30`);
}

// Список столов
const tables = [
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

// Расписание: начало ячеек – 12:00 (720 мин), конец ячеек – 5:30 трактуем как 6:00 следующего дня (1800 мин)
const scheduleStart = 720; // 12:00 → 720 минут
const scheduleEnd = 1800; // 6:00 следующего дня → 1800 минут
const scheduleLength = scheduleEnd - scheduleStart; // 1080 минут

export default function TodayBookingGrid() {
  const today = dayjs();
  const dateKey = today.format("YYYY-MM-DD");

  // Состояния бронирований и выделения интервала
  const [bookings, setBookings] = useState([]);
  const [firstClick, setFirstClick] = useState(null);
  const [selection, setSelection] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    reqAmount: "",
    amountFact: "",
    fromWho: "",
    details: "",
    status: "бронь",
  });
  const [editBooking, setEditBooking] = useState(null);

  // Текущее время, обновляемое каждую секунду
  const [currentTime, setCurrentTime] = useState(dayjs());
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(dayjs());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Отслеживание горизонтального скролла
  const containerRef = useRef(null);
  const [scrollLeft, setScrollLeft] = useState(0);
  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) {
        setScrollLeft(containerRef.current.scrollLeft);
      }
    };
    const container = containerRef.current;
    if (container) container.addEventListener("scroll", handleScroll);
    return () =>
      container && container.removeEventListener("scroll", handleScroll);
  }, []);

  // Для вычисления ширины одной временной ячейки – используем ref на первую ячейку заголовка.
  const cellRef = useRef(null);
  const [cellWidth, setCellWidth] = useState(0);

  // Используем ResizeObserver для отслеживания изменений размеров ячейки (например, при зуме или изменении размера окна)
  useEffect(() => {
    if (!cellRef.current) return;
    const resizeObserver = new ResizeObserver(() => {
      setCellWidth(cellRef.current.getBoundingClientRect().width);
    });
    resizeObserver.observe(cellRef.current);
    // Начальное измерение:
    setCellWidth(cellRef.current.getBoundingClientRect().width);
    return () => resizeObserver.disconnect();
  }, []);

  // Загрузка бронирований для сегодняшнего дня
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await api.get("/");
        const reserves = res.data.detail || [];
        const todayBookings = reserves.map((reserve) => {
          const [start, end] = reserve.time.split("-");
          return { ...reserve, start, end };
        });
        setBookings(todayBookings);
      } catch (err) {
        console.error("Ошибка загрузки бронирований:", err);
      }
    };
    fetchBookings();
  }, []);

  // Нормализация выбранного интервала по ячейкам
  const normalizeInterval = (start, end) => {
    const s = timeSlots.indexOf(start);
    const e = timeSlots.indexOf(end);
    const [from, to] = s <= e ? [s, e] : [e, s];
    return { start: timeSlots[from], end: timeSlots[to] };
  };

  // Проверка, входит ли время (формат "HH:mm") в переданный интервал
  const isWithin = (time, interval) => {
    const parseMinutes = (t) => {
      const [hour, minute] = t.split(":").map(Number);
      return hour * 60 + minute;
    };
    return (
      parseMinutes(time) >= parseMinutes(interval.start) &&
      parseMinutes(time) <= parseMinutes(interval.end)
    );
  };

  // Поиск бронирования для конкретной ячейки (по столу и времени)
  const getBookingForCell = (table, time) => {
    return bookings.find((b) => b.table === table && isWithin(time, b));
  };

  // Обработка клика по ячейке таблицы
  const handleCellClick = (table, time) => {
    const existing = getBookingForCell(table, time);
    if (existing) {
      setEditBooking(existing);
      setFormData({
        name: existing.name || "",
        phone: existing.phone || "",
        reqAmount: existing.reqAmount || "",
        amountFact: existing.amountFact || "",
        fromWho: existing.fromWho || "",
        details: existing.details || "",
        status: existing.status || "бронь",
      });
      return;
    }
    if (!firstClick || firstClick.table !== table) {
      setFirstClick({ table, time });
      setSelection(null);
      setShowForm(false);
    } else {
      const interval = normalizeInterval(firstClick.time, time);
      setSelection({ table, ...interval });
      setShowForm(true);
      setFirstClick(null);
    }
  };

  // Создание новой брони
  const handleBookingCreate = async () => {
    if (!selection || !formData.name || !formData.phone) return;
    const newBooking = {
      ...formData,
      time: `${selection.start}-${selection.end}`,
      table: selection.table,
    };
    try {
      const res = await api.post("/", newBooking);
      const saved = res.data.data;
      setBookings((prev) => [
        ...prev,
        { ...saved, start: selection.start, end: selection.end },
      ]);
    } catch (err) {
      console.error("Ошибка при сохранении брони:", err);
    }
    setFormData({
      name: "",
      phone: "",
      reqAmount: "",
      amountFact: "",
      fromWho: "",
      details: "",
      status: "бронь",
    });
    setSelection(null);
    setShowForm(false);
  };

  // Обновление брони (редактирование) – время остаётся прежним
  const handleUpdateBooking = async () => {
    if (!editBooking) return;
    const updatedBooking = {
      ...formData,
      time: `${editBooking.start}-${editBooking.end}`,
      table: editBooking.table,
    };
    try {
      const res = await api.put(`/${editBooking.id}`, updatedBooking);
      const updated = res.data.data;
      setBookings((prev) =>
        prev.map((b) =>
          b.id === updated.id
            ? {
                ...updated,
                start: updated.time.split("-")[0],
                end: updated.time.split("-")[1],
              }
            : b
        )
      );
      setEditBooking(null);
    } catch (err) {
      console.error("Ошибка при обновлении брони:", err);
    }
  };

  // Удаление брони
  const handleDeleteBooking = async () => {
    if (!editBooking) return;
    try {
      await api.delete(`/${editBooking.id}`);
      setBookings((prev) => prev.filter((b) => b.id !== editBooking.id));
      setEditBooking(null);
    } catch (err) {
      console.error("Ошибка при удалении брони:", err);
    }
  };

  // Рендер вертикального индикатора текущего времени.
  // Если текущее время вне диапазона (до 12:00 или после 6:00 следующего дня) – индикатор «прижимается» к краю.
  // Формула: каждые 30 минут соответствуют ширине одной ячейки.
  // Положение вычисляется с учётом горизонтального скролла.
  const renderTimeIndicator = () => {
    if (!cellWidth) return null;

    // Вычисляем текущее время в минутах
    let nowMinutes = currentTime.hour() * 60 + currentTime.minute();
    // Для времени после полуночи – добавляем 1440, если нужно (т.к. расписание до 6:00 следующего дня)
    if (nowMinutes < scheduleStart) nowMinutes += 1440;

    // Зажимаем время к границам: если время меньше scheduleStart – равняем на scheduleStart; если больше scheduleEnd – scheduleEnd
    if (nowMinutes < scheduleStart) nowMinutes = scheduleStart;
    if (nowMinutes > scheduleEnd) nowMinutes = scheduleEnd;

    // Рассчитываем смещение: разница в минутах делённая на 30 (интервал ячейки)
    const offsetIntervals = (nowMinutes - scheduleStart) / 30;
    const indicatorLeft = cellWidth * offsetIntervals - scrollLeft;

    return (
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: `${indicatorLeft}px`,
          width: "2px",
          backgroundColor: "red",
          zIndex: 3,
        }}
      />
    );
  };

  return (
    <Box p={2}>
      <Typography variant="h4" gutterBottom>
        Бронирования на {today.format("DD.MM.YYYY")}
      </Typography>
      <TableContainer
        component={Paper}
        ref={containerRef}
        sx={{
          width: "100%",
          maxHeight: "80vh",
          overflowX: "auto",
          position: "relative",
        }}
      >
        {renderTimeIndicator()}
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ minWidth: 60, fontWeight: "bold" }}>
                Стол
              </TableCell>
              {timeSlots.map((time, index) => (
                <TableCell
                  key={time}
                  align="center"
                  sx={{ fontSize: 10, minWidth: 40 }}
                  ref={index === 0 ? cellRef : null}
                >
                  {time}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {tables.map((tableName) => (
              <TableRow key={tableName}>
                <TableCell align="center" sx={{ fontWeight: "bold" }}>
                  {tableName}
                </TableCell>
                {timeSlots.map((time) => {
                  const booking = getBookingForCell(tableName, time);
                  const isFirstSelected =
                    firstClick &&
                    tableName === firstClick.table &&
                    time === firstClick.time;
                  const isIntervalSelected =
                    selection &&
                    tableName === selection.table &&
                    isWithin(time, selection);
                  let bgColor = "inherit";
                  if (booking) {
                    bgColor = booking.status === "сели" ? "#4caf50" : "#f44336";
                  } else if (isIntervalSelected) {
                    bgColor = "#90caf9";
                  } else if (isFirstSelected) {
                    bgColor = "#b3e5fc";
                  }
                  return (
                    <TableCell
                      key={time}
                      onClick={() => handleCellClick(tableName, time)}
                      sx={{
                        backgroundColor: bgColor,
                        cursor: "pointer",
                        border: "1px solid #ddd",
                        padding: 0,
                        minWidth: 40,
                        height: 30,
                      }}
                      title={booking ? `${booking.name}, ${booking.phone}` : ""}
                    />
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Форма создания брони */}
      {showForm && selection && (
        <Box mt={2} p={2} border={1} borderRadius={2} bgcolor="#f9f9f9">
          <Typography variant="h6" mb={1}>
            Новая бронь: Стол {selection.table}, {selection.start} –{" "}
            {selection.end}
          </Typography>
          <TextField
            label="ФИО"
            fullWidth
            margin="dense"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <TextField
            label="Телефон"
            fullWidth
            margin="dense"
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
          />
          <TextField
            label="Кол-во заявок"
            fullWidth
            margin="dense"
            value={formData.reqAmount}
            onChange={(e) =>
              setFormData({ ...formData, reqAmount: e.target.value })
            }
          />
          <TextField
            label="Факт. количество"
            fullWidth
            margin="dense"
            value={formData.amountFact}
            onChange={(e) =>
              setFormData({ ...formData, amountFact: e.target.value })
            }
          />
          <TextField
            label="От кого"
            fullWidth
            margin="dense"
            value={formData.fromWho}
            onChange={(e) =>
              setFormData({ ...formData, fromWho: e.target.value })
            }
          />
          <TextField
            label="Примечание"
            fullWidth
            margin="dense"
            value={formData.details}
            onChange={(e) =>
              setFormData({ ...formData, details: e.target.value })
            }
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Статус</InputLabel>
            <Select
              value={formData.status}
              label="Статус"
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value })
              }
            >
              <MenuItem value="бронь">бронь</MenuItem>
              <MenuItem value="сели">сели</MenuItem>
            </Select>
          </FormControl>
          <Box mt={2}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleBookingCreate}
            >
              Подтвердить бронь
            </Button>
            <Button
              variant="outlined"
              sx={{ ml: 2 }}
              onClick={() => {
                setSelection(null);
                setShowForm(false);
              }}
            >
              Отмена
            </Button>
          </Box>
        </Box>
      )}

      {/* Диалог редактирования брони */}
      <Dialog open={Boolean(editBooking)} onClose={() => setEditBooking(null)}>
        <DialogTitle>Редактировать бронь</DialogTitle>
        <DialogContent>
          <TextField
            label="ФИО"
            fullWidth
            margin="dense"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <TextField
            label="Телефон"
            fullWidth
            margin="dense"
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
          />
          <TextField
            label="Кол-во заявок"
            fullWidth
            margin="dense"
            value={formData.reqAmount}
            onChange={(e) =>
              setFormData({ ...formData, reqAmount: e.target.value })
            }
          />
          <TextField
            label="Факт. количество"
            fullWidth
            margin="dense"
            value={formData.amountFact}
            onChange={(e) =>
              setFormData({ ...formData, amountFact: e.target.value })
            }
          />
          <TextField
            label="От кого"
            fullWidth
            margin="dense"
            value={formData.fromWho}
            onChange={(e) =>
              setFormData({ ...formData, fromWho: e.target.value })
            }
          />
          <TextField
            label="Примечание"
            fullWidth
            margin="dense"
            value={formData.details}
            onChange={(e) =>
              setFormData({ ...formData, details: e.target.value })
            }
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Статус</InputLabel>
            <Select
              value={formData.status}
              label="Статус"
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value })
              }
            >
              <MenuItem value="бронь">бронь</MenuItem>
              <MenuItem value="сели">сели</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteBooking} color="error">
            Удалить
          </Button>
          <Button onClick={() => setEditBooking(null)}>Отмена</Button>
          <Button
            onClick={handleUpdateBooking}
            variant="contained"
            color="primary"
          >
            Сохранить изменения
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
