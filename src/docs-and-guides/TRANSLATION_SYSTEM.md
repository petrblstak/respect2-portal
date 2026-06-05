# 🌐 Streamlined Translation System

This portal uses an optimized translation system with base translations and client-specific overrides. This approach maximizes efficiency while allowing easy customization for different clients.

## 📁 File Structure

```
src/assets/i18n/
├── cs.json          # Base Czech translations (27KB, 383 keys)
├── cs_client.json   # Aricoma-specific overrides (3KB, 44 keys)
├── en.json          # Base English translations (28KB)
└── sk.json          # Base Slovak translations (29KB)
```

## 🔧 How It Works

The system uses a custom `MergedTranslateLoader` that:

- Loads base translations from `cs.json`
- Applies client overrides from `cs_client.json`
- Client translations take precedence over base translations
- Results in 89% file size reduction for client files

**Translation Precedence:**

```
Base Translations (cs.json) < Client Overrides (cs_client.json)
```

## 🛠️ Development Workflow

### Adding Universal Translations

Edit `cs.json` directly for translations shared across all clients:

```json
{
  "NEW_BUTTON": "Save",
  "ERROR_MESSAGE": "Something went wrong"
}
```

### Adding Client Overrides

Edit `cs_client.json` only for Aricoma-specific customizations:

```json
{
  "DASHBOARD_HEADER": "Aricoma Training",
  "COURSES_HEADER": "Moje vzdělávání"
}
```

## 🎯 Decision Guide

- 🌍 **Universal for all clients?** → Add to `cs.json`
- 🏢 **Aricoma-specific?** → Add/modify in `cs_client.json`

## � Benefits

- **89% smaller client files** (3KB vs 27KB)
- **Simple workflow** - direct file editing
- **Clear separation** between universal and client-specific content
- **Fast loading** due to optimized file sizes
- **Easy maintenance** with no complex scripts

## ⚙️ Technical Implementation

The system is configured in `app.module.ts` with the `MergedTranslateLoader`:

### Basic Configuration (Current Setup)

```typescript
import { CreateMergedTranslateLoader } from './shared/merged-translate-loader';

TranslateModule.forRoot({
  loader: {
    provide: TranslateLoader,
    useFactory: CreateMergedTranslateLoader,
    deps: [HttpClient],
  },
});
```

### Advanced Configuration with Custom Settings

```typescript
import { CreateMergedTranslateLoaderWithConfig } from './shared/merged-translate-loader';

TranslateModule.forRoot({
  loader: {
    provide: TranslateLoader,
    useFactory: CreateMergedTranslateLoaderWithConfig({
      prefix: '/assets/i18n/',
      suffix: '.json',
      useClientOverrides: true,
      useEnvironmentOverrides: false,
      clientName: 'client',
      environment: 'prod',
    }),
    deps: [HttpClient],
  },
});
```

**Configuration Options:**

- `prefix`: Path to translation files (default: `/assets/i18n/`)
- `suffix`: File extension (default: `.json`)
- `useClientOverrides`: Enable client-specific overrides (default: `true`)
- `useEnvironmentOverrides`: Enable environment-specific overrides (default: `false`)
- `clientName`: Client identifier for override files (default: `client`)
- `environment`: Environment identifier for override files (default: `prod`)

## 📈 Performance

- **Load Time**: Only loads necessary files (base + overrides)
- **Bundle Size**: 89% reduction for client-specific translations
- **Memory Usage**: Efficient merging process
- **Caching**: Standard browser caching applies to both files
