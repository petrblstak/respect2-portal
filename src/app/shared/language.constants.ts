import { LangObject } from 'cmp-portal-core';

export const languageConstants = {
  DEFAUL_LANG: 'cs',
  LANG_CONFIG: {
    cs: {
      countryName: 'Česko',
      langFileKey: 'CS',
      langName: 'Čeština',
      langCode: 'CZ',
    },
    sk: {
      countryName: 'Slovensko',
      langFileKey: 'SK',
      langName: 'Slovenčina',
      langCode: 'SK',
    },
    en: {
      countryName: 'Great Britain',
      langFileKey: 'EN',
      langName: 'English',
      langCode: 'EN',
    },
  } as { [key: string]: LangObject },
};
