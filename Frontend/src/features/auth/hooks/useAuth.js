import { useContext, useEffect } from "react";
import { AuthContext } from "../auth.context";
import { login, register, logout, getMe } from "../services/auth.api";



export const useAuth = () => {

    const context = useContext(AuthContext)
    const { user, setUser, loading, setLoading } = context

//Makes API call to log in user, updates user state, returns success/failure
    const handleLogin = async ({ email, password }) => {
        setLoading(true);
        try {
            const data = await login({ email, password });
            // Safety Check: Ensure data and data.user exist
            if (data && data.user) {
                setUser(data.user);
                return { success: true };
            } else {
                return { success: false, message: "Invalid response from server" };
            }
        } catch (err) {
            console.error("Login Error:", err);
            const errorMsg = err.response?.data?.message || err.message || "An unexpected error occurred";
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    };

    //Makes API call to register user, sets user data, returns error message if fails
    const handleRegister = async ({ username, email, password }) => {
        setLoading(true);
        try {
            const data = await register({ username, email, password });
            setUser(data.user);
            return { success: true }; 
        } catch (err) {
            // Capture the error message from the backend
            const errorMsg = err.response?.data?.message || "Registration failed";
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    };

    //Calls logout API and clears user state

    const handleLogout = async () => {
        setLoading(true)
        try {
            const data = await logout()
            setUser(null)
        } catch (err) {

        } finally {
            setLoading(false)
        }
    }


    //On component mount, fetches current user data (to persist login across page refreshes)
    useEffect(() => {

        const getAndSetUser = async () => {
            try {

                const data = await getMe()
                setUser(data.user)
            } catch (err) { } finally {
                setLoading(false)
            }
        }

        getAndSetUser()

    },[])

    return { user, loading, handleRegister, handleLogin, handleLogout }
}