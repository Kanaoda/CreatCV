import { toggleVisibleFlag } from './visibility';

/** Keep content in JSON but exclude from CV preview / PDF / Word when off */
export function VisibilityToggle({ visible, onChange, title = 'Show on CV' }) {
  const shown = visible !== false;
  return (
    <label
      className={`cv-visibility-toggle${shown ? '' : ' is-off'}`}
      title={shown ? 'Included in CV preview and export' : 'Hidden from CV — data kept, not deleted'}
    >
      <input
        type="checkbox"
        checked={shown}
        onChange={() => onChange(toggleVisibleFlag(shown))}
        aria-label={title}
      />
      <span>{shown ? 'On CV' : 'Hidden'}</span>
    </label>
  );
}
