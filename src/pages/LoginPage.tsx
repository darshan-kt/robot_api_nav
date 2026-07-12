import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Bot, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

export function LoginPage() {
    const navigate = useNavigate()
    const { signIn, session, loading: authLoading } = useAuth()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)

    const location = useLocation()
    const [errorMsg, setErrorMsg] = useState(location.state?.message || '')
    const [loading, setLoading] = useState(false)

    const [failedAttempts, setFailedAttempts] = useState<number[]>([])
    const [lockoutTimer, setLockoutTimer] = useState(0)

    useEffect(() => {
        if (session) {
            navigate('/store', { replace: true })
        }
    }, [session, navigate])

    useEffect(() => {
        if (lockoutTimer > 0) {
            const timer = setTimeout(() => setLockoutTimer((t) => t - 1), 1000)
            return () => clearTimeout(timer)
        }
    }, [lockoutTimer])

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault()
        if (lockoutTimer > 0) return

        const now = Date.now()
        const recentFails = failedAttempts.filter(t => now - t < 60000)

        if (recentFails.length >= 5) {
            setLockoutTimer(30)
            setErrorMsg(`Too many failed attempts. Try again in 30s.`)
            return
        }

        setLoading(true)
        setErrorMsg('')

        try {
            const { error: signInError } = await signIn()
            if (signInError) {
                const newFails = [...recentFails, Date.now()]
                setFailedAttempts(newFails)
                if (newFails.length >= 5) {
                    setLockoutTimer(30)
                    setErrorMsg(`Too many attempts, try again in 30s`)
                } else {
                    setErrorMsg(signInError.message)
                }
            }
        } catch (err: any) {
            setErrorMsg(err.message || 'Authentication failed')
        }

        setLoading(false)
    }

    if (authLoading) return null

    return (
        <div className="min-h-screen bg-background relative flex items-center justify-center p-4">
            {/* Background patterns */}
            <div className="absolute inset-0 pointer-events-none" style={{
                backgroundImage: 'radial-gradient(circle at center, rgba(0,229,160,0.06) 0%, transparent 70%), linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
                backgroundSize: '100% 100%, 40px 40px, 40px 40px'
            }} />

            <style>{`
        @keyframes slideUpFade {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-entry {
          animation: slideUpFade 0.6s ease-out forwards;
        }
      `}</style>

            <div className="animate-entry w-full max-w-md bg-card border border-border rounded-xl shadow-2xl relative z-10 flex flex-col items-center pt-8 pb-6 px-8">

                <div className="w-[72px] h-[72px] rounded-2xl bg-accent/20 flex items-center justify-center mb-6 border border-accent/20 shadow-[0_0_20px_rgba(0,229,160,0.1)]">
                    <Bot className="w-10 h-10 text-accent" />
                </div>

                <h1 className="font-mono text-3xl font-bold tracking-wider mb-1">
                    <span className="text-text">ROBO</span>
                    <span className="text-accent">STORE</span>
                </h1>
                <p className="text-textMuted text-sm mb-8">Robot Application Platform</p>

                {errorMsg && (
                    <div className="w-full bg-danger/10 border border-danger text-danger text-sm px-4 py-3 rounded-lg mb-6 text-center">
                        {errorMsg}
                    </div>
                )}

                <form onSubmit={handleAuth} className="w-full space-y-4">
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-textMuted" />
                        <input
                            type="email"
                            required
                            placeholder="pilot@robostore.io"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-surface border border-border rounded-lg py-3 pl-10 pr-4 text-text placeholder-textMuted focus:outline-none focus:border-accent transition-colors"
                        />
                    </div>

                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-textMuted" />
                        <input
                            type={showPassword ? "text" : "password"}
                            required
                            placeholder="••••••••"
                            value={password}
                            autoComplete="off"
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-surface border border-border rounded-lg py-3 pl-10 pr-10 text-text placeholder-textMuted focus:outline-none focus:border-accent transition-colors tracking-[0.2em]"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-textMuted hover:text-text transition-colors flex items-center"
                        >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || lockoutTimer > 0}
                        className="w-full bg-accent hover:bg-accent/90 text-background font-semibold py-3 rounded-lg transition-colors flex items-center justify-center mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                Authenticating...
                            </>
                        ) : lockoutTimer > 0 ? (
                            `Locked out (${lockoutTimer}s)`
                        ) : (
                            'Sign In'
                        )}
                    </button>
                </form>

                <p className="mt-6 text-sm text-textMuted">
                    Enter any email + 6-digit password to get started
                </p>

                <div className="mt-8 font-mono text-[11px] text-textMuted">
                    ROBOSTORE v2.4.0 · Secure Connection
                </div>
            </div>
        </div>
    )
}
