import { StreamVideoClient, User } from '@stream-io/video-react-native-sdk';

interface StreamClientParams {
  apiKey: string;
  userId: string;
  token: string;
}

export function getStreamClient(params: StreamClientParams): StreamVideoClient {
  const user: User = { id: params.userId };
  return StreamVideoClient.getOrCreateInstance({
    apiKey: params.apiKey,
    user,
    token: params.token,
  });
}

export async function disconnectStreamUser(client?: StreamVideoClient | null): Promise<void> {
  try {
    if (client) {
      await client.disconnectUser();
      return;
    }
    await (StreamVideoClient.getOrCreateInstance as unknown as () => StreamVideoClient)().disconnectUser();
  } catch {
    // No connected client — nothing to clean up.
  }
}
