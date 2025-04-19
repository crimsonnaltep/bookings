import React, { useState } from "react";

const AddReserveForm = ({ addReserve }) => {
  const [name, setName] = useState(""); // Changed to 'name' for clarity
  const [time, setTime] = useState(""); // Changed to 'time' for clarity
  const [table, setTable] = useState(""); // Changed to 'table' for clarity

  const handleSubmit = (event) => {
    event.preventDefault();
    if (name && time && table) {
      addReserve({ name, time, table }); // Changed to use correct keys (name, time, table)
      setName("");
      setTime("");
      setTable("");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)} // Set name input
        placeholder="Enter reserver name"
      />
      <input
        type="text"
        value={time}
        onChange={(e) => setTime(e.target.value)} // Set time input
        placeholder="Enter reserve time"
      />
      <input
        type="text"
        value={table}
        onChange={(e) => setTable(e.target.value)} // Set table input
        placeholder="Enter reserve table"
      />
      <button type="submit">Add Reservation</button>
    </form>
  );
};

export default AddReserveForm;
