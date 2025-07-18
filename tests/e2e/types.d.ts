import { FeedbackState, PluginConfig } from '../../src/types'

declare global {
  interface Window {
    BackChannel: {
      init: (config?: PluginConfig) => Promise<void>;
      getState: () => FeedbackState;
      getConfig: () => PluginConfig;
      enableBackChannel: () => Promise<void>;
      databaseService?: any;
      isEnabled?: boolean;
    };
    demoDatabaseSeed?: any;
    fakeData?: any;
    indexedDB?: IDBFactory;
  }
}
