import { resolveDisplayName, DEFAULT_DISPLAY_NAME } from '../../lib/displayName';

describe('lib/displayName resolveDisplayName', () => {
  it('returns profile display_name when it exists', () => {
    expect(resolveDisplayName('Alex Johnson', 'Meta Full', 'Meta Name', 'a@b.com')).toBe(
      'Alex Johnson'
    );
  });

  it('returns empty profile display_name treated as missing and falls through', () => {
    expect(resolveDisplayName('', 'Meta Full', 'Meta Name', 'a@b.com')).toBe('Meta Full');
  });

  it('falls back to user_metadata.full_name when profile name is missing', () => {
    expect(resolveDisplayName(null, 'Meta Full', 'Meta Name', 'a@b.com')).toBe('Meta Full');
  });

  it('falls back to user_metadata.name when full_name is missing', () => {
    expect(resolveDisplayName(null, null, 'Meta Name', 'a@b.com')).toBe('Meta Name');
  });

  it('falls back to email prefix when all names are missing', () => {
    expect(resolveDisplayName(null, null, null, 'danghan1213@gmail.com')).toBe(
      'danghan1213'
    );
  });

  it('falls back to email prefix when email has no @ symbol', () => {
    expect(resolveDisplayName(null, null, null, 'plainname')).toBe('plainname');
  });

  it('returns default display name when nothing is available', () => {
    expect(resolveDisplayName(null, null, null, null)).toBe(DEFAULT_DISPLAY_NAME);
    expect(DEFAULT_DISPLAY_NAME).toBe('Lumio Learner');
  });

  it('trims whitespace from email prefix', () => {
    expect(resolveDisplayName(null, null, null, '  spaced@gmail.com ')).toBe('spaced');
  });

  it('returns profile name even when metadata and email are provided', () => {
    expect(resolveDisplayName('Custom Name', undefined, undefined, undefined)).toBe(
      'Custom Name'
    );
  });
});
