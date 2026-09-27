import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { PageSpinner } from '../../components/ui/Feedback';

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setSessionFromTokens } = useAuth();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');

    if (!accessToken || !refreshToken) {
      navigate('/login?error=google', { replace: true });
      return;
    }

    setSessionFromTokens({ accessToken, refreshToken }).then(() => {
      navigate('/app', { replace: true });
    });
  }, [searchParams, navigate, setSessionFromTokens]);

  return <PageSpinner />;
}
