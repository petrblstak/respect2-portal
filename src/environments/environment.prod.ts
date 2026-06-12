export const environment = {
  // *********************************************************
  // base settings
  // *********************************************************
  production: true,
  portalName: 'Respect Portal',
  description: 'Respect Portal, Angular 20, portal library manually loaded, Custom HP and static pages, Custom page for student results, with SSO, no Registration.',
  version: '2.6.4',
  buildTime: '260612165226',
  remoteServer: '/app/',
  portalBaseUrl: '/',
  isJwtLogin: false,
  // *********************************************************
  // remote error logging settings
  // *********************************************************
  isLogErrorsToServer: true,
  remoteErrorServer: 'https://demo.competent.cz/',
  // *********************************************************
  // captcha settings
  // *********************************************************
  isUseCaptcha: false,
  recaptchaKey: '6LdyZuwpAAAAAG73Ndc5Fd4GAQc57m5Wfbv6Bc9q',
  // *********************************************************
  // Multicompetent settings
  // *********************************************************
  multiinstancesAllowed: false,
  multiinstanceCookieName: 'tenantID',
  // *********************************************************
  // display settings
  // *********************************************************
  isPlaySetAllowed: true,
  defaultRootSetID: null,
  isRegistrationOpen: false,
  isCourseFilterEnabled: false,
  isCourseBannerEnabled: false,
  isCatalogFilterEnabled: true,
  isCatalogBannerEnabled: true,
  isHomePublic: true,
  redirectFromHome: null,
  isCatalogAllowed: true,
  isDashboardAllowed: false,
  isFooterDisplayed: true,
  isLinksAsSpecialCards: true,
  passedCoursesAsFinished: true,
  checkNonFinishedAttempts: true,
  filterOutAccessStates: ['CANCELLED', 'ARCHIVED'],
  courseSectionAllDisplayed: true,
  courseSectionFutureDisplayed: false,
  isCoursesWithFutureDisplayedInFuture: false,
  // *********************************************************
  // CSP settings (used by post-build script)
  // *********************************************************
  cspEnabled: true,
  cspStrictMode: true,
  cspPacks: ['youtube', 'vimeo'],
  cspScriptSrc: [],
  cspConnectSrc: [],
  cspImgSrc: [],
  cspFrameSrc: ['https://respectcz.sharepoint.com'],
  cspStyleSrc: [],
  cspFontSrc: [],
  // *********************************************************
  // SSO settings
  // *********************************************************
  sso: {
    url: 'https://respect.competent.cz/app/authAndRedirect',
    returnUrlParamName: 'redirectTo',
    returnUrlOtherParams: 'relative=false',
    loginDisplaySso: null as null | 'up' | 'down',
    isDisplayLoginFirst: false,
  } as SsoSettings,
  // *********************************************************
  // logout settings
  // *********************************************************
  logout: {
    isUseForm: false,
    logoutUrl: null as null | string,
  } as LogoutSettings,
  // *********************************************************
  // dashboard settings, Aricoma specific so far
  // *********************************************************
  dashboardFolders: {
    banner: 48,
    library: 49,
    community: 50,
  },
  // *********************************************************
  // Other constants for portal specific IDs, etc.
  // *********************************************************
  // USER_PARAMS: {
  //   OPTIONAL_PARAMS_POSITION: 689,
  //   OPTIONAL_PARAMS_COMPANY_SIZE: 690,
  // },
  // GROUP_IDS: {
  //   REG_WEB_GRP_ID: 26,
  //   REG_MEET_GRP_ID: 27,
  //   REG_OTHER_GRP_ID: 28,
  // },
  // CERTIFICATE_DOCUMENT_ID: 16,
};

interface SsoSettings {
  url: string;
  returnUrlParamName: string;
  returnUrlOtherParams: string;
  loginDisplaySso: null | 'up' | 'down';
  isDisplayLoginFirst: boolean;
}

interface LogoutSettings {
  isUseForm: boolean;
  logoutUrl: null | string;
}
