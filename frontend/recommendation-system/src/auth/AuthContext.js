import { createContext, useContext, useState, useCallback } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user")) || null
  );

  // userData: { id, email, role, username, first_name, last_name, nationality, avatar_url }
  const login = useCallback((userData) => {
    const enriched = { ...userData, role: userData.role || "tourist" };
    localStorage.setItem("user", JSON.stringify(enriched));
    setUser(enriched);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("user");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
