import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router'
import "@features/auth/styles/auth.form.scss"
import { useAuth } from '../hooks/useAuth'

const Register = () => {
    const navigate = useNavigate()
    const [username, setUsername] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    
    // 1. Add an error state
    const [error, setError] = useState(null)

    const { loading, handleRegister } = useAuth()
    
    const handleSubmit = async (e) => {
        e.preventDefault()
        setError(null) // Clear previous errors

        // 2. Capture the result from handleRegister
        const result = await handleRegister({ username, email, password })
        
        // 3. Only navigate if success is true
        if (result.success) {
            navigate("/dashboard")
        } else {
            // 4. Set the error message to display to the user
            setError(result.message)
        }
    }

    if (loading) {
        return (
            <main style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <div className="spinner"></div>
            </main>
        )
    }

    return (
        <main>
            <div className="form-container">
                <h1>Register</h1>
                
                {/* 5. Display the error message if it exists */}
                {error && <p style={{ color: 'red', marginBottom: '1rem' }}>{error}</p>}

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label htmlFor="username">Username</label>
                        <input
                            onChange={(e) => { setUsername(e.target.value) }}
                            type="text" id="username" name='username' placeholder='Enter username' required />
                    </div>
                    <div className="input-group">
                        <label htmlFor="email">Email</label>
                        <input
                            onChange={(e) => { setEmail(e.target.value) }}
                            type="email" id="email" name='email' placeholder='Enter email address' required />
                    </div>
                    <div className="input-group">
                        <label htmlFor="password">Password</label>
                        <input
                            onChange={(e) => { setPassword(e.target.value) }}
                            type="password" id="password" name='password' placeholder='Enter password' required />
                    </div>

                    <button className='button primary-button'>Register</button>
                </form>

                <p>Already have an account? <Link to={"/login"}>Login</Link></p>
            </div>
        </main>
    )
}

export default Register