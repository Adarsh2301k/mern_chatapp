import axios from 'axios';

export const axiosInstance = axios.create({
  baseURL: import.meta.env.MODE==="development" ? 'http://localhost:5000/api' :"/api", 
  // Replace with your API base URL
  withCredentials: true, // Include credentials (cookies) in requests
  
});