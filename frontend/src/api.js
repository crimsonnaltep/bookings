import axios from "axios";

const api = axios.create({
  baseURL: "http://37.9.4.42",
});

export default api;
