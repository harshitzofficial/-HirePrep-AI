import { useAuth } from "../hooks/useAuth";
import { Navigate } from "react-router";
import React from 'react'

const Protected = ({children}) => {
    const { loading,user } = useAuth()


    if(loading){
        return (
            <main style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <div className="spinner"></div>
            </main>
        )
    }

    if(!user){
        return <Navigate to={'/login'} /> //If user is not authenticated, redirect to login page
    }
    
    return children
}

export default Protected