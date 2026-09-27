import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../../layouts/AuthLayout';
import { FormField, Input } from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { authApi } from '../../api/auth';
import { apiErrorMessage } from '../../api/client';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [devUrl, setDevUrl] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const res = await authApi.forgotPassword(email);
      setSent(true);
      if (res.devResetUrl) setDevUrl(res.devResetUrl);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="We'll send a reset link to your email address."
      footer={
        <Link to="/login" className="font-medium text-primary hover:text-primary-hover">
          Back to sign in
        </Link>
      }
    >
      {sent ? (
        <div className="rounded-md border border-line bg-primary-faint px-4 py-3 text-sm text-ink">
          If that email exists, a reset link has been sent. Check your inbox.
          {devUrl && (
            <p className="mt-2 text-xs text-ink-secondary break-all">
              Dev mode — no email service configured, use this link directly:{' '}
              <a href={devUrl} className="text-primary underline">
                {devUrl}
              </a>
            </p>
          )}
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">
              {error}
            </div>
          )}
          <FormField label="Email" htmlFor="email" required>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </FormField>
          <Button type="submit" className="w-full" isLoading={isLoading}>
            Send reset link
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
