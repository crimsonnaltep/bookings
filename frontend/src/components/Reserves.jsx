import React, { useEffect, useState } from "react";
import api from "../api.js";
import AddReserveForm from "./AddReserveForm";
import {
  ScheduleComponent,
  Inject,
  Day,
  Week,
  WorkWeek,
  Month,
  Agenda,
} from "@syncfusion/ej2-react-schedule";
import "@syncfusion/ej2-base/styles/material.css";
import "@syncfusion/ej2-react-schedule/styles/material.css";

const ReservesList = () => {
  const [reserves, setReserves] = useState([]);

  // Fetch reserves data from API
  const fetchReserves = async () => {
    try {
      const response = await api.get("/");
      console.log(response.data); // Debugging: Check API response
      setReserves(response.data.detail || []); // Handle potential undefined cases
    } catch (error) {
      console.error("Error fetching reserves", error);
    }
  };

  // Add a new reserve to the database via API
  const addReserve = async (reserve) => {
    try {
      await api.post("/", reserve);
      fetchReserves();
    } catch (error) {
      console.error("Error adding reservation", error);
    }
  };

  // Transform reserves to match Syncfusion Scheduler format
  const transformReservesToSchedulerEvents = (reserves) => {
    return reserves.map((reserve, index) => ({
      Id: index + 1,
      Subject: reserve.name,
      StartTime: new Date(reserve.time),
      EndTime: new Date(new Date(reserve.time).getTime() + 60 * 60 * 1000), // 1-hour duration
    }));
  };

  useEffect(() => {
    fetchReserves();
  }, []);

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
      <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
        Reservations Schedule
      </h2>
      <div
        style={{
          background: "#fff",
          padding: "15px",
          borderRadius: "10px",
          boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
        }}
      >
        <ScheduleComponent
          width="100%"
          height="650px"
          selectedDate={new Date()}
          eventSettings={{
            dataSource: transformReservesToSchedulerEvents(reserves),
          }}
        >
          <Inject services={[Day, Week, WorkWeek, Month, Agenda]} />
        </ScheduleComponent>
      </div>
      <div style={{ marginTop: "20px", textAlign: "center" }}>
        <h3>Reservation List</h3>
        <ul
          style={{
            listStyleType: "none",
            padding: 0,
            background: "#f9f9f9",
            borderRadius: "10px",
            padding: "15px",
            boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
          }}
        >
          {reserves.length > 0 ? (
            reserves.map((reserve, index) => (
              <li
                key={index}
                style={{ padding: "10px", borderBottom: "1px solid #ddd" }}
              >
                <strong>{reserve.name}</strong> - {reserve.time} - Table{" "}
                {reserve.table}
              </li>
            ))
          ) : (
            <p>No reservations found.</p>
          )}
        </ul>
      </div>
      <div style={{ marginTop: "20px" }}>
        <AddReserveForm addReserve={addReserve} />
      </div>
    </div>
  );
};

export default ReservesList;
