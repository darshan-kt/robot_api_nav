import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { session, loading } = useAuth()
    const location = useLocation()

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    if (!session) {
        return <Navigate to="/login" state={{ from: location, message: 'Session expired, please sign in again' }} replace />
    }

    return <>{children}</>
}
