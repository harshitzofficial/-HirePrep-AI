import React,{useState} from 'react'
import { useNavigate, Link } from 'react-router'
import "@features/auth/styles/auth.form.scss"
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast';

const Login = () => {

    const { loading, handleLogin } = useAuth()
    const navigate = useNavigate()

    const [ email, setEmail ] = useState("")
    const [ password, setPassword ] = useState("")

    const handleSubmit = async (e) => {
        e.preventDefault();  //Stops page reload ✅ Prevents the default browser behavior
        
        // 1. Capture the result of the login attempt
        const { success, message } = await handleLogin({ email, password });
        
        // 2. ONLY navigate if success is true
        if (success) {
            navigate('/dashboard');
        } else {
            // Show the specific error message from the backend or network
            toast.error(message || "Invalid credentials. Please try again.");
        }
    }

    if(loading){
        return (
            <main style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <div className="spinner"></div>
            </main>
        )
    }


    return (
        <main>
            <div className="form-container">
                <h1>Login</h1>
                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label htmlFor="email">Email</label>
                        <input
                            onChange={(e) => { setEmail(e.target.value) }}
                            type="email" id="email" name='email' placeholder='Enter email address' />
                    </div>
                    <div className="input-group">
                        <label htmlFor="password">Password</label>
                        <input
                            onChange={(e) => { setPassword(e.target.value) }}
                            type="password" id="password" name='password' placeholder='Enter password' />
                    </div>
                    <button className='button primary-button' >Login</button>
                </form>
                <p>Don't have an account? <Link to={"/register"} >Register</Link> </p>
            </div>
        </main>
    )
}

export default Login