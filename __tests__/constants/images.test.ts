import { images } from '@/constants/images';

describe('Image Constants', () => {
  it('should export mascot and welcome images', () => {
    expect(images.mascot).toBeDefined();
    expect(images.welcome).toBeDefined();
  });
});
