# Angular 15-20 Modernization Guide

## Aricoma Portal - Feature Adoption Roadmap

**Created:** November 15, 2025  
**Current State:** Angular 20, Module-based architecture from Angular 13/14  
**Goal:** Incremental adoption of modern Angular features for better DX and performance

---

## 🎯 Priority Overview

**Most Critical:** Signals → Control Flow (@if/@for) → Deferred Views (@defer)  
**Later:** Signal Inputs → DestroyRef → inject()  
**Much Later:** Standalone Components → Zoneless

---

## 1. Signals (Angular 16+) 🚀

**Impact:** ⭐⭐⭐⭐⭐ (HIGHEST PRIORITY)  
**Effort:** Medium  
**Timeline:** Start now, adopt over 3 months

### Benefits

- ✅ Better performance (fine-grained reactivity)
- ✅ Cleaner code (no manual unsubscribe)
- ✅ Fewer bugs (no memory leaks from forgotten subscriptions)
- ✅ Better change detection
- ✅ Zoneless-ready (future-proof)

### Before (Current Code - HeaderComponent)

```typescript
export class HeaderComponent implements OnInit, OnDestroy {
  private userSub!: Subscription;
  private langSub!: Subscription;
  cmpUser!: UserData;
  currentLang!: LangObject;
  isUserAdmin = false;

  ngOnInit(): void {
    this.userSub = this.authService.userData.subscribe(userData => {
      this.cmpUser = userData;
      if (this.cmpUser.user?.superUser || this.cmpUser.globalRoles?.['ADMIN_VIEW']) {
        this.isUserAdmin = true;
      }
    });
    this.langSub = this.langService.appCurrentLang.subscribe(currentLang => {
      this.currentLang = currentLang;
    });
  }

  ngOnDestroy() {
    this.userSub.unsubscribe();
    this.langSub.unsubscribe();
  }
}
```

**Lines of code:** ~30  
**Issues:** Manual subscription management, memory leak risk, verbose

### After (With Signals)

```typescript
export class HeaderComponent {
  // No more subscriptions, no OnDestroy needed!
  protected cmpUser = computed(() => this.authService.userData());
  protected currentLang = computed(() => this.langService.appCurrentLang());
  protected isUserAdmin = computed(() => {
    const user = this.cmpUser();
    return user.user?.superUser || user.globalRoles?.['ADMIN_VIEW'];
  });

  constructor(
    private authService: AuthService,
    private langService: LangService
  ) {}

  // No ngOnInit, no ngOnDestroy, no subscription management! 🎉
}
```

**Lines of code:** ~12  
**Benefits:** No memory leaks, cleaner, automatic reactivity

### Service Conversion Example (LangService)

**Before:**

```typescript
export class LangService {
  appCurrentLang = new BehaviorSubject<LangObject>(this.coreConfig.langSettings.LANG_CONFIG[this.translate.getCurrentLang()]);

  changeLanguage(langId: string) {
    this.translate.use(langId).subscribe(() => {
      this.appCurrentLang.next(this.coreConfig.langSettings.LANG_CONFIG[langId]);
    });
  }
}
```

**After:**

```typescript
export class LangService {
  appCurrentLang = signal<LangObject>(this.coreConfig.langSettings.LANG_CONFIG[this.translate.getCurrentLang()]);

  changeLanguage(langId: string) {
    this.translate.use(langId).subscribe(() => {
      this.appCurrentLang.set(this.coreConfig.langSettings.LANG_CONFIG[langId]);
    });
  }
}
```

### Template Usage

```html
<!-- Automatically reactive, no subscription needed -->
<div>Current Language: {{ langService.appCurrentLang().langName }}</div>

<!-- With computed signals -->
<div *ngIf="isUserAdmin()">Admin Panel</div>
```

### Action Items - Month 1

1. Convert `LangService.appCurrentLang` from BehaviorSubject → signal
2. Convert `AuthService.userData` from BehaviorSubject → signal
3. Update HeaderComponent to use computed() instead of subscriptions
4. Remove all subscription management in HeaderComponent

---

## 2. New Control Flow - @if, @for (Angular 17) 🔥

**Impact:** ⭐⭐⭐⭐ (HIGH)  
**Effort:** Low  
**Timeline:** Start now, use in all new templates

### Benefits

- ✅ **~50% faster rendering** than *ngIf/*ngFor
- ✅ Better type inference
- ✅ Cleaner syntax
- ✅ Built-in track-by (no more trackBy functions!)
- ✅ Less memory usage

### @if Directive

**Before:**

```html
<div *ngIf="cmpUser.isLogged; else notLogged">
  <h1>Welcome {{ cmpUser.user?.name }}</h1>
</div>
<ng-template #notLogged>
  <p>Please log in</p>
</ng-template>
```

**After:**

```html
@if (cmpUser.isLogged) {
<h1>Welcome {{ cmpUser.user?.name }}</h1>
} @else {
<p>Please log in</p>
}
```

### @for Directive

**Before:**

```html
<ul>
  <li *ngFor="let lang of langsAvailable; trackBy: trackByLang">{{ lang }}</li>
</ul>
```

**After:**

```html
<ul>
  @for (lang of langsAvailable; track lang) {
  <li>{{ lang }}</li>
  }
</ul>
```

**Note:** `track` is required but simpler than trackBy functions!

### @for with index and empty state

```html
<ul>
  @for (course of courses; track course.id; let idx = $index) {
  <li>{{ idx + 1 }}. {{ course.name }}</li>
  } @empty {
  <li>No courses available</li>
  }
</ul>
```

### Action Items - Month 2

1. Use @if/@for in all new templates
2. Gradually replace *ngIf/*ngFor in edited templates
3. No need to convert all existing templates at once

---

## 3. Deferrable Views - @defer (Angular 17) ⚡

**Impact:** ⭐⭐⭐⭐ (HIGH for UX)  
**Effort:** Low  
**Timeline:** Start with heavy components

### Benefits

- ✅ Lazy load parts of templates
- ✅ Faster initial page load
- ✅ Better Core Web Vitals (LCP, FID)
- ✅ Built-in loading/placeholder states
- ✅ Improved perceived performance

### Basic Usage

```html
<!-- Load immediately -->
<app-header></app-header>

<!-- Defer heavy dashboard until visible -->
@defer (on viewport) {
<app-dashboard></app-dashboard>
} @placeholder {
<div class="skeleton-loader"></div>
} @loading (minimum 500ms) {
<app-spinner></app-spinner>
}
```

### Conditional Defer

```html
<!-- Defer admin panel until user is admin -->
@defer (when isUserAdmin()) {
<app-admin-panel></app-admin-panel>
} @placeholder {
<div>Loading admin panel...</div>
}
```

### Common Triggers

```html
<!-- On hover -->
@defer (on hover) {
<app-tooltip></app-tooltip>
}

<!-- On interaction (click/focus) -->
@defer (on interaction) {
<app-complex-form></app-complex-form>
}

<!-- On idle -->
@defer (on idle) {
<app-analytics></app-analytics>
}

<!-- On timer -->
@defer (on timer(3s)) {
<app-promotional-banner></app-promotional-banner>
}

<!-- Prefetch on hover, render on click -->
@defer (on interaction; prefetch on hover) {
<app-expensive-component></app-expensive-component>
}
```

### Use Cases in Aricoma Portal

- Dashboard widgets (defer on viewport)
- Admin panels (defer when isUserAdmin)
- Course detail modals (defer on interaction)
- Analytics/tracking scripts (defer on idle)

### Action Items - Month 2

1. Add @defer to dashboard components
2. Add @defer to admin-only sections
3. Add @defer to heavy course card components

---

## 4. Signal Inputs/Outputs (Angular 17.1+) 🎯

**Impact:** ⭐⭐⭐⭐ (HIGH)  
**Effort:** Low  
**Timeline:** Use in new components, gradually adopt

### Benefits

- ✅ Type-safe inputs with validation
- ✅ Required inputs (compile-time checked!)
- ✅ Transform functions built-in
- ✅ Better change detection
- ✅ Reactive by default

### Before (Traditional @Input/@Output)

```typescript
@Component({
  selector: 'app-course-card',
  templateUrl: './course-card.component.html',
})
export class CourseCardComponent {
  @Input() courseId!: number;
  @Input() isExpanded: boolean = false;
  @Input() title?: string;
  @Output() cardClicked = new EventEmitter<number>();

  onClick() {
    this.cardClicked.emit(this.courseId);
  }
}
```

### After (Signal Inputs/Outputs)

```typescript
@Component({
  selector: 'app-course-card',
  templateUrl: './course-card.component.html',
})
export class CourseCardComponent {
  // Signal inputs - reactive by default!
  courseId = input.required<number>(); // Compiler error if missing!
  isExpanded = input(false); // Default value
  title = input<string | undefined>(); // Optional

  // Signal outputs
  cardClicked = output<number>();

  // Use in computed
  protected displayClass = computed(() => (this.isExpanded() ? 'expanded' : 'collapsed'));

  onClick() {
    this.cardClicked.emit(this.courseId());
  }
}
```

### Input Transforms

```typescript
export class MyComponent {
  // Automatically convert string to number
  count = input(0, {
    transform: (value: string | number) => (typeof value === 'string' ? parseInt(value, 10) : value),
  });

  // Boolean coercion
  disabled = input(false, {
    transform: booleanAttribute, // Built-in helper
  });
}
```

### Template Usage

```html
<!-- Parent component -->
<app-course-card [courseId]="123" [isExpanded]="true" (cardClicked)="handleClick($event)"></app-course-card>

<!-- Inside course-card template -->
<div [class.expanded]="isExpanded()">Course ID: {{ courseId() }}</div>
```

### Action Items - Month 3

1. Use signal inputs/outputs in all new components
2. Convert heavily-used components (CourseCardComponent, etc.)

---

## 5. DestroyRef (Angular 16+) 🧹

**Impact:** ⭐⭐⭐ (MEDIUM)  
**Effort:** Very Low  
**Timeline:** Use in new code

### Benefits

- ✅ No more `ngOnDestroy` implementation
- ✅ Automatic cleanup
- ✅ Works with standalone functions
- ✅ Cleaner component code

### Before

```typescript
export class HeaderComponent implements OnDestroy {
  private routerSub!: Subscription;

  ngOnInit() {
    this.routerSub = this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.actRoute = event.url;
      }
    });
  }

  ngOnDestroy() {
    this.routerSub.unsubscribe();
  }
}
```

### After

```typescript
import { DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export class HeaderComponent {
  private destroyRef = inject(DestroyRef);

  constructor(private router: Router) {
    this.router.events
      .pipe(takeUntilDestroyed(this.destroyRef)) // Auto-cleanup!
      .subscribe(event => {
        if (event instanceof NavigationEnd) {
          this.actRoute = event.url;
        }
      });
  }

  // No ngOnDestroy needed!
}
```

### With Cleanup Callbacks

```typescript
export class MyComponent {
  private destroyRef = inject(DestroyRef);

  constructor() {
    const interval = setInterval(() => console.log('tick'), 1000);

    // Register cleanup
    this.destroyRef.onDestroy(() => {
      clearInterval(interval);
    });
  }
}
```

### Action Items

- Use `takeUntilDestroyed()` for all observable subscriptions in new code
- Gradually replace `ngOnDestroy` in refactored components

---

## 6. inject() Function (Angular 14+) 💉

**Impact:** ⭐⭐⭐ (MEDIUM)  
**Effort:** Very Low  
**Timeline:** Use in new components

### Benefits

- ✅ Cleaner constructor
- ✅ Easier testing
- ✅ Required for functional patterns
- ✅ Works in functions outside constructors

### Before

```typescript
export class HeaderComponent {
  constructor(
    private authService: AuthService,
    private coreDataService: CoreDataService,
    private router: Router,
    private langService: LangService,
    @Inject(DOCUMENT) private document: Document
  ) {}
}
```

### After

```typescript
export class HeaderComponent {
  private authService = inject(AuthService);
  private coreData = inject(CoreDataService);
  private router = inject(Router);
  private langService = inject(LangService);
  private document = inject(DOCUMENT);

  constructor() {
    // Constructor stays clean for initialization logic only
  }
}
```

### Use in Functions (Outside Constructor)

```typescript
// Can't use constructor DI here!
function createAuthGuard() {
  const authService = inject(AuthService);
  const router = inject(Router);

  return () => {
    return authService.isAuthenticated() || router.navigate(['/login']);
  };
}
```

### Action Items

- Use `inject()` in new components for cleaner code
- Optional: gradually convert existing components during refactoring

---

## 7. @switch Control Flow (Angular 17) 🎛️

**Impact:** ⭐⭐⭐ (MEDIUM)  
**Effort:** Very Low

### Benefits

- ✅ Cleaner syntax than ngSwitch
- ✅ Better type inference
- ✅ Consistent with @if/@for

### Before

```html
<div [ngSwitch]="userType">
  <app-student-view *ngSwitchCase="'student'"></app-student-view>
  <app-teacher-view *ngSwitchCase="'teacher'"></app-teacher-view>
  <app-admin-view *ngSwitchCase="'admin'"></app-admin-view>
  <app-public-view *ngSwitchDefault></app-public-view>
</div>
```

### After

```html
@switch (userType) { @case ('student') {
<app-student-view />
} @case ('teacher') {
<app-teacher-view />
} @case ('admin') {
<app-admin-view />
} @default {
<app-public-view />
} }
```

### Action Items

- Replace ngSwitch with @switch in new/edited templates

---

## 8. Standalone Components (Angular 14+) 🏗️

**Impact:** ⭐⭐ (LOW - mostly DX)  
**Effort:** High (for full migration)  
**Timeline:** Later, gradual adoption

### Benefits

- ✅ Less boilerplate (no separate module files)
- ✅ Better tree-shaking (minor bundle size improvement)
- ✅ Easier lazy loading
- ❌ **NOT** faster runtime performance
- ❌ **NOT** better user experience directly

### Current (Module-based)

```typescript
// course-card.component.ts
@Component({
  selector: 'app-course-card',
  templateUrl: './course-card.component.html',
})
export class CourseCardComponent {}

// course-card.module.ts
@NgModule({
  declarations: [CourseCardComponent],
  imports: [CommonModule, FormsModule],
  exports: [CourseCardComponent],
})
export class CourseCardModule {}
```

### Future (Standalone)

```typescript
// course-card.component.ts
@Component({
  selector: 'app-course-card',
  standalone: true,
  imports: [CommonModule, FormsModule], // Import directly
  templateUrl: './course-card.component.html',
})
export class CourseCardComponent {}

// No module file needed!
```

### Migration Strategy

1. **Don't rewrite existing components** - they work fine
2. **New components** → create as standalone
3. **Heavily edited components** → convert during refactor
4. **AppModule** → migrate last (Angular 20+ supports standalone bootstrap)

### Action Items

- Low priority, do gradually over 6-12 months
- Start with new feature components

---

## 9. Zoneless Mode (Angular 18+) 🎯

**Impact:** ⭐⭐ (LOW - optimization)  
**Effort:** High  
**Timeline:** 2026+ (when stable)

### Benefits

- ✅ Smaller bundle (~50KB saved)
- ✅ Slight performance improvement
- ✅ Future-proof architecture

### Prerequisites

- ✅ All reactive state uses signals (or OnPush + observables)
- ✅ Change detection triggered manually or by signals
- ✅ No reliance on Zone.js for third-party libs

### Current Status (November 2025)

- ⚠️ **Experimental** API
- ⚠️ May change before stable release
- ✅ Production-ready for signal-first apps
- ❌ Not recommended for existing apps yet

### How to Enable (When Ready)

```typescript
// main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { provideExperimentalZonelessChangeDetection } from '@angular/core';

bootstrapApplication(AppComponent, {
  providers: [
    provideExperimentalZonelessChangeDetection(),
    // ... other providers
  ],
});
```

### What Works Without Zone.js

- ✅ Signals
- ✅ OnPush components with observables + async pipe
- ✅ Manual ChangeDetectorRef.markForCheck()

### What Breaks Without Zone.js

- ❌ setTimeout/setInterval without manual change detection
- ❌ Promise .then() without triggering detection
- ❌ Direct DOM events without signal updates
- ❌ Third-party libs that expect Zone.js

### Action Items

- **Wait** for API to stabilize (remove "Experimental" prefix)
- **Test** in dev environment after signal adoption is complete
- **Target:** Late 2025 or 2026 for production use

---

## 📊 Feature Comparison Matrix

| Feature           | Impact     | Effort   | User Benefit         | Dev Benefit       | Timeline  |
| ----------------- | ---------- | -------- | -------------------- | ----------------- | --------- |
| **Signals**       | ⭐⭐⭐⭐⭐ | Medium   | Faster UI            | Cleaner code      | **Now**   |
| **@if/@for**      | ⭐⭐⭐⭐   | Low      | 50% faster rendering | Cleaner templates | **Now**   |
| **@defer**        | ⭐⭐⭐⭐   | Low      | Faster page loads    | Easy lazy loading | **Now**   |
| **Signal Inputs** | ⭐⭐⭐⭐   | Low      | Better performance   | Type safety       | Gradually |
| **DestroyRef**    | ⭐⭐⭐     | Very Low | -                    | No memory leaks   | Gradually |
| **inject()**      | ⭐⭐⭐     | Very Low | -                    | Cleaner DI        | New code  |
| **@switch**       | ⭐⭐⭐     | Very Low | -                    | Cleaner syntax    | As needed |
| **Standalone**    | ⭐⭐       | High     | -                    | Less boilerplate  | Later     |
| **Zoneless**      | ⭐⭐       | High     | Bundle size          | -                 | 2026+     |

---

## 🎯 3-Month Action Plan

### Month 1: Signals Foundation

**Goal:** Convert core services to signals

1. Convert `LangService.appCurrentLang`: BehaviorSubject → signal
2. Convert `AuthService.userData`: BehaviorSubject → signal
3. Update `HeaderComponent` to use computed() instead of subscriptions
4. Remove all subscription management in HeaderComponent
5. Test thoroughly in dev environment

**Expected Result:**

- Cleaner service code
- No memory leaks in HeaderComponent
- Foundation for further signal adoption

---

### Month 2: Template Modernization

**Goal:** Adopt new control flow and deferrable views

1. Replace `*ngIf`/`*ngFor` with `@if`/`@for` in new templates
2. Convert 2-3 existing heavily-used templates (header, footer)
3. Add `@defer` to dashboard components
4. Add `@defer` to admin-only sections
5. Measure page load improvements

**Expected Result:**

- ~50% faster rendering in converted templates
- Faster initial page load
- Better user experience

---

### Month 3: Signal Inputs & Refinement

**Goal:** Modernize component communication

1. Convert 2-3 heavily-used components to signal inputs/outputs
2. Create new components with signal inputs by default
3. Expand signal usage in services
4. Document patterns for team

**Expected Result:**

- Type-safe component inputs
- Better reactivity
- Team familiar with modern patterns

---

## 📚 Learning Resources

### Official Angular Docs

- Signals: https://angular.dev/guide/signals
- Control Flow: https://angular.dev/guide/control-flow
- Deferrable Views: https://angular.dev/guide/defer

### Migration Guides

- Signals Migration: https://angular.dev/guide/signals/rxjs-interop
- Standalone Migration: https://angular.dev/reference/migrations/standalone

---

## ✅ Current Status (Aricoma Portal)

**Already Adopted:**

- ✅ Angular 20
- ✅ Vite dev server (`@angular/build:application`)
- ✅ Modern build pipeline
- ✅ provideAppInitializer (new-style initializers)
- ✅ provideHttpClient with interceptors

**Not Yet Adopted:**

- ❌ Signals
- ❌ @if/@for/@switch
- ❌ @defer
- ❌ Signal inputs/outputs
- ❌ DestroyRef
- ❌ Standalone components
- ❌ Zoneless mode

**Next Priority:** Signals (start immediately!)

---

## 🎓 Key Takeaways

1. **Signals are the foundation** - adopt them first, everything else builds on this
2. **New control flow is easy wins** - 50% performance boost with low effort
3. **@defer improves UX immediately** - faster page loads with minimal code changes
4. **Standalone components can wait** - mostly developer convenience
5. **Zoneless is for 2026** - wait for stable API
6. **Incremental adoption works** - no need to rewrite everything at once

---

## 🚀 Success Metrics

After 3 months of adoption, measure:

### Performance

- [ ] Lighthouse score improvement
- [ ] First Contentful Paint (FCP) reduction
- [ ] Largest Contentful Paint (LCP) reduction
- [ ] Time to Interactive (TTI) improvement

### Code Quality

- [ ] Lines of code reduction (subscription management)
- [ ] Number of ngOnDestroy implementations removed
- [ ] Memory leak issues resolved
- [ ] Bundle size (may increase slightly with signals lib, but worth it)

### Developer Experience

- [ ] Time to implement new features
- [ ] Bug count (should decrease)
- [ ] Code review feedback (cleaner code)
- [ ] Team satisfaction

---

**Remember:** The goal is incremental improvement, not a complete rewrite. Start with signals, see the benefits, then expand adoption naturally. Your Angular 14 code still works - these are enhancements, not requirements!

**Last Updated:** November 15, 2025
