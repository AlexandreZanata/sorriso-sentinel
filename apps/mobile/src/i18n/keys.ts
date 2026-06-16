export const I18N_KEYS = {
  app: {
    name: 'app.name',
    tagline: 'app.tagline',
  },
  bootstrap: {
    loading: 'bootstrap.loading',
    retry: 'bootstrap.retry',
    error: 'bootstrap.error',
  },
  tabs: {
    map: 'tabs.map',
    report: 'tabs.report',
    settings: 'tabs.settings',
  },
  map: {
    placeholder: 'map.placeholder',
  },
  occurrence: {
    create: {
      title: 'occurrence.create.title',
      placeholder: 'occurrence.create.placeholder',
    },
  },
  settings: {
    title: 'settings.title',
    locale: 'settings.locale',
  },
  errors: {
    networkUnavailable: 'errors.networkUnavailable',
    sessionExpired: 'errors.sessionExpired',
    forbidden: 'errors.forbidden',
    notFound: 'errors.notFound',
    rateLimitExceeded: 'errors.rateLimitExceeded',
    serverError: 'errors.serverError',
    validation: 'errors.validation',
  },
} as const;

export type TranslationKey = (typeof I18N_KEYS)[keyof typeof I18N_KEYS] extends infer V
  ? V extends Record<string, infer Leaf>
    ? Leaf extends string
      ? Leaf
      : V extends Record<string, Record<string, string>>
        ? V[keyof V][keyof V[keyof V]]
        : never
    : never
  : string;
