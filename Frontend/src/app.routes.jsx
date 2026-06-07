import { createBrowserRouter, Navigate } from "react-router";
import Login from "./features/auth/pages/Login";
import Register from "./features/auth/pages/Register";
import Protected from "./features/auth/components/Protected";
import Home from "./features/interview/pages/Home";
import Interview from "./features/interview/pages/Interview";
import LiveInterview from "./features/interview/pages/LiveInterview"; 
import MockHistory from "./features/interview/pages/MockHistory";

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
        path: "/history", 
        element: <Protected><MockHistory /></Protected>
    },
    {
        path:"/interview/:interviewId",
        element: <Protected><Interview /></Protected>
    },
    {
        path: "/interview/:interviewId/live",
        element: <Protected><LiveInterview /></Protected>
    },
    {
        path: "*",
        element: <Navigate to="/" replace />
    }
]) 