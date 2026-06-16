export type RootStackParamList = {
  Main: undefined;
};

export type MainTabParamList = {
  Map: undefined;
  Report: undefined;
  Settings: undefined;
};

export const linking = {
  prefixes: ['sorriso-sentinel://'],
  config: {
    screens: {
      Main: {
        screens: {
          Map: 'map',
          Report: 'report',
          Settings: 'settings',
        },
      },
    },
  },
};
