import api from "./api";
export async function getDashboardStats(){return (await api.get('/dashboard')).data}
