import { useEffect, useState } from "react";
import api from "../services/api";
import { BankProfileContext } from "./BankProfileContext";

export function BankProfileProvider({ children }) {
  const [bank, setBank] = useState(null);
  useEffect(() => {
    let active = true;
    api.get("/bank-profile").then(({ data }) => { if (active) setBank(data); }).catch(() => { if (active) setBank(null); });
    return () => { active = false; };
  }, []);
  return <BankProfileContext.Provider value={{ bank }}>{children}</BankProfileContext.Provider>;
}
