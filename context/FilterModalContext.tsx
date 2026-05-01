import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import api from "../utils/api";
import { useAuthContext } from "./AuthContext";

interface FilterValues {
  ageRange: [number, number];
  distance: number;
  gender: string;
}

interface FilterModalContextType {
  isVisible: boolean;
  showModal: () => void;
  hideModal: () => void;
  filterValues: FilterValues;
  setFilterValues: (values: FilterValues) => void;
}

const FilterModalContext = createContext<FilterModalContextType | undefined>(
  undefined
);

export const useFilterModal = () => {
  const context = useContext(FilterModalContext);
  if (!context) {
    throw new Error("useFilterModal must be used within a FilterModalProvider");
  }
  return context;
};

export const FilterModalProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const [filterValues, setFilterValuesState] = useState<FilterValues>({
    ageRange: [18, 99],
    distance: 50,
    gender: "any", // default za nove korisnike
  });
  const { user } = useAuthContext();

  // Load filter values from backend on mount (if user exists)
  useEffect(() => {
    const fetchFilters = async () => {
      if (!user || !user.token) return;
      console.log("🔍 [FILTER PROVIDER] Šaljem GET zahtev na /api/user/filters sa tokenom:", user.token);
      try {
        const res = await api.get("/api/user/filters", {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        console.log("✅ [FILTER PROVIDER] Odgovor sa /api/user/filters:", res.data);
        if (res.data && res.data.filters) {
          // Ako backend ne vrati pol, koristi "any" kao default
          setFilterValuesState({
            ageRange: res.data.filters.ageRange || [18, 99],
            distance: res.data.filters.distance ?? 50,
            gender: res.data.filters.gender ?? "any",
          });
          console.log("[FILTER PROVIDER] State postavljen na:", {
            ageRange: res.data.filters.ageRange || [18, 99],
            distance: res.data.filters.distance ?? 50,
            gender: res.data.filters.gender ?? "any",
          });
        }
      } catch (err) {
        console.log("[FILTER PROVIDER] Greška pri povlačenju filtera:", err);
        // fallback: keep default
      }
    };
    fetchFilters();
  }, [user]);

  // Save filter values to backend
  const setFilterValues = useCallback(
    async (values: FilterValues) => {
      setFilterValuesState(values);
      if (user && user.token) {
        console.log("🔍 [FILTER PROVIDER] Šaljem PATCH zahtev na /api/user/filters sa podacima:", values);
        try {
          await api.patch(
            "/api/user/filters",
            { filters: values },
            { headers: { Authorization: `Bearer ${user.token}` } }
          );
          console.log("✅ [FILTER PROVIDER] Uspešno ažurirani filteri na backendu.");
        } catch (err) {
          // fallback: ignore error
        }
      }
    },
    [user]
  );

  const showModal = () => setIsVisible(true);
  const hideModal = () => setIsVisible(false);

  return (
    <FilterModalContext.Provider
      value={{ isVisible, showModal, hideModal, filterValues, setFilterValues }}
    >
      {children}
    </FilterModalContext.Provider>
  );
};
