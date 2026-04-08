import { useCallback, useMemo } from 'react';
import { loadCurrentUser } from '../store/slices/authSlice';
import { useAppDispatch, useAppSelector } from '../store/hooks';

export function useAuth() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const loading = useAppSelector((state) => state.auth.loading);
  const errorMessage = useAppSelector((state) => state.auth.error);

  const refresh = useCallback(async () => {
    await dispatch(loadCurrentUser());
  }, [dispatch]);

  const error = useMemo(() => {
    if (!errorMessage) return null;
    return new Error(errorMessage);
  }, [errorMessage]);

  return { user, loading, error, refresh };
}
