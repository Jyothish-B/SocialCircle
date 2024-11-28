import { create } from "zustand";
import { persist } from "zustand/middleware";
import { loginAPI } from "../../lib/api";

const useAuth = create(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      error: null,

      login: async (username) => {
        try {
          const { data } = await loginAPI(username);
          set({
            user: data,
            isAuthenticated: true,
            error: null,
          });
          return data;
        } catch (error) {
          set({
            user: null,
            isAuthenticated: false,
            error: error.response?.data?.error || "Login failed",
          });
          throw error;
        }
      },

      logout: () =>
        set({
          user: null,
          isAuthenticated: false,
          error: null,
        }),
    }),
    {
      name: "auth-storage",
    }
  )
);

export default useAuth;
