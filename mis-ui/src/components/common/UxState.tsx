type UxStateType = 'loading' | 'error' | 'empty';

interface UxStateProps {
  type: UxStateType;
  title: string;
  message?: string;
}

export default function UxState({ type, title, message }: UxStateProps) {
  return (
    <div className={`ux-state ux-state-${type}`} role={type === 'error' ? 'alert' : undefined}>
      {type === 'loading' && <span className="ux-state-spinner" aria-hidden="true" />}
      <div>
        <h3>{title}</h3>
        {message && <p>{message}</p>}
      </div>
    </div>
  );
}
