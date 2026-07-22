import axios from "axios";
const api=axios.create({baseURL:import.meta.env.VITE_API_URL||"/api",timeout:15000});
api.interceptors.request.use(config=>{const token=localStorage.getItem("bank_token");if(token)config.headers.Authorization=`Bearer ${token}`;return config});
api.interceptors.response.use(r=>r,e=>{if(e.response?.status===401){localStorage.removeItem("bank_token");localStorage.removeItem("bank_user");if(location.pathname!=="/login")location.assign("/login")}return Promise.reject(e)});
export function messageFrom(error){return error.response?.data?.message||"Unable to complete the request."}
export default api;
