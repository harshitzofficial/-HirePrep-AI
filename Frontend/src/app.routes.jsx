import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate, Outlet } from "react-router";
import { InterviewProvider } from "@features/interview/contexts/interview.context.jsx";
import RouteErrorBoundary from "@components/RouteErrorBoundary";

// ── Eagerly loaded (tiny, always needed immediately) ──────────────────────────
import Protected from "@features/auth/components/Protected";

// ── Lazily loaded (split into separate JS chunks by Vite) ─────────────────────
// Each page is only downloaded when the user navigates to it for the first time.
const Login        = lazy(() => import("./features/auth/pages/Login"));
const Register     = lazy(() => import("./features/auth/pages/Register"));
const Landing      = lazy(() => import("./features/public/pages/Landing"));
const Home         = lazy(() => import("./features/interview/pages/Home"));
const Interview    = lazy(() => import("./features/interview/pages/Interview"));
const LiveInterview= lazy(() => import("./features/interview/pages/LiveInterview"));
const MockHistory  = lazy(() => import("./features/interview/pages/MockHistory"));

// ── Shared loading fallback ───────────────────────────────────────────────────
const PageLoader = () => (
    <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: "var(--bg-dark)",
    }}>
        <div className="spinner" />
    </div>
);

// ── Helper: wraps any element in Suspense with the shared loader ──────────────
const S = (element) => <Suspense fallback={<PageLoader />}>{element}</Suspense>;

// ── Layout Wrapper for Interview Routes ──────────────────────────────────────
const InterviewLayout = () => (
    <InterviewProvider>
        <Outlet />
    </InterviewProvider>
);

export const router = createBrowserRouter([
    {
        element: <Outlet />, // Invisible layout that acts as an error boundary boundary
        errorElement: <RouteErrorBoundary />,
        children: [
            {
                path: "/login",
                element: S(<Login />)
            },
            {
                path: "/register",
                element: S(<Register />)
            },
            {
                path: "/",
                element: S(<Landing />)
            },
            {
                // Wrap all interview-related routes in the InterviewProvider
                element: <InterviewLayout />,
                children: [
                    {
                        path: "/dashboard",
                        element: <Protected>{S(<Home />)}</Protected>
                    },
                    {
                        path: "/history",
                        element: <Protected>{S(<MockHistory />)}</Protected>
                    },
                    {
                        path: "/interview/:interviewId",
                        element: <Protected>{S(<Interview />)}</Protected>
                    },
                    {
                        path: "/interview/:interviewId/live",
                        element: <Protected>{S(<LiveInterview />)}</Protected>
                    }
                ]
            },
            {
                path: "*",
                element: <Navigate to="/" replace />
            }
        ]
    }
]);