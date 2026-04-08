import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createAdHocReport } from '../services/reportService';
import Button from '../components/common/Button';
import { validateRequestReportForm } from '../features/reports/schemas/requestReportSchema';
import { getApiErrorMessage } from '../services/api';

type PopupState = {
  type: 'success' | 'error';
  message: string;
} | null;

export default function RequestReport() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [department, setDepartment] = useState('');
  const [priority, setPriority] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [popup, setPopup] = useState<PopupState>(null);

  const fileLabel = useMemo(() => {
    if (files.length === 0) return 'No file selected';
    if (files.length === 1) {
      const only = files[0];
      return `${only.name} (${Math.ceil(only.size / 1024)} KB)`;
    }
    const totalSizeKb = Math.ceil(files.reduce((sum, next) => sum + next.size, 0) / 1024);
    return `${files.length} files selected (${totalSizeKb} KB total)`;
  }, [files]);

  const selectedFileNames = useMemo(() => files.map((file) => file.name), [files]);

  function resetForm() {
    setTitle('');
    setDescription('');
    setDepartment('');
    setPriority('');
    setContactNumber('');
    setFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  function handleFilesChange(event: React.ChangeEvent<HTMLInputElement>) {
    const incomingFiles = Array.from(event.target.files ?? []);
    if (incomingFiles.length === 0) {
      return;
    }

    setFiles((prev) => {
      const merged = [...prev];
      for (const file of incomingFiles) {
        const exists = merged.some(
          (existing) =>
            existing.name === file.name &&
            existing.size === file.size &&
            existing.lastModified === file.lastModified
        );
        if (!exists) {
          merged.push(file);
        }
      }
      return merged;
    });
  }

  function handleRemoveSelectedFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  function handleClearSelectedFiles() {
    setFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  function handleBrowseFiles() {
    if (fileInputRef.current) {
      // Reset before opening picker so re-selecting the same file triggers change.
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setInlineError(null);

    const validationError = validateRequestReportForm({
      title,
      description,
      department,
      priority,
      contactNumber,
      files,
    });

    if (validationError) {
      setInlineError(validationError);
      return;
    }

    setLoading(true);
    try {
      await createAdHocReport({
        title,
        description,
        department,
        priority,
        contactNumber,
        files,
      });

      resetForm();
      setPopup({
        type: 'success',
        message: 'Report request submitted successfully.',
      });
      window.setTimeout(() => {
        navigate('/history', { state: { refresh: true } });
      }, 300);
    } catch (error: unknown) {
      const message = getApiErrorMessage(error, 'Failed to submit report request.');

      setInlineError(message);
      setPopup({
        type: 'error',
        message,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="request-page">
      <header className="request-header">
        <h2>Request Ad-hoc Report</h2>
        <p>Submit your ad-hoc report request with optional supporting file attachments.</p>
      </header>

      <form className="request-form" onSubmit={handleSubmit} noValidate>
        <div className="request-form-grid">
          <div className="request-field request-field-full">
            <label htmlFor="report-title">Title</label>
            <input
              id="report-title"
              name="title"
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={200}
              required
              placeholder="Enter report title"
              disabled={loading}
              autoComplete="off"
            />
          </div>

          <div className="request-field request-field-full">
            <label htmlFor="report-description">Description</label>
            <textarea
              id="report-description"
              name="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={2000}
              required
              placeholder="Enter report details"
              rows={6}
              disabled={loading}
            />
          </div>

          <div className="request-field">
            <label htmlFor="report-department">Department</label>
            <select
              id="report-department"
              name="department"
              value={department}
              onChange={(event) => setDepartment(event.target.value)}
              required
              disabled={loading}
            >
              <option value="">Select department</option>
              <option value="Finance">Finance</option>
              <option value="HR">HR</option>
              <option value="Operations">Operations</option>
              <option value="IT">IT</option>
              <option value="Sales">Sales</option>
            </select>
          </div>

          <div className="request-field">
            <label htmlFor="report-priority">Priority</label>
            <select
              id="report-priority"
              name="priority"
              value={priority}
              onChange={(event) => setPriority(event.target.value)}
              required
              disabled={loading}
            >
              <option value="">Select priority</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>

          <div className="request-field">
            <label htmlFor="report-contact">Contact Number</label>
            <input
              id="report-contact"
              name="contactNumber"
              type="tel"
              value={contactNumber}
              onChange={(event) => setContactNumber(event.target.value)}
              maxLength={20}
              placeholder="e.g. +94 77 123 4567"
              disabled={loading}
              autoComplete="tel"
            />
          </div>

          <div className="request-field request-field-full">
            <label htmlFor="report-file">File Upload (Optional)</label>
            <div className="request-file-upload">
              <input
                id="report-file"
                name="files"
                type="file"
                multiple
                ref={fileInputRef}
                onChange={handleFilesChange}
                className="request-file-input-native"
                disabled={loading}
                aria-describedby="request-file-hint"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="request-upload-btn"
                onClick={handleBrowseFiles}
                disabled={loading}
              >
                Choose files
              </Button>
            </div>
            <p className="request-file-hint" id="request-file-hint">
              {fileLabel}
            </p>
            {selectedFileNames.length > 0 && (
              <div className="request-selected-files">
                <div className="request-selected-files-header">
                  <span>Selected files</span>
                  <Button
                    type="button"
                    className="request-clear-files-btn"
                    variant="ghost"
                    size="sm"
                    onClick={handleClearSelectedFiles}
                    disabled={loading}
                  >
                    Clear all
                  </Button>
                </div>
                <ul className="request-file-list">
                  {selectedFileNames.map((name, index) => (
                    <li key={`${name}-${index}`}>
                      <span>{name}</span>
                      <Button
                        type="button"
                        className="request-remove-file-btn"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveSelectedFile(index)}
                        disabled={loading}
                      >
                        Remove
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {inlineError && (
          <p className="request-inline-error" role="alert">
            {inlineError}
          </p>
        )}

        <div className="request-actions">
          <Button
            type="submit"
            className="request-submit-btn"
            variant="primary"
            size="md"
            disabled={loading}
          >
            {loading ? 'Submitting...' : 'Submit Request'}
          </Button>
        </div>
      </form>

      {popup && (
        <div
          className="request-popup-overlay"
          role="dialog"
          aria-modal="true"
          aria-live="assertive"
        >
          <div className={`request-popup request-popup-${popup.type}`}>
            <h3>{popup.type === 'success' ? 'Success' : 'Submission Failed'}</h3>
            <p>{popup.message}</p>
            <Button type="button" variant="secondary" size="sm" onClick={() => setPopup(null)}>
              OK
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
