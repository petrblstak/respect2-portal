# 🎨 Multi-Theme Implementation Guide - CSS Custom Properties Approach

**Project:** AEC Portal  
**Goal:** Dynamic theme switching based on user division (3 themes)  
**Approach:** CSS Custom Properties (no page reload required)  
**Status:** Ready for implementation

---

## 📋 Overview

This guide implements runtime theme switching using CSS custom properties (CSS variables). Users will see their division's theme immediately upon login, and all components (including lazy-loaded ones) will adopt the correct theme colors.

**Key Features:**

- ✅ No page reload needed
- ✅ Works with lazy-loaded components
- ✅ Persistent theme across page refreshes
- ✅ Fallback support for older browsers

---

## 🗂️ Files to Create/Modify

### Files to Modify:

1. \_theme-config.scss - Add CSS custom properties
2. app.component.ts - Initialize theme on startup
3. auth.component.ts - Apply theme after login
4. header.component.ts - Clear theme on logout
5. Component SCSS files (gradual update) - Use CSS variables

### Files to Create:

1. `src/app/shared/services/theme.service.ts` - Theme management service

---

## 📝 Step-by-Step Implementation

---

### **STEP 1: Update Theme Configuration File**

**File:** \_theme-config.scss

**What to do:** Add CSS custom properties at the end of the file

```scss
// === MAIN THEME CONFIGURATION ===
// This file contains all themeable variables that differ between customer projects
// To switch themes: simply replace this file with customer-specific version

// =================================
// ======= GENERAL VARIABLES =======
// =================================

// General Colors
$edu-color-black: #000;
$edu-color-white: #ffffff;
$edu-color-error: #e5015a;
$edu-color-main: #23468c;
$edu-color-main-dark: #15185c;
$edu-color-highlight: #8d7c54;
$edu-color-grey1: #999db6;
$edu-color-grey-light1: #cbcede;
$edu-color-grey-light2: #e3e5f1;
$edu-color-grey-light3: rgba(21, 24, 92, 0.05);

// Extra colors
$edu-color-orange: #f77c08;
$edu-color-lilac: #848ec1;
$edu-color-mint: #699a8b;
$edu-color-violet: #5b2c5b;
$edu-color-pink: #bb7ab0;

// ... (keep all existing variables) ...

// =================================
// ===== CSS CUSTOM PROPERTIES =====
// =================================

// Export SCSS variables as CSS custom properties for runtime theming
// These can be overridden by setting data-theme attribute on <html> element

:root {
  // ===== GENERAL COLORS =====
  --edu-color-black: #{$edu-color-black};
  --edu-color-white: #{$edu-color-white};
  --edu-color-error: #{$edu-color-error};
  --edu-color-main: #{$edu-color-main};
  --edu-color-main-dark: #{$edu-color-main-dark};
  --edu-color-highlight: #{$edu-color-highlight};
  --edu-color-grey1: #{$edu-color-grey1};
  --edu-color-grey-light1: #{$edu-color-grey-light1};
  --edu-color-grey-light2: #{$edu-color-grey-light2};
  --edu-color-grey-light3: #{$edu-color-grey-light3};

  // Extra colors
  --edu-color-orange: #{$edu-color-orange};
  --edu-color-lilac: #{$edu-color-lilac};
  --edu-color-mint: #{$edu-color-mint};
  --edu-color-violet: #{$edu-color-violet};
  --edu-color-pink: #{$edu-color-pink};

  // ===== TEXT & ICONS =====
  --general-text-color: #{$general-text-color};
  --general-text-color-hover: #{$general-text-color-hover};
  --general-text-color-highlight: #{$general-text-color-highlight};
  --general-icons-color: #{$general-icons-color};
  --general-icons-color-hover: #{$general-icons-color-hover};
  --general-icons-color-active: #{$general-icons-color-active};

  // ===== HEADER =====
  --header-background: #{$header-background};
  --header-text-color: #{$header-text-color};
  --header-text-color-hover: #{$header-text-color-hover};
  --header-text-color-active: #{$header-text-color-active};

  // ===== FOOTER =====
  --footer-background: #{$footer-background};
  --footer-link-color: #{$footer-link-color};
  --footer-link-hover: #{$footer-link-hover};

  // ===== BUTTONS =====
  --btn-primary-bg: #{$btn-primary-bg};
  --btn-primary-bg-hover: #{$btn-primary-bg-hover};
  --btn-primary-text-color: #{$btn-primary-text-color};
  --btn-primary-border-color: #{$btn-primary-border-color};
  --btn-primary-border-color-hover: #{$btn-primary-border-color-hover};

  --btn-secondary-bg: #{$btn-secondary-bg};
  --btn-secondary-bg-hover: #{$btn-secondary-bg-hover};
  --btn-secondary-text-color: #{$btn-secondary-text-color};
  --btn-secondary-border-color: #{$btn-secondary-border-color};

  --btn-outline-primary-text-color: #{$btn-outline-primary-text-color};
  --btn-outline-primary-text-color-hover: #{$btn-outline-primary-text-color-hover};
  --btn-outline-primary-border-color: #{$btn-outline-primary-border-color};
  --btn-outline-primary-border-color-hover: #{$btn-outline-primary-border-color-hover};

  // ===== FORMS =====
  --form-input-border-color: #{$form-input-border-color};
  --form-input-border-color-focus: #{$form-input-border-color-focus};
  --form-check-border-color-checked: #{$form-check-border-color-checked};

  // ===== COMPONENTS =====
  --progress-bar-fill: #{$progress-bar-fill};
  --tag-main-bg: #{$tag-main-bg};
  --card-simple-middle-bar-bg-color: #{$card-simple-middle-bar-bg-color};

  // ===== DASHBOARD =====
  --dashboard-score-color: #{$dashboard-score-color};
  --dashboard-progress-fill: #{$dashboard-progress-fill};
  --dashboard-tag-main: #{$dashboard-tag-main};

  // Add more variables as needed...
}

// =================================
// ====== DIVISION B THEME =========
// =================================

:root[data-theme='division-b'] {
  // Override only the colors that differ for Division B
  --edu-color-main: #ff5500; // Orange
  --edu-color-main-dark: #cc4400; // Dark orange
  --edu-color-highlight: #00aaff; // Blue

  // Update dependent colors
  --header-text-color: #cc4400;
  --header-text-color-hover: #ff5500;
  --header-text-color-active: #00aaff;

  --btn-primary-bg: #cc4400;
  --btn-primary-bg-hover: #ff5500;
  --btn-primary-border-color: #cc4400;
  --btn-primary-border-color-hover: #ff5500;

  --progress-bar-fill: #00aaff;
  --dashboard-score-color: #00aaff;
  --dashboard-progress-fill: #00aaff;

  // Add other Division B specific overrides...
}

// =================================
// ====== DIVISION C THEME =========
// =================================

:root[data-theme='division-c'] {
  // Override only the colors that differ for Division C
  --edu-color-main: #2a9d8f; // Teal
  --edu-color-main-dark: #1b5e54; // Dark teal
  --edu-color-highlight: #e76f51; // Coral

  // Update dependent colors
  --header-text-color: #1b5e54;
  --header-text-color-hover: #2a9d8f;
  --header-text-color-active: #e76f51;

  --btn-primary-bg: #1b5e54;
  --btn-primary-bg-hover: #2a9d8f;
  --btn-primary-border-color: #1b5e54;
  --btn-primary-border-color-hover: #2a9d8f;

  --progress-bar-fill: #e76f51;
  --dashboard-score-color: #e76f51;
  --dashboard-progress-fill: #e76f51;

  // Add other Division C specific overrides...
}
```

**Note:** You'll need to export ALL ~100 variables eventually, but start with the most important ones listed above.

---

### **STEP 2: Create Theme Service**

**File:** `src/app/shared/services/theme.service.ts` (CREATE NEW FILE)

```typescript
import { Injectable, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

export type ThemeName = 'division-a' | 'division-b' | 'division-c';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly THEME_STORAGE_KEY = 'user-theme';
  private currentTheme: ThemeName = 'division-a';

  constructor(@Inject(DOCUMENT) private document: Document) {
    // Initialize with stored theme or default
    const stored = localStorage.getItem(this.THEME_STORAGE_KEY);
    if (stored && this.isValidTheme(stored)) {
      this.currentTheme = stored as ThemeName;
    }
  }

  /**
   * Switch theme immediately without page reload
   * Sets data-theme attribute on <html> element
   */
  switchTheme(themeName: ThemeName): void {
    if (!this.isValidTheme(themeName)) {
      console.error(`Invalid theme: ${themeName}`);
      return;
    }

    // Set data-theme attribute on <html> element
    this.document.documentElement.setAttribute('data-theme', themeName);

    // Store preference in localStorage
    this.currentTheme = themeName;
    localStorage.setItem(this.THEME_STORAGE_KEY, themeName);

    console.log(`Theme switched to: ${themeName}`);
  }

  /**
   * Initialize theme on app startup
   * Should be called in AppComponent.ngOnInit()
   */
  initializeTheme(): void {
    const storedTheme = this.getCurrentTheme();
    this.document.documentElement.setAttribute('data-theme', storedTheme);
    console.log(`Theme initialized: ${storedTheme}`);
  }

  /**
   * Get current active theme
   */
  getCurrentTheme(): ThemeName {
    return this.currentTheme;
  }

  /**
   * Get stored theme from localStorage
   */
  getStoredTheme(): ThemeName | null {
    const stored = localStorage.getItem(this.THEME_STORAGE_KEY);
    return stored && this.isValidTheme(stored) ? (stored as ThemeName) : null;
  }

  /**
   * Clear stored theme and reset to default
   * Should be called on logout
   */
  clearTheme(): void {
    localStorage.removeItem(this.THEME_STORAGE_KEY);
    this.currentTheme = 'division-a';
    this.document.documentElement.setAttribute('data-theme', 'division-a');
    console.log('Theme cleared, reset to division-a');
  }

  /**
   * Check if theme name is valid
   */
  private isValidTheme(theme: string): boolean {
    return ['division-a', 'division-b', 'division-c'].includes(theme);
  }
}
```

---

### **STEP 3: Initialize Theme in App Component**

**File:** app.component.ts

**What to do:** Import ThemeService and initialize theme on startup

```typescript
import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { ScormApiService } from 'cmp-portal-core';
import { ThemeService } from './shared/services/theme.service'; // ADD THIS

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit {
  playerData = this.scormApiService.playerData;
  actRoute!: string;
  isDarkPage = false;

  constructor(
    private scormApiService: ScormApiService,
    private router: Router,
    private themeService: ThemeService // ADD THIS
  ) {}

  ngOnInit(): void {
    // ========================================
    // ✨ INITIALIZE THEME ON APP STARTUP
    // ========================================
    this.themeService.initializeTheme();
    // This restores user's theme preference from localStorage
    // ========================================

    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.actRoute = event.url;
        console.log('this.actRoute', this.actRoute);
      }
    });
  }

  onActivate() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
```

---

### **STEP 4: Apply Theme After Login**

**File:** auth.component.ts

**What to do:** Detect user's division and switch theme after successful login

```typescript
import { Component, OnInit } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

import { appConstants, AuthService, LangService } from 'cmp-portal-core';
import { environment } from 'src/environments/environment';
import { ThemeService, ThemeName } from '../../shared/services/theme.service'; // ADD THIS

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss'],
  standalone: false,
})
export class AuthComponent implements OnInit {
  loginError: string | null = null;
  loginForm!: UntypedFormGroup;
  isLoginRunning = false;
  isPassText = false;
  environment = environment;
  isAuthFormPage = false;

  appVersion = 'lib version: ' + appConstants.VERSION + '<br>lib build time: ' + appConstants.BUILD_TIME + '<br>app version: ' + environment.version + '<br>app build time: ' + environment.buildTime;

  constructor(
    private authService: AuthService,
    private router: Router,
    private translate: TranslateService,
    private langService: LangService,
    private themeService: ThemeService // ADD THIS
  ) {}

  ngOnInit(): void {
    this.loginForm = new UntypedFormGroup({
      login: new UntypedFormControl(null, [Validators.required]),
      password: new UntypedFormControl(null, [Validators.required]),
    });

    if (this.authService.userData.value.isLogged) {
      this.router.navigate(['/']);
    }

    if (this.router.url.indexOf('auth-form') > -1) {
      this.isAuthFormPage = true;
    } else {
      this.isAuthFormPage = false;
    }
  }

  onSubmit() {
    if (this.isLoginRunning) return;
    if (!this.loginForm.valid) {
      Object.keys(this.loginForm.controls).forEach(field => {
        const control = this.loginForm.get(field);
        control?.markAsTouched({ onlySelf: true });
      });
      return;
    }

    this.isLoginRunning = true;
    this.authService.logIn(this.loginForm.value.login, this.loginForm.value.password).subscribe(
      resultData => {
        this.isLoginRunning = false;
        console.log('Login successful', resultData);

        if (resultData === true) {
          // Change language if needed
          let langId = this.langService.getDefaultLanguage();
          if (langId !== this.translate.getCurrentLang()) {
            this.langService.changeLanguage(langId);
          }

          this.loginError = null;
          this.loginForm.reset();

          // ========================================
          // ✨ THEME SWITCHING LOGIC
          // ========================================

          // Get user data to determine division
          const userData = this.authService.userData.value;

          // Determine theme based on user's division
          // TODO: UPDATE THIS LOGIC BASED ON YOUR USER DATA STRUCTURE
          let themeName: ThemeName = 'division-a'; // Default theme

          // Example 1: Check user.division property
          if (userData.user?.division === 'B') {
            themeName = 'division-b';
          } else if (userData.user?.division === 'C') {
            themeName = 'division-c';
          }

          // Example 2: Check group membership
          // if (userData.groups?.includes('Division-B-Group')) {
          //   themeName = 'division-b';
          // } else if (userData.groups?.includes('Division-C-Group')) {
          //   themeName = 'division-c';
          // }

          // Example 3: Check custom user parameter
          // if (userData.user?.customParams?.division === 'B') {
          //   themeName = 'division-b';
          // }

          // Switch theme (instant, no page reload)
          this.themeService.switchTheme(themeName);

          console.log(`User logged in. Theme set to: ${themeName}`);

          // ========================================
          // END THEME SWITCHING LOGIC
          // ========================================

          // Retrieve the redirect URL from sessionStorage
          const redirectUrl = sessionStorage.getItem('redirectUrl') || '/';
          sessionStorage.removeItem('redirectUrl');

          // Navigate to the stored URL or default to '/'
          this.router.navigate([redirectUrl]);
        } else {
          this.loginError = this.translate.instant('LOGIN_ERROR_BAD_CREDENTIALS');
        }
      },
      someError => {
        this.isLoginRunning = false;
        this.loginError = this.translate.instant('LOGIN_ERROR_BAD_CREDENTIALS');
        console.log('Login Error', someError);
      }
    );
  }
}
```

---

### **STEP 5: Clear Theme on Logout**

**File:** header.component.ts

**What to do:** Import ThemeService and clear theme when user logs out

```typescript
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { NavigationEnd, Router } from '@angular/router';
import { NgbDropdown } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';

import { appConstants, AuthService, CoreDataService, LangObject, LangService, UserData } from 'cmp-portal-core';
import { environment } from 'src/environments/environment';
import { ThemeService } from '../shared/services/theme.service'; // ADD THIS

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: false,
})
export class HeaderComponent implements OnInit, OnDestroy {
  private userSub!: Subscription;
  private langSub!: Subscription;
  cmpUser!: UserData;
  currentLang!: LangObject;
  isUserAdmin = false;
  isMenuCollapsed = true;
  actRoute!: string;
  langsAvailable: string[] = [];
  requestsControl = false;
  environment = environment;

  constructor(
    private authService: AuthService,
    private langService: LangService,
    private coreDataService: CoreDataService,
    private router: Router,
    @Inject(DOCUMENT) private document: Document,
    private themeService: ThemeService // ADD THIS
  ) {}

  ngOnInit(): void {
    this.userSub = this.authService.userData.subscribe(userData => {
      console.log('got new user', userData);
      this.cmpUser = userData;
      if (this.cmpUser.user?.superUser || (this.cmpUser.globalRoles && this.cmpUser.globalRoles['ADMIN_VIEW'])) {
        this.isUserAdmin = true;
      }
    });
    this.langSub = this.langService.appCurrentLang.subscribe(currentLang => {
      console.log('got currentLang ', currentLang);
      this.currentLang = currentLang;
    });
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.actRoute = event.url;
      }
    });
    this.langsAvailable = this.coreDataService.coreData.LANGS_AVAILABLE;
    this.requestsControl = this.coreDataService.coreData.requestsControl;
  }

  openLms() {
    if (environment.isJwtLogin) {
      this.document.location.href = environment.remoteServer + 'tokenLogin.srv?jwt=' + localStorage.getItem(appConstants.STORAGE.LOGIN_TOKEN_NAME);
    } else {
      this.document.location.href = environment.remoteServer;
    }
  }

  over(drop: NgbDropdown) {
    drop.open();
  }

  out(drop: NgbDropdown) {
    drop.close();
  }

  changeLanguage(langId: string) {
    this.isMenuCollapsed = true;
    this.langService.changeLanguage(langId);
  }

  logOut() {
    this.isMenuCollapsed = true;

    // ========================================
    // ✨ CLEAR THEME ON LOGOUT
    // ========================================
    this.themeService.clearTheme();
    // This resets theme to 'division-a' and removes localStorage entry
    // ========================================

    this.authService.logOut().subscribe();
  }

  ngOnDestroy() {
    this.userSub.unsubscribe();
    this.langSub.unsubscribe();
  }
}
```

---

### **STEP 6: Update Component SCSS Files (Gradual Process)**

**Priority Order:** Update components from highest to lowest visibility

#### **6.1 High Priority Components (Do First)**

These are components users see immediately:

1. **Header Component**
2. **Footer Component**
3. **Global Button Styles**
4. **Home Component**

**Example:** Update header.component.scss

```scss
@use '../../../assets/scss/theme-config';

.app-header {
  // BEFORE:
  // background-color: theme-config.$header-background;

  // AFTER (with CSS variable + fallback):
  background-color: var(--header-background, #{theme-config.$header-background});

  .nav-link {
    // BEFORE:
    // color: theme-config.$header-text-color;

    // AFTER:
    color: var(--header-text-color, #{theme-config.$header-text-color});

    &:hover {
      // BEFORE:
      // color: theme-config.$header-text-color-hover;

      // AFTER:
      color: var(--header-text-color-hover, #{theme-config.$header-text-color-hover});
    }

    &.active {
      // BEFORE:
      // color: theme-config.$header-text-color-active;

      // AFTER:
      color: var(--header-text-color-active, #{theme-config.$header-text-color-active});
    }
  }
}
```

**Pattern:** Replace every `theme-config.$variable-name` with:

```scss
var(--variable-name, #{theme-config.$variable-name})
```

---

#### **6.2 Global Styles**

**File:** styles.scss

Update button styles, typography, and other global elements:

```scss
@use 'assets/scss/theme-config';

// Example: Update button styles
.btn-primary {
  // BEFORE:
  // background-color: theme-config.$btn-primary-bg;
  // color: theme-config.$btn-primary-text-color;

  // AFTER:
  background-color: var(--btn-primary-bg, #{theme-config.$btn-primary-bg});
  color: var(--btn-primary-text-color, #{theme-config.$btn-primary-text-color});
  border-color: var(--btn-primary-border-color, #{theme-config.$btn-primary-border-color});

  &:hover {
    background-color: var(--btn-primary-bg-hover, #{theme-config.$btn-primary-bg-hover});
    border-color: var(--btn-primary-border-color-hover, #{theme-config.$btn-primary-border-color-hover});
  }
}

// Update text colors
.text-blue {
  // BEFORE:
  // color: theme-config.$edu-color-main;

  // AFTER:
  color: var(--edu-color-main, #{theme-config.$edu-color-main});
}

// Update link colors
a {
  // BEFORE:
  // color: theme-config.$link-color;

  // AFTER:
  color: var(--edu-color-main, #{theme-config.$edu-color-main});

```
