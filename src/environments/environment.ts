export const environment = {
  // *********************************************************
  // base settings
  // *********************************************************
  production: false,
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
  isLogErrorsToServer: false,
  remoteErrorServer: 'http://projecthobit.fake/app/',
  // *********************************************************
  // captcha settings
  // *********************************************************
  isUseCaptcha: true,
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
  passedCoursesAsFinished: true, // used in library, sorts passed course into the "finished" section
  checkNonFinishedAttempts: true, // used in library for SCORM courses - checks if there are any non-finished attempts and gives user the option to start the course over. Userdto overcome Rise errors
  filterOutAccessStates: ['CANCELLED', 'ARCHIVED'], // Example: [ 'CANCELLED', 'ARCHIVED' ] - used in library to filter out courses with specific access states
  courseSectionAllDisplayed: true, // used in study to display section "All"
  courseSectionFutureDisplayed: false, // used in study to display section "Future"
  isCoursesWithFutureDisplayedInFuture: false, // used in study to display courses with actual AND future accesses in Future section (if allowed) in addition to their regular display based on actual access state.
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
  sso: null as null | SsoSettings,
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

// *********************************************************
// Interfaces for environment settings
// *********************************************************
interface SsoSettings {
  url: string;
  returnUrlParamName: string;
  returnUrlOtherParams: string;
  // SSO link is not displayed | SSO link is above login window | SSO link is below login window
  loginDisplaySso: null | 'up' | 'down';
  // If true, the login page is displayed first when user tries to access  a restricted page, otherwise the SSO service is called directly
  // If true, previous parameter should not be null otherwise users can not get to the SSO service
  // If false, the previous params still affects the login form on the auth-form spcial page, that does not redirect to SSO service
  isDisplayLoginFirst: boolean;
}

interface LogoutSettings {
  isUseForm: boolean; // If false, logout is performed as a HTTP request that acts upon the server response, otherwise it uses a redirect via form action upon the logout form submission.
  logoutUrl: null | string; // If null, the default logout URL will be used
}
