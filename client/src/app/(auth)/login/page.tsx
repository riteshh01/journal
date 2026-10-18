'use client';

import React, { useState } from 'react';
import { Lock, Mail, AlertCircle, BookOpen } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { ThemeToggle } from '../../../components/layout/ThemeToggle';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 bg-background">
      {/* Top right theme toggle */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm">
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-accent text-accent-contrast rounded-lg flex items-center justify-center font-bold text-xl mx-auto mb-3 shadow-none">
            J
          </div>
          <h1 className="text-xl font-bold text-text tracking-tight">Personal Life Journal</h1>
          <p className="text-xs text-text-muted mt-1">Single-user private sanctuary</p>
        </div>

        {/* Login Card */}
        <div className="bg-surface border border-border rounded-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div
                role="alert"
                className="p-3 bg-background border border-[#DC2626] rounded-md text-xs text-[#DC2626] flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Input
              label="Email Address"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="owner@journal.local"
              autoFocus
            />

            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
            />

            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={loading}
              className="w-full mt-2"
            >
              Sign In
            </Button>
          </form>
        </div>

        <p className="text-center text-[11px] text-text-muted mt-6">
          Authorized owner access only. Public registration is permanently disabled.
        </p>
      </div>
    </div>
  );
}
