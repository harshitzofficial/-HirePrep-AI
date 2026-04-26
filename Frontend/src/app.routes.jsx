import { createBrowserRouter, Navigate } from "react-router";
import Login from "./features/auth/pages/Login";
import Register from "./features/auth/pages/Register";
import Protected from "./features/auth/components/Protected";
import Home from "./features/interview/pages/Home";
import Interview from "./features/interview/pages/Interview";
// 1. Import the new component
import LiveInterview from "./features/interview/pages/LiveInterview"; 
import MockHistory from "./features/interview/pages/MockHistory"; // 🟢 Import History Page

import Landing from "./features/public/pages/Landing";

export const router = createBrowserRouter([
    {
        path: "/login",
        element: <Login />
    },
    {
        path: "/register",
        element: <Register />
    },
    {
        path: "/",
        element: <Landing />
    },
    {
        path: "/dashboard",
        element: <Protected><Home /></Protected>
    },
    {
        path: "/history", // 🟢 Add History Route
        element: <Protected><MockHistory /></Protected>
    },
    {
        path:"/interview/:interviewId",
        element: <Protected><Interview /></Protected>
    },
    //Add the Live Interview route
    {
        path: "/interview/:interviewId/live",
        element: <Protected><LiveInterview /></Protected>
    },
    // Fix #11: catch-all route — prevents blank white screen on unknown URLs
    {
        path: "*",
        element: <Navigate to="/" replace />
    }
]) 