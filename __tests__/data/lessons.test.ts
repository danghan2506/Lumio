import { LESSONS } from '../../data/lessons';

describe('LESSONS vocabulary items', () => {
  it('should ensure every vocabulary item has a non-empty stable id', () => {
    LESSONS.forEach((lesson) => {
      lesson.vocabulary.forEach((item) => {
        expect(item.id).toBeDefined();
        expect(typeof item.id).toBe('string');
        expect(item.id.trim().length).toBeGreaterThan(0);
      });
    });
  });

  it('should ensure vocabulary IDs are unique across all lessons', () => {
    const ids = new Set<string>();
    LESSONS.forEach((lesson) => {
      lesson.vocabulary.forEach((item) => {
        expect(ids.has(item.id)).toBe(false);
        ids.add(item.id);
      });
    });
  });
});
