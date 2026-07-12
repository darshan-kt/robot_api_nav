import { useEffect, useState } from 'react'

export function useAuth() {
    const [user] = useState({ id: 'local-user', email: 'admin@robot.local' })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Simulate immediate loading of user
        const timer = setTimeout(() => setLoading(false), 100);
        return () => clearTimeout(timer);
    }, [])

    const signIn = async (): Promise<{ error: { message: string } | null }> => { return { error: null } }
    const signUp = async (): Promise<{ error: { message: string } | null }> => { return { error: null } }
    const signOut = async (): Promise<{ error: { message: string } | null }> => {
        window.dispatchEvent(new CustomEvent('auth-logout'))
        return { error: null }
    }

    return { session: { user }, user, loading, signIn, signUp, signOut }
}
