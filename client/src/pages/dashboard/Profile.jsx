import { useState } from 'react';
import Topbar from '../../components/layout/Topbar';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { FormField, Input } from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { userApi } from '../../api/auth';
import { apiErrorMessage } from '../../api/client';
import { useToast } from '../../context/ToastContext';

export default function Profile() {
  const { user, updateUserLocal } = useAuth();
  const toast = useToast();
  const [name, setName] = useState(user?.name || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await userApi.updateProfile({ name, avatarUrl: avatarUrl || undefined });
      updateUserLocal(res.data.user);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not update profile'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Topbar title="Profile" />
      <div className="p-6 max-w-2xl mx-auto">
        <Card>
          <CardHeader title="Account" subtitle="Your basic profile information" />
          <CardBody>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-soft text-lg font-semibold text-primary-hover overflow-hidden">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    name?.[0]?.toUpperCase() || '?'
                  )}
                </div>
                <div className="flex-1">
                  <FormField label="Profile picture URL" htmlFor="avatarUrl">
                    <Input
                      id="avatarUrl"
                      placeholder="https://..."
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                    />
                  </FormField>
                </div>
              </div>

              <FormField label="Name" htmlFor="name" required>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
              </FormField>

              <FormField label="Email" htmlFor="email" hint="Email cannot be changed yet.">
                <Input id="email" value={user?.email || ''} disabled />
              </FormField>

              <div className="flex justify-end">
                <Button type="submit" isLoading={isLoading}>
                  Save changes
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
