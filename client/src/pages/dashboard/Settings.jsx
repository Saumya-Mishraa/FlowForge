import { useState } from 'react';
import Topbar from '../../components/layout/Topbar';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { FormField, Input } from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { userApi } from '../../api/auth';
import { apiErrorMessage } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

const tabs = ['Security', 'Preferences'];

export default function Settings() {
  const [activeTab, setActiveTab] = useState('Security');

  return (
    <>
      <Topbar title="Settings" />
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <div className="flex gap-1 rounded-md border border-line bg-white p-1 w-fit">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 h-8 rounded text-sm font-medium transition-colors ${
                activeTab === tab ? 'bg-primary-soft text-primary-hover' : 'text-ink-secondary hover:text-ink'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'Security' && <SecurityTab />}
        {activeTab === 'Preferences' && <PreferencesTab />}
      </div>
    </>
  );
}

function SecurityTab() {
  const toast = useToast();
  const { user } = useAuth();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isGoogleOnly = user && !user.authProviders?.includes('local');

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.newPassword !== form.confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    setIsLoading(true);
    try {
      await userApi.changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      toast.success('Password updated');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not update password'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader title="Change password" subtitle="Update the password used to sign in" />
      <CardBody>
        {isGoogleOnly ? (
          <p className="text-sm text-ink-secondary">
            This account signs in with Google and doesn&apos;t have a password to change.
          </p>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">
                {error}
              </div>
            )}
            <FormField label="Current password" htmlFor="currentPassword" required>
              <Input
                id="currentPassword"
                type="password"
                value={form.currentPassword}
                onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
              />
            </FormField>
            <FormField label="New password" htmlFor="newPassword" required>
              <Input
                id="newPassword"
                type="password"
                value={form.newPassword}
                onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
              />
            </FormField>
            <FormField label="Confirm new password" htmlFor="confirmPassword" required>
              <Input
                id="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              />
            </FormField>
            <div className="flex justify-end">
              <Button type="submit" isLoading={isLoading}>
                Update password
              </Button>
            </div>
          </form>
        )}
      </CardBody>
    </Card>
  );
}

function PreferencesTab() {
  const { user, updateUserLocal } = useAuth();
  const toast = useToast();
  const [theme, setTheme] = useState(user?.preferences?.theme || 'light');
  const [isLoading, setIsLoading] = useState(false);

  const save = async (nextTheme) => {
    setTheme(nextTheme);
    setIsLoading(true);
    try {
      const res = await userApi.updateProfile({ preferences: { theme: nextTheme } });
      updateUserLocal(res.data.user);
    } catch (err) {
      toast.error('Could not save preference');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader title="Theme" subtitle="Choose how FlowForge looks for you" />
      <CardBody className="flex gap-2">
        {['light', 'dark', 'system'].map((opt) => (
          <button
            key={opt}
            disabled={isLoading}
            onClick={() => save(opt)}
            className={`capitalize px-4 h-9 rounded-md border text-sm font-medium transition-colors ${
              theme === opt ? 'border-primary bg-primary-soft text-primary-hover' : 'border-line text-ink-secondary hover:bg-primary-faint'
            }`}
          >
            {opt}
          </button>
        ))}
      </CardBody>
    </Card>
  );
}
