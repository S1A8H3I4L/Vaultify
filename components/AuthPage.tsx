import React, { useState, useEffect, useRef } from 'react';
import { Database, Lock, Mail, User as UserIcon, ArrowRight, Loader2, CheckCircle } from 'lucide-react';
import { User } from '../types';
import { db } from '../services/db';

interface AuthPageProps {
  onLogin: (user: User) => void;
}

// Helper to decode JWT ID Token from Google
const parseJwt = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window.atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

export const AuthPage: React.FC<AuthPageProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const googleButtonRef = useRef<HTMLDivElement>(null);

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  // CLIENT ID provided by user
  const GOOGLE_CLIENT_ID = "320202996243-p4823ad360bgkiqdee5nhudnaavj5p5e.apps.googleusercontent.com";

  useEffect(() => {
    // Initialize Google Identity Services
    if (window.google && googleButtonRef.current) {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: 'outline',
        size: 'large',
        width: '100%', // make it responsive
        text: 'continue_with',
      });
    }
  }, [isLogin]); // Re-render button if view changes

  const handleGoogleCredentialResponse = (response: any) => {
    setLoading(true);
    const idToken = response.credential;
    const payload = parseJwt(idToken);

    if (payload) {
      // Create user object from Google Data
      const googleUser: User = {
        id: `google_${payload.sub}`,
        email: payload.email,
        name: payload.name,
        avatarUrl: payload.picture,
        password: '', // No password for OAuth users
      };

      // For Google Auth, we auto-create/login because validation is external
      if (!db.authenticate(googleUser.email)) {
        try {
          db.createUser(googleUser);
        } catch (e) {
          // User exists, just login
        }
      }
      onLogin(googleUser);
    } else {
      setError("Failed to verify Google account.");
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    // Simulate API delay
    setTimeout(() => {
      if (isLogin) {
        // --- LOGIN FLOW ---
        // 1. Check if user exists
        if (!db.userExists(email)) {
          setError('Account not found. Please sign up first.');
          setLoading(false);
          return;
        }

        // 2. Authenticate
        const user = db.authenticate(email, password);
        if (user) {
          onLogin(user);
        } else {
          setError('Invalid email or password.');
        }
      } else {
        // --- SIGNUP FLOW ---
        if (!email || !password || !name) {
          setError('All fields are required.');
          setLoading(false);
          return;
        }

        try {
          const newUser: User = {
            id: `u${Date.now()}`,
            email,
            name,
            password,
            avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
          };

          db.createUser(newUser);

          // Successful Signup: Switch to Login view
          setIsLogin(true);
          setSuccessMsg('Account created successfully! Please log in.');
          setPassword(''); // Clear password for security
        } catch (e: any) {
          // Handle Duplicate User
          if (e.message === 'User already exists') {
            setError('Account already exists. Please log in.');
          } else {
            setError(e.message);
          }
        }
      }
      setLoading(false);
    }, 1000);
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setSuccessMsg('');
    setPassword(''); // clear password when switching
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="p-8 pb-6 text-center">
          <img
            src="/Logo.png"
            alt="Vaultify Logo"
            className="w-12 h-12 object-contain mx-auto"
          />
          <h1 className="text-2xl font-bold text-slate-800">
            {isLogin ? 'Welcome back' : 'Create account'}
          </h1>
          <p className="text-slate-500 mt-2 text-sm">
            {isLogin
              ? 'Enter your credentials to access your vault.'
              : 'Sign up for secure, scalable cloud storage.'}
          </p>
        </div>

        <div className="px-8 pb-4">
          {/* Real Google Button Container */}
          <div className="w-full flex justify-center h-[40px] mb-6">
            <div ref={googleButtonRef} className="w-full"></div>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-slate-500">Or continue with email</span>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-4">
          {!isLogin && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 uppercase">Full Name</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                  placeholder="Sahil Panchal"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 uppercase">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                placeholder="sahil@gmail.com"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 uppercase">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          {successMsg && (
            <div className="p-3 bg-green-50 text-green-700 text-sm rounded-lg flex items-center gap-2 border border-green-200">
              <CheckCircle size={16} className="text-green-600" />
              {successMsg}
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2 border border-red-100">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-medium py-2.5 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 mt-2 shadow-lg shadow-blue-500/20"
          >
            {loading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <>
                {isLogin ? 'Sign In' : 'Create Account'}
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-sm text-slate-600">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={toggleMode}
              className="text-blue-600 font-semibold hover:underline"
            >
              {isLogin ? 'Sign up' : 'Log in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};