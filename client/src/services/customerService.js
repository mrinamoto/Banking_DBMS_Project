import api from "./api";
export async function getAllCustomers(params={}){return (await api.get('/customers',{params})).data}
export async function addCustomer(customer){return (await api.post('/customers',customer)).data}
