import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../../layouts/AuthLayout';
import { FormField, Input } from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import GoogleButton from '../../components/auth/GoogleButton';
import { useAuth } from '../../context/AuthContext';
import { apiErrorMessage } from '../../api/client';

const initialForm = { name: '', email: '', password: '', confirmPassword: '' };

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    const errors = {};
    if (!form.name.trim()) errors.name = 'Name is required';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) errors.email = 'Enter a valid email';
    if (form.password.length < 8) errors.password = 'Must be at least 8 characters';
    else if (!/[A-Za-z]/.test(form.password) || !/[0-9]/.test(form.password)) {
      errors.password = 'Must include a letter and a number';
    }
    if (form.confirmPassword !== form.password) errors.confirmPassword = 'Passwords do not match';
    return errors;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;

    setIsLoading(true);
    try {
      await register(form);
      navigate('/app', { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not create your account.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start testing and automating APIs in minutes."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary hover:text-primary-hover">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {error && (
          <div className="rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">
            {error}
          </div>
        )}

        <FormField label="Name" htmlFor="name" required error={fieldErrors.name}>
          <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </FormField>

        <FormField label="Email" htmlFor="email" required error={fieldErrors.email}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </FormField>

        <FormField
          label="Password"
          htmlFor="password"
          required
          error={fieldErrors.password}
          hint={!fieldErrors.password ? 'At least 8 characters, with a letter and a number' : undefined}
        >
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </FormField>

        <FormField
          label="Confirm password"
          htmlFor="confirmPassword"
          required
          error={fieldErrors.confirmPassword}
        >
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
          />
        </FormField>

        <Button type="submit" className="w-full" isLoading={isLoading}>
          Create account
        </Button>

        <div className="flex items-center gap-3 py-1">
          <div className="h-px flex-1 bg-line" />
          <span className="text-xs text-ink-secondary">or</span>
          <div className="h-px flex-1 bg-line" />
        </div>

        <GoogleButton />
      </form>
    </AuthLayout>
  );
}
