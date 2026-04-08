import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { FiTrash2 } from 'react-icons/fi';
import api from '../../services/api';
import Button from '../../components/common/Button';
import UxState from '../../components/common/UxState';
import Modal from '../../components/common/Modal';

type UserRecord = {
  id?: string;
  epfNo: string;
  name: string;
  role: string;
};

type UpdateRolePayload = {
  role: 'ADMIN' | 'USER';
};

function normalizeRole(role?: string) {
  return (role ?? '').trim().toUpperCase();
}

function toUserMessage(err: unknown, fallback: string) {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string } | string | undefined;
    if (typeof data === 'string' && data.trim()) {
      return data;
    }
    if (
      data &&
      typeof data === 'object' &&
      typeof data.message === 'string' &&
      data.message.trim()
    ) {
      return data.message;
    }
    if (err.message) {
      return err.message;
    }
  }

  if (err instanceof Error && err.message) {
    return err.message;
  }

  return fallback;
}

export default function SuperAdminUsers() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDeleteUser, setPendingDeleteUser] = useState<UserRecord | null>(null);

  const loadUsers = useCallback(async (signal?: AbortSignal) => {
    const resp = await api.get<UserRecord[]>('/api/admin/users', { signal });
    setUsers(resp.data ?? []);
  }, []);

  useEffect(() => {
    const ac = new AbortController();

    setLoading(true);
    setLoadError(null);
    setActionError(null);

    loadUsers(ac.signal)
      .catch((err: unknown) => {
        if (axios.isAxiosError(err) && err.code === 'ERR_CANCELED') {
          return;
        }
        setLoadError(toUserMessage(err, 'Failed to load users.'));
      })
      .finally(() => setLoading(false));

    return () => ac.abort();
  }, [loadUsers]);

  async function handleRoleUpdate(user: UserRecord, nextRole: UpdateRolePayload['role']) {
    const targetId = user.id ?? user.epfNo;
    setUpdatingId(targetId);
    setActionError(null);

    try {
      await api.put(`/api/admin/users/${encodeURIComponent(targetId)}/role`, {
        role: nextRole,
      } satisfies UpdateRolePayload);
      await loadUsers();
    } catch (err: unknown) {
      setActionError(toUserMessage(err, 'Failed to update user role.'));
    } finally {
      setUpdatingId(null);
    }
  }

  function handleAskDelete(user: UserRecord) {
    setPendingDeleteUser(user);
  }

  function handleCancelDelete() {
    if (deletingId) return;
    setPendingDeleteUser(null);
  }

  async function handleConfirmDelete() {
    if (!pendingDeleteUser) return;

    const targetId = pendingDeleteUser.id ?? pendingDeleteUser.epfNo;
    setDeletingId(targetId);
    setActionError(null);

    try {
      await api.delete(`/api/admin/users/${encodeURIComponent(targetId)}`);
      setPendingDeleteUser(null);
      await loadUsers();
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        // If already deleted / not found, refresh list and close modal instead of putting page in error state.
        setPendingDeleteUser(null);
        await loadUsers();
        return;
      }

      setActionError(toUserMessage(err, 'Failed to delete user.'));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="admin-reports-page">
      <header className="admin-reports-header">
        <h1>User Management</h1>
        <p>Manage user roles across the organization.</p>
      </header>

      <div className="admin-reports-card">
        {loading && (
          <UxState type="loading" title="Loading users..." message="Fetching users list." />
        )}

        {!loading && loadError && (
          <UxState type="error" title="Unable to load users" message={loadError} />
        )}

        {!loading && !loadError && actionError && (
          <div className="super-admin-action-error" role="alert">
            {actionError}
          </div>
        )}

        {!loading && !loadError && users.length === 0 && (
          <UxState type="empty" title="No users found" message="There are no users available." />
        )}

        {!loading && !loadError && users.length > 0 && (
          <div className="admin-reports-table-wrap">
            <table className="admin-reports-table">
              <thead>
                <tr>
                  <th>EPF No</th>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const role = normalizeRole(user.role);
                  const targetId = user.id ?? user.epfNo;
                  const isUpdating = updatingId === targetId;
                  const isDeleting = deletingId === targetId;
                  const disableActions = isUpdating || isDeleting;

                  return (
                    <tr key={targetId}>
                      <td>{user.epfNo}</td>
                      <td>{user.name}</td>
                      <td>{role || '-'}</td>
                      <td>
                        <div className="super-admin-actions">
                          {role === 'USER' && (
                            <Button
                              type="button"
                              className="super-admin-role-btn"
                              variant="secondary"
                              size="sm"
                              onClick={() => handleRoleUpdate(user, 'ADMIN')}
                              disabled={disableActions}
                            >
                              {isUpdating ? 'Updating...' : 'Promote to Admin'}
                            </Button>
                          )}

                          {role === 'ADMIN' && (
                            <Button
                              type="button"
                              className="super-admin-role-btn"
                              variant="secondary"
                              size="sm"
                              onClick={() => handleRoleUpdate(user, 'USER')}
                              disabled={disableActions}
                            >
                              {isUpdating ? 'Updating...' : 'Demote to User'}
                            </Button>
                          )}

                          {role === 'SUPER_ADMIN' && (
                            <span className="super-admin-role-disabled" aria-disabled="true">
                              Role locked
                            </span>
                          )}

                          {role !== 'SUPER_ADMIN' && (
                            <Button
                              type="button"
                              className="super-admin-delete-btn"
                              variant="danger"
                              size="sm"
                              onClick={() => handleAskDelete(user)}
                              disabled={disableActions}
                              aria-label={`Delete ${user.name}`}
                              title="Delete user"
                            >
                              <FiTrash2 aria-hidden="true" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        isOpen={Boolean(pendingDeleteUser)}
        onClose={handleCancelDelete}
        title="Confirm user deletion"
      >
        {pendingDeleteUser && (
          <div>
            <p>
              Are you sure you want to delete <strong>{pendingDeleteUser.name}</strong> (
              {pendingDeleteUser.epfNo})?
            </p>
            <p>This action cannot be undone.</p>
            <div className="super-admin-delete-modal-actions">
              <Button
                type="button"
                className="super-admin-delete-cancel-btn"
                variant="secondary"
                size="sm"
                onClick={handleCancelDelete}
                disabled={Boolean(deletingId)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="super-admin-delete-confirm-btn"
                variant="danger"
                size="sm"
                onClick={handleConfirmDelete}
                disabled={Boolean(deletingId)}
              >
                {deletingId ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
}
