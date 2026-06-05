# Signals Implementation Guide - Aricoma Portal

## Practical Step-by-Step Migration Plan

**Created:** November 16, 2025  
**Target:** Convert data flow from Subjects/subscriptions to Signals

---

## 🎯 Data Flow Analysis

### Current Architecture

```
DataService (HTTP Observable)
  ↓
CoursesService (Subject.next())
  ↓
ActDetailComponent (.subscribe())
  ↓ @Input + refreshTrigger hack
ActDataLineComponent (ngOnChanges)
```

### Target Architecture with Signals

```
DataService (HTTP Observable)
  ↓
CoursesService (signal.set())
  ↓
ActDetailComponent (computed())
  ↓ signal inputs
ActDataLineComponent (automatic reactivity)
```

---

## 📅 Implementation Plan

### **Week 1: CoursesService Migration** ⭐⭐⭐⭐⭐

**File:** `portal-libs-v20/projects/cmp-portal-core/src/lib/component-services/courses.service.ts`

#### Step 1.1: Add Signal Import

```typescript
// At top of file
import { Injectable, Inject, signal, computed } from '@angular/core';
import { Observable } from 'rxjs'; // Keep Observable for HTTP
import { map } from 'rxjs/operators';
// Remove: Subject import
```

#### Step 1.2: Convert Data Properties to Signals

**Find (Lines 6-12):**

```typescript
dataUpdate = new Subject<CourseData>();
catalogUpdate = new Subject<CourseData>();
actDetailUpdate = new Subject<CourseData>();

catalogData: CourseData = new CourseData();
assignedData: CourseData = new CourseData();
actDetailData: CourseData = new CourseData();
```

**Replace with:**

```typescript
// Signals replace both the Subject streams AND the data properties!
catalogData = signal<CourseData>(new CourseData());
assignedData = signal<CourseData>(new CourseData());
actDetailData = signal<CourseData>(new CourseData());

// No separate Subject streams needed!
// Components will read the signals directly
```

#### Step 1.3: Update All `.next()` Calls to `.set()` or `.update()`

**Find pattern throughout file:**

```typescript
this.assignedData = processedData;
this.dataUpdate.next(this.assignedData);
```

**Replace with:**

```typescript
this.assignedData.set(processedData);
// Signal automatically notifies all consumers!
```

**Example in getAssignedCoursesV2() (around line 400):**

```typescript
// OLD:
this.assignedData = new CourseData();
// ... process data ...
this.assignedData = pageData;
this.dataUpdate.next(this.assignedData);

// NEW:
const pageData = new CourseData();
// ... process data ...
this.assignedData.set(pageData);
```

**Example in getCatalogCoursesV2() (around line 618):**

```typescript
// OLD:
this.catalogData = pageData;
this.catalogUpdate.next(this.catalogData);

// NEW:
this.catalogData.set(pageData);
```

**Example in getUserActivityDetail() (around line 183):**

```typescript
// OLD:
this.actDetailData = pageData;
this.actDetailUpdate.next(this.actDetailData);

// NEW:
this.actDetailData.set(pageData);
```

#### Step 1.4: Update updateLangBasedData() Method (Line 1277)

**Find:**

```typescript
updateLangBasedData(dataType: 'assigned' | 'catalog' | 'detail') {
  let courseData: CourseData;
  let updateSubject: Subject<CourseData>;
  if (dataType === 'assigned') {
    courseData = this.assignedData;
    updateSubject = this.dataUpdate;
  } else if (dataType === 'catalog') {
    courseData = this.catalogData;
    updateSubject = this.catalogUpdate;
  } else if (dataType === 'detail') {
    courseData = this.actDetailData;
    updateSubject = this.actDetailUpdate;
  }

  // ... transform data ...

  updateSubject.next(courseData);
}
```

**Replace with:**

```typescript
updateLangBasedData(dataType: 'assigned' | 'catalog' | 'detail') {
  // Get current signal value with ()
  const courseData = dataType === 'assigned' ? this.assignedData()
    : dataType === 'catalog' ? this.catalogData()
    : this.actDetailData();

  // Transform data (same logic)
  for (const key in courseData.activities) {
    courseData.activities[key] = this.utilsService.localizeName<Activity>(
      courseData.activities[key]
    );
  }

  // Update the appropriate signal
  if (dataType === 'assigned') {
    this.assignedData.set(courseData);
  } else if (dataType === 'catalog') {
    this.catalogData.set(courseData);
  } else {
    this.actDetailData.set(courseData);
  }
}
```

**Testing Week 1:**

- ✅ Run `npm run build` in portal-libs-v20
- ✅ Check no TypeScript errors
- ✅ Library consumers should still work (backward compatible during migration)

---

### **Week 2: DataService Migration** ⭐⭐⭐⭐

**File:** `portal-libs-v20/projects/cmp-portal-core/src/lib/services/data.service.ts`

#### Step 2.1: Convert requestInProgress

**Find (Line 5):**

```typescript
requestInProgress = new BehaviorSubject<boolean>(false);
```

**Replace with:**

```typescript
requestInProgress = signal<boolean>(false);
```

#### Step 2.2: Update All Usages

**Find pattern (appears ~10 times):**

```typescript
this.requestInProgress.next(true);
// ...
this.requestInProgress.next(false);
```

**Replace with:**

```typescript
this.requestInProgress.set(true);
// ...
this.requestInProgress.set(false);
```

**Example locations:**

- Line 16: `cmpPostCall()` start
- Line 27: `cmpPostCall()` end (in pipe)
- Line 39: `cmpFilePostCall()` start
- Line 75: `cmpGetCall()` start
- Line 164: `logSimpleError()` start
- Multiple places in `processServerResponse()`

**Testing Week 2:**

- ✅ Rebuild library: `npm run build`
- ✅ Test HTTP calls still work
- ✅ Check loading indicators update correctly

---

### **Week 3: ActDetailComponent Migration** ⭐⭐⭐⭐⭐

**File:** `aricoma-portal-v20/src/app/portal/act-detail/act-detail.component.ts`

#### Step 3.1: Add Signal Imports

```typescript
import { Component, OnInit, computed, effect, signal } from '@angular/core';
// Remove: OnDestroy
```

#### Step 3.2: Remove Subscription Properties

**Find (Lines 63-66):**

```typescript
private userSub!: Subscription;
private playActivitySub!: Subscription;
private actDetailDataSub!: Subscription;
```

**Delete these lines** - no longer needed!

#### Step 3.3: Convert Component Properties to Computed Signals

**Find:**

```typescript
cmpUser!: UserData;
courseData!: CourseData;
```

**Replace with:**

```typescript
protected cmpUser = computed(() => this.authService.userData());
protected courseData = computed(() => this.coursesService.actDetailData());
protected isCoursePreparing = computed(() =>
  this.playActivityService.isActivityLaunching()
);
```

#### Step 3.4: Replace ngOnInit Subscriptions

**Find (Lines 141-158):**

```typescript
ngOnInit(): void {
  this.route.params.subscribe((params) => {
    let pgId = params['id'];
    if (pgId) this.actId = parseInt(pgId);
    if (!this.isCourseDataInit) {
      this.coursesService.getUserActivityDetail(this.actId!, 'BOTH');
    }
    this.setupPageForCurrentAct();
  });

  this.userSub = this.authService.userData.subscribe((userData) => {
    this.cmpUser = userData;
  });

  this.playActivitySub = this.playActivityService.isActivityLaunching.subscribe((isPlaying) => {
    this.isCoursePreparing = isPlaying;
  });

  this.actDetailDataSub = this.coursesService.actDetailUpdate.subscribe((resultData) => {
    this.dataUpdated(resultData);
  });

  this.requestsControl = this.coreDataService.coreData.requestsControl;
  this.userRoles = this.coreDataService.coreData.ROLES;
}
```

**Replace with:**

```typescript
constructor(
  private authService: AuthService,
  private route: ActivatedRoute,
  private router: Router,
  private coreDataService: CoreDataService,
  private coursesService: CoursesService,
  private playActivityService: PlayActivityService,
  private utilsService: UtilsService,
  private zone: NgZone,
  private translate: TranslateService,
  private datePipe: DatePipe,
  private ratingModalService: RatingModalService,
  private modalsService: ModalsService
) {
  // React to courseData changes with effect
  effect(() => {
    const data = this.courseData();
    if (data && data !== new CourseData()) {
      this.dataUpdated(data);
    }
  });
}

ngOnInit(): void {
  this.route.params.subscribe((params) => {
    let pgId = params['id'];
    if (pgId) this.actId = parseInt(pgId);
    if (!this.isCourseDataInit) {
      this.coursesService.getUserActivityDetail(this.actId!, 'BOTH');
    }
    this.setupPageForCurrentAct();
  });

  this.requestsControl = this.coreDataService.coreData.requestsControl;
  this.userRoles = this.coreDataService.coreData.ROLES;
}
```

#### Step 3.5: Remove ngOnDestroy Completely

**Delete (Lines 166-170):**

```typescript
ngOnDestroy() {
  this.userSub.unsubscribe();
  this.playActivitySub.unsubscribe();
  this.actDetailDataSub.unsubscribe();
}
```

**Also remove from class declaration:**

```typescript
// Before:
export class ActDetailComponent implements OnInit, OnDestroy {

// After:
export class ActDetailComponent implements OnInit {
```

#### Step 3.6: Update Template Bindings

**Find in `act-detail.component.html`:**

```html
@if (!isCoursesLoading && activity != null && rootItem != null) {
  <!-- Use courseData directly -->
  <cmp-course-tags
    [courseData]="courseData"
```

**Replace with:**

```html
@if (!isCoursesLoading && activity != null && rootItem != null) {
  <!-- Call signal function -->
  <cmp-course-tags
    [courseData]="courseData()"
```

**Find all occurrences of `courseData` in template and add `()` if reading the signal.**

#### Step 3.7: Remove dataRefreshTrigger Hack

**Find (Line 102):**

```typescript
dataRefreshTrigger = 0; // Trigger to force child components to refresh
```

**Delete this property** - no longer needed with signal inputs!

**In template, find:**

```html
<cmp-act-data-line [courseData]="courseData()" [rootItem]="rootItem" [refreshTrigger]="dataRefreshTrigger"></cmp-act-data-line>
```

**Replace with:**

```html
<cmp-act-data-line [courseData]="courseData()" [rootItem]="rootItem"></cmp-act-data-line>
```

**Find in component (Line 593):**

```typescript
private dataUpdated(resultData: CourseData) {
  // ... processing ...
  this.dataRefreshTrigger++; // Force child refresh
}
```

**Remove the increment line** - signal inputs update automatically!

**Testing Week 3:**

- ✅ Component loads without errors
- ✅ Data displays correctly
- ✅ No memory leaks (check Chrome DevTools)
- ✅ Child components update automatically

---

### **Week 4: ActDataLineComponent Migration** ⭐⭐⭐⭐⭐

**File:** `aricoma-portal-v20/src/app/portal/course-cards/act-data-line/act-data-line.component.ts`

#### Step 4.1: Add Signal Imports

```typescript
import { Component, EventEmitter, Output, computed, input } from '@angular/core';
// Remove: Input, OnChanges, OnInit, SimpleChanges
```

#### Step 4.2: Convert @Inputs to Signal Inputs

**Find (Lines 27-30):**

```typescript
@Input({ required: true }) courseData!: CourseData;
@Input({ required: true }) rootItem!: ActivityItemData;
@Input({ required: false }) options?: DataLineOptions;
@Input({ required: false }) refreshTrigger?: number;
```

**Replace with:**

```typescript
// Signal inputs - automatically reactive!
courseData = input.required<CourseData>();
rootItem = input.required<ActivityItemData>();
options = input<DataLineOptions>();
// refreshTrigger removed - not needed!
```

#### Step 4.3: Remove Lifecycle Hooks

**Delete class declaration:**

```typescript
// Before:
export class ActDataLineComponent implements OnInit, OnChanges {

// After:
export class ActDataLineComponent {
```

**Delete ngOnInit and ngOnChanges completely:**

```typescript
// DELETE THIS:
ngOnInit(): void {
  this.checkOptions();
  this.updateComponentData();
}

ngOnChanges(changes: SimpleChanges): void {
  if (changes['refreshTrigger']) {
    this.updateComponentData();
  }
}
```

#### Step 4.4: Convert Properties to Computed Signals

**Find:**

```typescript
runObj: ActivityRun | null = null;
visualType = 0;
courseTime: string | null = null;
aggregatedRunStaff: { [key: number]: string[] } = {};
runStaff: string | null = null;
```

**Replace with:**

```typescript
// Computed signals - automatically update when inputs change!
protected runObj = computed(() => {
  const data = this.courseData();
  const item = this.rootItem();
  const opts = this.options();

  if (item.accessId) {
    let runId = data.accesses[item.accessId].idActivityRun;
    return runId ? data.actRuns[runId] : null;
  } else if (opts?.isShowFirstRun) {
    return item.firstRunId ? data.actRuns[item.firstRunId] : null;
  }
  return null;
});

protected visualType = computed(() => {
  const run = this.runObj();
  if (!run) return 0;

  let startYear = run.runStart.slice(0, 4);
  let endYear = run.runEnd.slice(0, 4);
  let startDM = run.runStart.slice(5, 10);
  let endDM = run.runEnd.slice(5, 10);

  if (startYear !== endYear) return 2;
  if (startDM !== endDM) return 1;
  return 0;
});

protected courseTime = computed(() => {
  const data = this.courseData();
  const item = this.rootItem();
  const activity = data.activities[item.activityId];

  if (!activity?.timeDemand) return null;
  return this.calculateCourseTime(activity.timeDemand);
});

protected aggregatedRunStaff = computed(() => {
  const data = this.courseData();
  const run = this.runObj();
  if (!run || !data.runStaff[run.id]) return {};

  const result: { [key: number]: string[] } = {};
  data.runStaff[run.id].forEach((staffObj) => {
    if (result[staffObj.idObjectRole] == null) {
      result[staffObj.idObjectRole] = [];
    }
    const user = data.users[staffObj.idUserMt];
    const userName = (user.firstName && user.lastName)
      ? `${user.firstName} ${user.lastName}`
      : user.email;
    result[staffObj.idObjectRole].push(userName);
  });
  return result;
});

protected runStaff = computed(() => {
  const staff = this.aggregatedRunStaff();
  if (Object.keys(staff).length === 0) return null;

  const userRoles = this.coreDataService.coreData.ROLES;
  let result = '';
  Object.keys(staff).forEach((roleId: any) => {
    const roleName = userRoles[roleId]?.localName ||
      this.translate.instant('COURSES_ACT_DATA_LINE_UNKNOWN_ROLE');
    result += `<div><strong>${roleName}</strong>: ${staff[roleId].join(', ')}</div>`;
  });
  return result;
});
```

#### Step 4.5: Refactor Private Methods to Pure Functions

**Move `getCourseTime()` logic to pure function:**

```typescript
private calculateCourseTime(timeDemand: number): string | null {
  if (timeDemand == null) return null;

  let days = Math.floor(timeDemand / 1440);
  let time = timeDemand % 1440;
  let hours = Math.floor(time / 60);
  let mins = time % 60;
  let finalString = '';

  if (days) {
    finalString += days;
    if (hours || mins) {
      finalString += ' ' + this.translate.instant('COURSES_TIME_DAYS');
    } else {
      finalString += ' ' + this.translate.instant(
        'COURSES_TIME_DAYS_' + (days === 1 ? '1' : days < 5 ? '2' : '5')
      );
    }
  }

  if (hours) {
    if (days) finalString += ' ';
    finalString += hours;
    if (days || mins) {
      finalString += ' ' + this.translate.instant('COURSES_TIME_HOURS');
    } else {
      finalString += ' ' + this.translate.instant(
        'COURSES_TIME_HOURS_' + (hours === 1 ? '1' : hours < 5 ? '2' : '5')
      );
    }
  }

  if (mins) {
    if (days || hours) {
      finalString += ' ' + mins + ' ' +
        this.translate.instant('COURSES_TIME_MINUTES');
    } else {
      finalString += mins + ' ' + this.translate.instant(
        'COURSES_TIME_MINUTES_' + (mins === 1 ? '1' : mins < 5 ? '2' : '5')
      );
    }
  }

  return finalString;
}
```

#### Step 4.6: Handle Options with Computed

**Find:**

```typescript
private checkOptions() {
  this.options = {
    isShowType: this.options?.isShowType ?? true,
    isShowTime: this.options?.isShowTime ?? true,
    // ... etc
  };
}
```

**Replace with computed:**

```typescript
protected resolvedOptions = computed(() => {
  const opts = this.options();
  return {
    isShowType: opts?.isShowType ?? true,
    isShowTime: opts?.isShowTime ?? true,
    isShowCompleteUntil: opts?.isShowCompleteUntil ?? true,
    isShowRun: opts?.isShowRun ?? true,
    isShowNoRunText: opts?.isShowNoRunText ?? true,
    isShowRunTime: opts?.isShowRunTime ?? true,
    isShowRunLocation: opts?.isShowRunLocation ?? true,
    isShowRunCapacity: opts?.isShowRunCapacity ?? true,
    isShowRunStaff: opts?.isShowRunStaff ?? true,
    isShowDocs: opts?.isShowDocs ?? true,
    isShowFirstRun: opts?.isShowFirstRun ?? false,
  };
});
```

#### Step 4.7: Update Template

**In template, replace:**

```html
@if (options?.isShowType) {
```

**With:**

```html
@if (resolvedOptions().isShowType) {
```

**Replace all `options?.` with `resolvedOptions().`**

**Also update signal reads:**

```html
<!-- Before -->
<div>{{ courseData.activities[rootItem.activityId].localName }}</div>

<!-- After -->
<div>{{ courseData().activities[rootItem().activityId].localName }}</div>
```

**Testing Week 4:**

- ✅ Component renders correctly
- ✅ Updates automatically when parent data changes
- ✅ No manual refresh needed
- ✅ Performance improved (fine-grained updates)

---

## 🧪 Testing Checklist

After each week:

### Functionality Tests

- [ ] Page loads without errors
- [ ] Data displays correctly
- [ ] User interactions work (clicks, navigation)
- [ ] Loading indicators show/hide correctly
- [ ] Child components update automatically

### Performance Tests

- [ ] No excessive re-renders (check React DevTools profiler equivalent)
- [ ] Memory leaks checked (Chrome DevTools Memory tab)
- [ ] Bundle size not significantly increased

### Developer Experience

- [ ] No TypeScript errors
- [ ] Code is cleaner and more readable
- [ ] Less boilerplate code
- [ ] Easier to debug

---

## 📊 Before/After Comparison

### Lines of Code Reduction

**ActDetailComponent:**

- Before: ~170 lines (with subscriptions + lifecycle)
- After: ~140 lines (-30 lines, -18%)

**ActDataLineComponent:**

- Before: ~180 lines (with OnChanges + manual updates)
- After: ~120 lines (-60 lines, -33%)

### Complexity Reduction

**Subscription Management:**

- Before: 3 subscriptions + unsubscribe in ngOnDestroy
- After: 0 subscriptions, 0 manual cleanup

**Refresh Mechanism:**

- Before: Manual `dataRefreshTrigger` counter + ngOnChanges watch
- After: Automatic reactivity with signal inputs

**Bug Risk:**

- Before: Memory leaks if forgot to unsubscribe
- After: Impossible to have memory leaks

---

## 🚨 Common Pitfalls & Solutions

### Pitfall 1: Forgetting to Call Signal as Function

**Wrong:**

```typescript
const user = this.cmpUser; // Returns the signal, not the value!
```

**Right:**

```typescript
const user = this.cmpUser(); // Call signal to get value
```

### Pitfall 2: Mutating Signal Values

**Wrong:**

```typescript
this.courseData().activities[123].name = 'New Name'; // Mutates internal state!
```

**Right:**

```typescript
this.courseData.update(data => ({
  ...data,
  activities: {
    ...data.activities,
    123: { ...data.activities[123], name: 'New Name' },
  },
}));
```

### Pitfall 3: Using Signal in Constructor Before Initialized

**Wrong:**

```typescript
constructor(private service: MyService) {
  const value = this.mySignal(); // Error! Signal not initialized yet
}
```

**Right:**

```typescript
constructor(private service: MyService) {
  effect(() => {
    const value = this.mySignal(); // Works in effect
  });
}
```

---

## 📚 Reference: Key Signal APIs

### Creating Signals

```typescript
// Writable signal
const count = signal(0);

// Read signal
console.log(count()); // 0

// Update signal
count.set(5);
count.update(val => val + 1); // 6
```

### Computed Signals

```typescript
const doubled = computed(() => count() * 2);
console.log(doubled()); // 12 (auto-updates)
```

### Effects

```typescript
effect(() => {
  console.log('Count changed:', count());
  // Runs whenever count() changes
});
```

### Signal Inputs (Angular 17.1+)

```typescript
@Component({...})
class MyComponent {
  data = input.required<string>(); // Required input
  optional = input(42); // Optional with default

  transformed = input(0, {
    transform: (value: string | number) =>
      typeof value === 'string' ? parseInt(value) : value
  });
}
```

---

## 🎯 Success Metrics

After full migration, you should see:

### Code Quality

- ✅ 20-30% less code overall
- ✅ No subscription management
- ✅ No manual refresh mechanisms
- ✅ Clearer data flow

### Performance

- ✅ Fewer change detection cycles
- ✅ Fine-grained updates (only what changed)
- ✅ No memory leaks

### Developer Experience

- ✅ Easier to understand
- ✅ Easier to maintain
- ✅ Harder to introduce bugs
- ✅ Better TypeScript inference

---

**Last Updated:** November 16, 2025  
**Status:** Ready for implementation
