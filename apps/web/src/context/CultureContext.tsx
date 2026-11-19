"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type Culture = "aceh" | "kalimantan";

interface CultureContextType {
  culture: Culture;
  setCulture: (c: Culture) => void;
}

const CultureContext = createContext<CultureContextType>({
  culture: "aceh",
  setCulture: () => {},
});

export function CultureProvider({
  children,
  initialCulture = "aceh",
}: {
  children: React.ReactNode;
  initialCulture?: Culture;
}) {
  const [culture, setCultureState] = useState<Culture>(initialCulture);

  useEffect(() => {
    // Baca dari cookie atau localStorage saat mount jika initialCulture belum terisi dari server
    const stored =
      document.cookie
        .split("; ")
        .find((row) => row.startsWith("culture="))
        ?.split("=")[1] as Culture | undefined;
    const resolved: Culture = stored === "kalimantan" ? "kalimantan" : "aceh";
    setCultureState(resolved);
    document.documentElement.dataset.culture = resolved;
  }, []);

  const setCulture = (next: Culture) => {
    document.documentElement.dataset.culture = next;
    document.cookie = `culture=${next}; path=/; max-age=31536000; samesite=lax`;
    setCultureState(next);
  };

  return (
    <CultureContext.Provider value={{ culture, setCulture }}>
      {children}
    </CultureContext.Provider>
  );
}

export function useCulture() {
  return useContext(CultureContext);
}

export { CultureContext };

