# API Endpoints Guide

This document provides detailed parameter documentation for backend API endpoints used by the portal. Endpoints are defined in `portal-libs-v20/projects/cmp-portal-core/src/lib/config/app.constants.ts` under `SERVICES`.

---

## Course & Activity Data Endpoints

### GET_USER_ASSIGNED_ACTIVITIES

**URL:** `getUserAssignedActivities.srv`  
**Service:** `courses.service.ts`

**Parameters:**

```typescript
{
  uaaFutureFilter?: 'BOTH' | 'NO_FUTURE' | 'WITH_FUTURE' | 'NO_FILTER'  // defaults to 'NO_FILTER'
}
```

**Response Type:** `PortalPageData`

```typescript
{
  ACCESSES: ActivityAccess[];
  ACTIVITIES: Activity[] | { [key: number]: Activity };
  ACTIVITY_DOCUMENTS: ActivityExtDocument[];
  ACTIVITY_TAGS: ActivityExtTag[];
  ATTEMPTS: ActivityAttempt[];
  CATALOG: { [key: number]: { activityId, mostRecentUaa, children, inCatalog, requestAccess } };
  DOCUMENTS: { [key: number]: CompDocument };
  FIRST_LEVEL_ACT: number[];
  PLACES: { [key: number]: Place };
  RUNS: ActivityRun[];
  TAGS: { [key: number]: ActivityTag };
  USERS: { [key: number]: User };
  RUN_STAFF: ActivityRunStaff[];
  MESSAGE_OBJ: Message[];
  MESSAGE: string | null;
}
```

**Description:** Fetches all activities assigned to the logged-in user with full activity tree structure.

---

### GET_USER_CATALOG_ACTIVITIES

**URL:** `getUserCatalogActivities.srv`  
**Service:** `courses.service.ts`

**Parameters:** None

**Response Type:** `PortalPageData` (same structure as above)

**Description:** Fetches all activities available in the public catalog.

---

### GET_USER_ACTIVITY_DETAIL

**URL:** `getUserActivityDetail.srv`  
**Service:** `courses.service.ts`

**Parameters:**

```typescript
{
  actId: number,                                                      // Required - activity ID
  uaaFutureFilter?: 'BOTH' | 'NO_FUTURE' | 'WITH_FUTURE' | 'NO_FILTER' // defaults to 'NO_FILTER'
}
```

**Response:** `PortalPageData` with `MESSAGE` field containing:

- `'catalog'` - user viewing from catalog
- `'access'` - user has direct assignment
- `'access_from_catalog'` - user signed up from catalog

**Description:** Fetches detailed information for a specific activity including runs, places, tags, and documents.

---

### GET_FOLDER_ACTIVITIES

**URL:** `getFolderActivities.srv`  
**Service:** `courses.service.ts`, `dashboard.service.ts`

**Parameters:**

```typescript
{
  folderId: number,       // Required - folder ID to load
  isComplexData: boolean, // true = include runs, places, users
  isRecursive: boolean    // true = include nested folder contents
}
```

**Response Type:** `FolderActData`

```typescript
{
  ACTIVITIES: Activity[];
  ACTIVITY_TAGS: ActivityExtTag[];
  PLACES: { [key: number]: Place };
  RUNS: ActivityRun[];
  TAGS: { [key: number]: ActivityTag };
  USERS: { [key: number]: User };
  RUN_STAFF: ActivityRunStaff[];
  RESULT_OK: boolean;
}
```

**Description:** Loads activities from a specific folder. Used for dashboard sections.

---

### ACTIVITY_RUN_USER_UPDATE

**URL:** `userActivityAccessRunUpdate.srv`  
**Service:** `courses.service.ts`

**Parameters:**

```typescript
{
  accessId: number,           // Required - user activity access ID
  isSignUp: boolean,          // Required - true when signing up to a run
  runId?: number | null,      // Required when isSignUp=true
  isDeleteAccess?: boolean    // Optional - true to delete the access
}
```

**Response Type:** `GeneralServerResponse`

```typescript
{
  RESULT_OK: boolean;
  MESSAGE?: string;
  DATA?: ActivityAccess;  // When successful and not deleting
}
```

**Description:** Updates user's activity access - sign up for runs or delete access.

---

## Authentication Endpoints

### LOGIN

**URL:** `jwt-authentication` (JWT) or `springLogin` (session)  
**Service:** `auth.service.ts`

**Parameters:** (URL-encoded form data)

```typescript
{
  username: string,
  password: string
}
```

**Response:** Text (token for JWT, success message for session)

**Description:** Authenticates user credentials. Mode depends on `environment.isJwtLogin`.

---

### CHECK_LOGIN

**URL:** `checkLogin.srv`  
**Service:** `auth.service.ts`

**Parameters:** `null`

**Response Type:** `CompetentCheckUserResponse`

```typescript
{
  GLOBAL_ROLES?: number[];
  MESSAGE: string;
  RESULT_OK: boolean;
  USER?: User;
}
```

**Description:** Verifies if user is logged in, returns user data and roles.

---

### LOGOUT

**URL:** `springLogout`  
**Service:** `auth.service.ts`

**Parameters:** None

**Description:** Logs out current user. Supports GET or form-based logout per `environment.logout` config.

---

## CRUD Operations

### CRUD_DATA

**URL:** `crudData.srv`  
**Service:** `data.service.ts`, `operations.service.ts`

**Create Parameters:**

```typescript
{
  toCreate: {
    [tableName: string]: string  // JSON.stringify([objectToCreate])
  },
  customFunction?: string        // JSON.stringify([customFunction])
}
```

**Update Parameters:**

```typescript
{
  toUpdate: {
    [tableName: string]: string  // JSON.stringify([objectToUpdate])
  }
}
```

**Delete Parameters:**

```typescript
{
  toDelete: {
    [tableName: string]: object[]
  }
}
```

**Response Types:**

```typescript
// Create
{ CREATED_RESULT: { [tableName: string]: { [id: number]: object } } }
// Update
{ UPDATED_RESULT: { [tableName: string]: { [id: number]: object } } }
// Delete
{ DELETED_RESULT: boolean }
```

**Description:** Generic CRUD endpoint for database operations by table name.

---

## Catalog & Registration Endpoints

### REGISTER_USER_TO_CATALOG_ACTIVITY

**URL:** `registerUserToCatalogActivity.srv`  
**Service:** `courses.service.ts`

**Parameters:**

```typescript
{
  activityId: number,   // Required - activity to register for
  runId?: number        // Optional - specific run
}
```

**Response Type:** `SignUpData`

```typescript
{
  RESULT_OK: boolean;
  ACCESSES: ActivityAccess[];
  warnings?: { code: string }[];
}
```

**Description:** Registers user to a catalog activity.

---

### REQUEST_ACCESS_TO_ACTIVITY

**URL:** `requestAccessToActivity.srv`  
**Service:** `requests.service.ts`

**Parameters:**

```typescript
{
  activityId?: number,  // Activity to request access to
  formData?: string,    // Form data for the request
  runId?: number        // Specific run to request access to
}
```

**Response:** `GeneralServerResponse` with `DATA` containing created `Message` object

**Description:** Creates access request for activities requiring approval.

---

## User Account Endpoints

### CHANGE_PASSWORD

**URL:** `changeUserPassword.srv`  
**Service:** `account.service.ts`

**Parameters:**

```typescript
{
  oldPass: string,  // Current password
  newPass: string,  // New password
  login: string     // User login/username
}
```

**Response:** `GeneralServerResponse`  
**Error codes in MESSAGE:**

- `'USER_NOT_LOGGED'`
- `'USER_LOGIN_NOT_MATCH'`
- `'USER_PASS_NOT_MATCH'`
- `'BUSINESSERROR_PASSWORD_STRENGTH_POLICY_VIOLATION'`

---

## Rating & Reviews Endpoints

### GET_ACTIVITY_REVIEWS

**URL:** `getActivityReviews.srv`  
**Service:** `courses.service.ts`

**Parameters:**

```typescript
{
  activityId: number; // Required
}
```

**Response Type:** `ReviewsResponse`

```typescript
{
  RESULT_OK: boolean;
  MESSAGE?: string;
  DATA: UserRatingItem[];
  USERS: { [key: number]: string };  // User ID → username
}
```

---

### UPDATE_UAA_RATING

**URL:** `updateUaaRating.srv`  
**Service:** Client app (`rating-modal.service.ts`)

**Parameters:**

```typescript
{
  uaaId: number,              // User activity access ID
  rating: number | null,      // Rating value
  ratingText: string | null   // Text review
}
```

**Response:** `GeneralServerResponse`

---

## Service File Locations

| Endpoint Category    | Primary Service                                               |
| -------------------- | ------------------------------------------------------------- |
| Activity/Course Data | `portal-libs-v20/.../component-services/courses.service.ts`   |
| Authentication       | `portal-libs-v20/.../services/auth.service.ts`                |
| CRUD Operations      | `portal-libs-v20/.../services/data.service.ts`                |
| Account Management   | `portal-libs-v20/.../component-services/account.service.ts`   |
| Access Requests      | `portal-libs-v20/.../component-services/requests.service.ts`  |
| Dashboard Data       | `portal-libs-v20/.../component-services/dashboard.service.ts` |
