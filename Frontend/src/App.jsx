import { RouterProvider } from "react-router"
import { router } from "./app.routes.jsx"
import { AuthProvider } from "@features/auth/contexts/auth.context.jsx"
import ErrorBoundary from "./components/ErrorBoundary.jsx"
import { Toaster } from 'react-hot-toast';
function App() {

  return (
    <ErrorBoundary>
      <AuthProvider>
        <Toaster position="top-center" toastOptions={{
            style: { background: '#18181b', color: '#fafafa', border: '1px solid #3f3f46' }
        }} />
        <RouterProvider router={router} />
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App

/**
main.jsx
   ↓
<App />
   ↓
AuthProvider → manages user login state
   ↓
InterviewProvider → manages interview-related data
   ↓
RouterProvider → loads pages based on URL
   ↓
Pages → LiveInterview, Dashboard, etc.
 */