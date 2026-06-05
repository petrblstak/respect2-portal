I'll create a comprehensive implementation guide file for you.

````markdown
# Multi-Division Dynamic Theming Implementation Guide

**Project:** AEC Portal  
**Date:** December 4, 2025  
**Approach:** CSS Custom Properties (CSS Variables) with Runtime Theme Switching

---

## 📋 Overview

This guide implements a dynamic theming system that allows the application to switch between three division-specific color schemes at runtime when users log in, without requiring a page reload.

**Key Features:**

- ✅ No page reload needed for theme switching
- ✅ Works with lazy-loaded components
- ✅ Themes persist across page refreshes
- ✅ Single build with all themes included

---

## 🎯 Implementation Steps

### **Step 1: Update `_theme-config.scss`**

**File:** `src/assets/scss/_theme-config.scss`

**Action:** Add CSS custom properties export at the END of the file (after all existing SCSS variables)

```scss
// =================================
// ===== CSS CUSTOM PROPERTIES =====
// =================================
// Export SCSS variables as CSS custom properties for runtime theming

:root {
  // ===== COLORS =====
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

  // ===== GENERAL ELEMENTS =====
  --input-icon-active-color: #{$input-icon-active-color};
  --general-icons-color: #{$general-icons-color};
  --general-icons-color-hover: #{$general-icons-color-hover};
  --general-icons-color-disabled: #{$general-icons-color-disabled};
  --general-icons-color-active: #{$general-icons-color-active};
  --general-text-color: #{$general-text-color};
  --general-text-placeholder: #{$general-text-placeholder};
  --general-text-error-color: #{$general-text-error-color};
  --general-text-color-hover: #{$general-text-color-hover};
  --general-text-color-disabled: #{$general-text-color-disabled};
  --general-text-color-highlight: #{$general-text-color-highlight};

  // ===== PAGE SECTIONS =====
  --header-background: #{$header-background};
  --header-text-color: #{$header-text-color};
  --header-text-color-hover: #{$header-text-color-hover};
  --header-text-color-active: #{$header-text-color-active};
  --footer-background: #{$footer-background};
  --footer-link-color: #{$footer-link-color};
  --footer-link-hover: #{$footer-link-hover};
  --body-background: #{$body-background};
  --body-background-dark: #{$body-background-dark};
  --general-item-bg: #{$general-item-bg};
  --general-item-border: #{$general-item-border};

  // ===== BUTTONS =====
  --btn-primary-bg: #{$btn-primary-bg};
  --btn-primary-bg-hover: #{$btn-primary-bg-hover};
  --btn-primary-text-color: #{$btn-primary-text-color};
  --btn-primary-text-color-hover: #{$btn-primary-text-color-hover};
  --btn-primary-border-color: #{$btn-primary-border-color};
  --btn-primary-border-color-hover: #{$btn-primary-border-color-hover};

  --btn-secondary-bg: #{$btn-secondary-bg};
  --btn-secondary-bg-hover: #{$btn-secondary-bg-hover};
  --btn-secondary-text-color: #{$btn-secondary-text-color};
  --btn-secondary-text-color-hover: #{$btn-secondary-text-color-hover};
  --btn-secondary-border-color: #{$btn-secondary-border-color};
  --btn-secondary-border-color-hover: #{$btn-secondary-border-color-hover};

  --btn-outline-primary-bg: #{$btn-outline-primary-bg};
  --btn-outline-primary-bg-hover: #{$btn-outline-primary-bg-hover};
  --btn-outline-primary-text-color: #{$btn-outline-primary-text-color};
  --btn-outline-primary-text-color-hover: #{$btn-outline-primary-text-color-hover};
  --btn-outline-primary-border-color: #{$btn-outline-primary-border-color};
  --btn-outline-primary-border-color-hover: #{$btn-outline-primary-border-color-hover};

  --btn-link-text-color: #{$btn-link-text-color};
  --btn-link-text-color-hover: #{$btn-link-text-color-hover};

  // ===== FORMS =====
  --form-input-border-color: #{$form-input-border-color};
  --form-input-border-color-focus: #{$form-input-border-color-focus};
  --form-check-border-color: #{$form-check-border-color};
  --form-check-border-color-hover: #{$form-check-border-color-hover};
  --form-check-border-color-checked: #{$form-check-border-color-checked};

  // ===== COMPONENTS =====
  --progress-bar-fill: #{$progress-bar-fill};
  --card-simple-middle-bar-bg-color: #{$card-simple-middle-bar-bg-color};
  --tag-main-bg: #{$tag-main-bg};
  --dashboard-score-color: #{$dashboard-score-color};
  --dashboard-progress-fill: #{$dashboard-progress-fill};

  // ===== LINKS =====
  --link-color: #{$link-color};
  --link-color-hover: #{$link-color-hover};

  // TODO: Add more variables as needed during component updates
}

// =================================
// ====== DIVISION B THEME =========
// =================================
:root[data-theme='division-b'] {
  // Override only the colors that differ for Division B
  --edu-color-main: #ff5500; // Orange main color
  --edu-color-main-dark: #cc4400; // Dark orange
  --edu-color-highlight: #00aaff; // Blue highlight
  --header-background: #f5f5f5; // Light gray header

  // Update dependent colors
  --btn-primary-bg: #cc4400;
  --btn-primary-bg-hover: #ff5500;
  --header-text-color: #cc4400;
  --header-text-color-hover: #ff5500;
  --link-color: #ff5500;
  --link-color-hover: #cc4400;

  // TODO: Add more Division B specific overrides
}

// =================================
// ====== DIVISION C THEME =========
// =================================
:root[data-theme='division-c'] {
  // Override only the colors that differ for Division C
  --edu-color-main: #2a9d8f; // Teal
  --edu-color-main-dark: #1b5e54; // Dark teal
  --edu-color-highlight: #e76f51; // Coral
  --header-background: #264653; // Dark blue-gray header

  // Update dependent colors
  --btn-primary-bg: #1b5e54;
  --btn-primary-bg-hover: #2a9d8f;
  --header-text-color: #ffffff; // White text on dark header
  --header-text-color-hover: #e76f51;
  --link-color: #2a9d8f;
  --link-color-hover: #1b5e54;

  // TODO: Add more Division C specific overrides
}
```
````

---

### **Step 2: Create Theme Service**

**File:** `src/app/shared/services/theme.service.ts` (NEW FILE)

**Action:** Create this file with the following content

```typescript
import { Injectable, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

/**
 * Available theme names corresponding to user divisions
 */
export type ThemeName = 'division-a' | 'division-b' | 'division-c';

/**
 * Service for managing application themes based on user division
 *
 * Usage:
 * - Call initializeTheme() in AppComponent ngOnInit
 * - Call switchTheme() after user login with division info
 * - Call clearTheme() on user logout
 */
@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly THEME_STORAGE_KEY = 'user-theme';
  private readonly VALID_THEMES: ThemeName[] = ['division-a', 'division-b', 'division-c'];

  constructor(@Inject(DOCUMENT) private document: Document) {}

  /**
   * Initialize theme on application startup
   * Should be called in AppComponent ngOnInit
   */
  initializeTheme(): void {
    const storedTheme = this.getCurrentTheme();
    this.applyTheme(storedTheme);
    console.log('[ThemeService] Theme initialized:', storedTheme);
  }

  /**
   * Switch to a different theme
   * Theme change is instant, no page reload needed
   *
   * @param themeName - The theme to switch to
   */
  switchTheme(themeName: ThemeName): void {
    if (!this.isValidTheme(themeName)) {
      console.error(`[ThemeService] Invalid theme: ${themeName}`);
      return;
    }

    this.applyTheme(themeName);
    localStorage.setItem(this.THEME_STORAGE_KEY, themeName);
    console.log('[ThemeService] Theme switched to:', themeName);
  }

  /**
   * Get the currently active theme
   * Falls back to 'division-a' if no theme is stored or stored theme is invalid
   */
  getCurrentTheme(): ThemeName {
    const stored = localStorage.getItem(this.THEME_STORAGE_KEY);
    return stored && this.isValidTheme(stored) ? (stored as ThemeName) : 'division-a';
  }

  /**
   * Clear stored theme and reset to default
   * Should be called on user logout
   */
  clearTheme(): void {
    localStorage.removeItem(this.THEME_STORAGE_KEY);
    this.applyTheme('division-a');
    console.log('[ThemeService] Theme cleared, reset to division-a');
  }

  /**
   * Check if theme preference exists in storage
   */
  hasStoredTheme(): boolean {
    const stored = localStorage.getItem(this.THEME_STORAGE_KEY);
    return stored !== null && this.isValidTheme(stored);
  }

  /**
   * Apply theme by setting data-theme attribute on <html> element
   */
  private applyTheme(themeName: ThemeName): void {
    this.document.documentElement.setAttribute('data-theme', themeName);
  }

  /**
   * Validate theme name
   */
  private isValidTheme(theme: string): boolean {
    return this.VALID_THEMES.includes(theme as ThemeName);
  }
}
```

---

### **Step 3: Initialize Theme Service in App Component**

**File:** app.component.ts

**Action:** Add theme initialization in ngOnInit

```typescript
import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { ScormApiService } from 'cmp-portal-core';
import { ThemeService } from './shared/services/theme.service'; // ADD THIS IMPORT

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
    private themeService: ThemeService // ADD THIS DEPENDENCY
  ) {}

  ngOnInit(): void {
    // ========================================
    // ✨ INITIALIZE THEME ON APP STARTUP ✨
    // ========================================
    this.themeService.initializeTheme();
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

### **Step 4: Add Theme Switching to Login Component**

**File:** auth.component.ts

**Action:** Add theme switching logic after successful login

```typescript
import { Component, OnInit } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

import { appConstants, AuthService, LangService } from 'cmp-portal-core';
import { environment } from 'src/environments/environment';
import { ThemeService, ThemeName } from '../../shared/services/theme.service'; // ADD THIS IMPORT

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
    private themeService: ThemeService // ADD THIS DEPENDENCY
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
          // ✨ THEME SWITCHING LOGIC - START ✨
          // ========================================

          // Get user data to determine division
          const userData = this.authService.userData.value;

          // Determine theme based on user's division
          // TODO: UPDATE THIS LOGIC BASED ON YOUR USER DATA STRUCTURE
          let themeName: ThemeName = 'division-a'; // Default theme

          // Example 1: If user object has a 'division' property
          if (userData.user?.division === 'B' || userData.user?.division === 'division-b') {
            themeName = 'division-b';
          } else if (userData.user?.division === 'C' || userData.user?.division === 'division-c') {
            themeName = 'division-c';
          }

          // Example 2: If division is determined by user group membership
          // if (userData.groups?.includes('Division-B-Group')) {
          //   themeName = 'division-b';
          // } else if (userData.groups?.includes('Division-C-Group')) {
          //   themeName = 'division-c';
          // }

          // Example 3: If division is in user parameters
          // const divisionParam = userData.user?.parameters?.find(p => p.name === 'division');
          // if (divisionParam?.value === 'B') {
          //   themeName = 'division-b';
          // } else if (divisionParam?.value === 'C') {
          //   themeName = 'division-c';
          // }

          // Switch to the user's theme
          this.themeService.switchTheme(themeName);

          // ========================================
          // ✨ THEME SWITCHING LOGIC - END ✨
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

### **Step 5: Clear Theme on Logout**

**File:** header.component.ts (or wherever logout is handled)

**Action:** Clear theme when user logs out

```typescript
import { ThemeService } from '../shared/services/theme.service'; // ADD THIS IMPORT

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: false,
})
export class HeaderComponent implements OnInit, OnDestroy {
  // ... existing properties ...

  constructor(
    // ... existing dependencies ...
    private themeService: ThemeService // ADD THIS DEPENDENCY
  ) {}

  // ... existing methods ...

  logOut() {
    this.isMenuCollapsed = true;

    // ========================================
    // ✨ CLEAR THEME ON LOGOUT ✨
    // ========================================
    this.themeService.clearTheme();
    // ========================================

    this.authService.logOut().subscribe(() => {
      // Optional: Redirect to home or login page
      // this.router.navigate(['/']);
    });
  }
}
```

---

### **Step 6: Update Component Styles to Use CSS Variables**

**Priority Components to Update:**

1. **Header** - header.component.scss
2. **Footer** - footer.component.scss
3. **Global Buttons** - styles.scss (button section)
4. **Home Page** - home.component.scss
5. **Dashboard** - dashboard.component.scss

**Example Pattern for Updating:**

**BEFORE:**

```scss
@use '../../../assets/scss/theme-config';

.my-component {
  background-color: theme-config.$edu-color-main;
  color: theme-config.$edu-color-white;
  border: 1px solid theme-config.$edu-color-main-dark;

  &:hover {
    background-color: theme-config.$edu-color-highlight;
  }
}
```

**AFTER:**

```scss
@use '../../../assets/scss/theme-config';

.my-component {
  // Use CSS variable with SCSS fallback
  background-color: var(--edu-color-main, #{theme-config.$edu-color-main});
  color: var(--edu-color-white, #{theme-config.$edu-color-white});
  border: 1px solid var(--edu-color-main-dark, #{theme-config.$edu-color-main-dark});

  &:hover {
    background-color: var(--edu-color-highlight, #{theme-config.$edu-color-highlight});
  }
}
```

**Key Pattern:**

```scss
property: var(--css-var-name, #{theme-config.$scss-fallback});
```

---

## 📝 Testing Checklist

After implementation, test the following:

### **Test 1: Theme Initialization**

- [ ] Open application in incognito/private mode
- [ ] Verify default theme (Division A) is applied
- [ ] Check console for "Theme initialized: division-a"

### **Test 2: Theme Switching on Login**

- [ ] Log in as Division B user
- [ ] Verify theme switches instantly (no page reload)
- [ ] Check header, buttons, and main colors change
- [ ] Check console for "Theme switched to: division-b"

### **Test 3: Theme Persistence**

- [ ] Log in and switch theme
- [ ] Refresh the page
- [ ] Verify theme persists after refresh
- [ ] Check localStorage for 'user-theme' key

### **Test 4: Theme on Logout**

- [ ] Log out
- [ ] Verify theme resets to Division A
- [ ] Check localStorage 'user-theme' key is removed

### **Test 5: Lazy-Loaded Components**

- [ ] Log in with Division B
- [ ] Navigate to lazy-loaded routes
- [ ] Verify component styles match Division B theme

### **Test 6: Multiple Browser Tabs**

- [ ] Open app in two tabs
- [ ] Log in with different divisions in each tab
- [ ] Verify each tab maintains its own theme

---

## 🐛 Troubleshooting

### **Issue: Theme not switching**

**Solution:**

- Check browser console for errors
- Verify `data-theme` attribute is set on `<html>` element
- Confirm CSS variables are defined in \_theme-config.scss

### **Issue: Some components not updating**

**Solution:**

- Component styles haven't been updated to use CSS variables yet
- Update component SCSS to use `var(--...)` syntax
- Add missing CSS variables to `:root` in \_theme-config.scss

### **Issue: Theme not persisting**

**Solution:**

- Check localStorage is not disabled
- Verify `initializeTheme()` is called in `AppComponent.ngOnInit`
- Check browser console for theme service logs

### **Issue: Wrong theme on login**

**Solution:**

- Verify division detection logic in auth.component.ts
- Add console.log to check `userData` structure
- Update theme determination logic based on actual user data

---

## 📊 Implementation Timeline

### **Phase 1: Core Setup (2-4 hours)**

- [ ] Update \_theme-config.scss with CSS variables
- [ ] Create `theme.service.ts`
- [ ] Update app.component.ts
- [ ] Update auth.component.ts
- [ ] Update logout logic
- [ ] Test basic theme switching

### **Phase 2: High-Priority Components (4-8 hours)**

- [ ] Update `header.component.scss`
- [ ] Update `footer.component.scss`
- [ ] Update button styles in styles.scss
- [ ] Update `home.component.scss`
- [ ] Test updated components

### **Phase 3: Secondary Components (8-16 hours)**

- [ ] Update `dashboard.component.scss`
- [ ] Update courses.component.scss
- [ ] Update catalog.component.scss
- [ ] Update card components
- [ ] Test all updated components

### **Phase 4: Remaining Components (As Needed)**

- [ ] Update lazy-loaded module components
- [ ] Update detail pages
- [ ] Update admin sections
- [ ] Final testing and refinement

**Total Estimated Time:** 16-30 hours depending on scope

---

## 🎨 Division Color Reference

### **Division A (Default - Aricoma)**

- **Main:** `#23468c` (Blue)
- **Main Dark:** `#15185c` (Dark Blue)
- **Highlight:** `#8d7c54` (Gold)

### **Division B**

- **Main:** `#ff5500` (Orange)
- **Main Dark:** `#cc4400` (Dark Orange)
- **Highlight:** `#00aaff` (Blue)

### **Division C**

- **Main:** `#2a9d8f` (Teal)
- **Main Dark:** `#1b5e54` (Dark Teal)
- **Highlight:** `#e76f51` (Coral)

---

## 📚 Additional Resources

- **CSS Custom Properties:** https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties
- **SCSS Variables:** https://sass-lang.com/documentation/variables
- **Angular Services:** https://angular.io/guide/architecture-services

---

## ✅ Final Notes

- This implementation requires updating SCSS files to use CSS variables
- Not all components need to be updated immediately - prioritize visible components
- Components not yet updated will continue using SCSS variables (fallback)
- Theme switching is instant and works with lazy-loaded modules
- Always test in different browsers and scenarios

---

**Document Version:** 1.0  
**Last Updated:** December 4, 2025

```

This comprehensive guide is now saved and ready for when you implement the theming system!This comprehensive guide is now saved and ready for when you implement the theming system!
```
