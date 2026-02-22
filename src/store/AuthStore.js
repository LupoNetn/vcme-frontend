import { create } from "zustand"
import { persist } from "zustand/middleware"
import api from "../lib/axios"

const useAuthStore = create(
    persist(
        (set) => ({
            user: null,
            loading: false,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            
            login: async (data) => {
                set({ loading: true })
                try {
                    const res = await api.post("/auth/login", data)
                    if (res.data.accessToken) {
                        localStorage.setItem("accessToken", res.data.accessToken)
                        localStorage.setItem("refreshToken", res.data.refreshToken)
                    }
                    set({ 
                        user: res.data.user, 
                        accessToken: res.data.accessToken, 
                        refreshToken: res.data.refreshToken, 
                        isAuthenticated: true 
                    })
                    return res
                } catch (error) {
                    console.error("Login error:", error)
                    return error
                } finally {
                    set({ loading: false })
                }
            },
            
            signup: async (data) => {
                set({ loading: true })
                try {
                    const res = await api.post("/auth/signup", data)
                    if (res.data.accessToken) {
                        localStorage.setItem("accessToken", res.data.accessToken)
                        localStorage.setItem("refreshToken", res.data.refreshToken)
                    }
                    return res
                } catch (error) {
                    console.error("Signup error:", error)
                    return error
                } finally {
                    set({ loading: false })
                }
            },
            
            logout: () => {
                localStorage.removeItem("accessToken")
                localStorage.removeItem("refreshToken")
                set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false })
            },
        }),
        {
            name: "auth-storage",
        }
    )
)

export default useAuthStore