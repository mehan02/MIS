import { useEffect, useState } from 'react';
import Modal from '../../common/Modal';
import Button from '../../common/Button';
import '../../../assets/styles/components/super-admin-login-modal.css';

type SuperAdminLoginModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (username: string, password: string) => Promise<void>;
};

export default function SuperAdminLoginModal({
  isOpen,
  onClose,
  onSubmit,
}: SuperAdminLoginModalProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setUsername('');
      setPassword('');
      setSubmitting(false);
      setError(null);
    }
  }, [isOpen]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!username.trim() || !password) {
      setError('Username and password are required.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await onSubmit(username.trim(), password);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Super admin login failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Super Admin Login">
      <form className="super-admin-login-form" onSubmit={handleSubmit}>
        <div className="super-admin-login-field">
          <label htmlFor="super-admin-username">Username</label>
          <input
            id="super-admin-username"
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
            disabled={submitting}
          />
        </div>

        <div className="super-admin-login-field">
          <label htmlFor="super-admin-password">Password</label>
          <input
            id="super-admin-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            disabled={submitting}
          />
        </div>

        {error && (
          <p className="super-admin-login-error" role="alert">
            {error}
          </p>
        )}

        <div className="super-admin-login-actions">
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? 'Signing in...' : 'Sign In'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
