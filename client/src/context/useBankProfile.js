import { useContext } from "react";
import { BankProfileContext } from "./BankProfileContext";

export function useBankProfile() {
  return useContext(BankProfileContext);
}
