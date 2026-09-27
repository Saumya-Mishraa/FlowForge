import { Link } from 'react-router-dom';
import { CompassIcon } from 'lucide-react';
import Button from '../components/ui/Button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-white">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-soft mb-5">
        <CompassIcon size={24} className="text-primary" />
      </div>
      <h1 className="font-display text-2xl font-semibold text-ink">Page not found</h1>
      <p className="mt-2 text-sm text-ink-secondary max-w-sm">
        The page you're looking for doesn't exist or may have moved.
      </p>
      <Link to="/" className="mt-6">
        <Button>Back to home</Button>
      </Link>
    </div>
  );
}
