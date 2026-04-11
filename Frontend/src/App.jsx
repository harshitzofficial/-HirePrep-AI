import { RouterProvider } from "react-router"
import { router } from "./app.routes.jsx"
import { AuthProvider } from "./features/auth/auth.context.jsx"
import { InterviewProvider } from "./features/interview/interview.context.jsx"

function App() {

  return (
    <AuthProvider>
      <InterviewProvider>
        <RouterProvider router={router} />
      </InterviewProvider>
    </AuthProvider>
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