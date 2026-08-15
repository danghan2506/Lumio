import { getStreamClient, disconnectStreamUser } from '../../lib/stream';
import { StreamVideoClient } from '@stream-io/video-react-native-sdk';

const mockGetOrCreateInstance = jest.fn();
const mockDisconnectUser = jest.fn().mockResolvedValue(undefined);

jest.mock('@stream-io/video-react-native-sdk', () => ({
  StreamVideoClient: {
    get getOrCreateInstance() {
      return mockGetOrCreateInstance;
    },
  },
}));

describe('lib/stream', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetOrCreateInstance.mockReset();
    mockGetOrCreateInstance.mockReturnValue({ disconnectUser: mockDisconnectUser });
    mockDisconnectUser.mockClear();
  });

  it('returns the singleton client connected with given credentials', () => {
    const client = getStreamClient({ apiKey: 'key', userId: 'u1', token: 'tok' });

    expect(client).toBeDefined();
    expect(mockGetOrCreateInstance).toHaveBeenCalledWith({
      apiKey: 'key',
      user: { id: 'u1' },
      token: 'tok',
    });
  });

  it('disconnects the provided client', async () => {
    const client = { disconnectUser: mockDisconnectUser } as never;
    await disconnectStreamUser(client);
    expect(mockDisconnectUser).toHaveBeenCalledTimes(1);
  });

  it('does not throw when the singleton is not connected', async () => {
    mockGetOrCreateInstance.mockImplementationOnce(() => {
      throw new Error('not initialized');
    });
    await expect(disconnectStreamUser()).resolves.toBeUndefined();
  });
});
