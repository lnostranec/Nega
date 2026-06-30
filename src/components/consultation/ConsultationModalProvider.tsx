"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { ConsultationModal } from "./ConsultationModal";

type ConsultationModalContextValue = {
  openConsultation: () => void;
  closeConsultation: () => void;
};

const ConsultationModalContext = createContext<ConsultationModalContextValue | null>(
  null,
);

export function ConsultationModalProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  const openConsultation = useCallback(() => setOpen(true), []);
  const closeConsultation = useCallback(() => setOpen(false), []);

  return (
    <ConsultationModalContext.Provider value={{ openConsultation, closeConsultation }}>
      {children}
      <ConsultationModal open={open} onClose={closeConsultation} />
    </ConsultationModalContext.Provider>
  );
}

export function useConsultationModal() {
  const context = useContext(ConsultationModalContext);
  if (!context) {
    throw new Error("useConsultationModal must be used within ConsultationModalProvider");
  }
  return context;
}
