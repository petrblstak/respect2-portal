import { HttpClient } from '@angular/common/http';
import { TranslateLoader } from '@ngx-translate/core';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface MergedTranslateLoaderConfig {
  prefix?: string;
  suffix?: string;
  useClientOverrides?: boolean;
  useEnvironmentOverrides?: boolean;
  clientName?: string;
  environment?: string;
}

export class MergedTranslateLoader implements TranslateLoader {
  private config: Required<MergedTranslateLoaderConfig>;

  constructor(private http: HttpClient, config: MergedTranslateLoaderConfig = {}) {
    this.config = {
      prefix: '/assets/i18n/',
      suffix: '.json',
      useClientOverrides: true,
      useEnvironmentOverrides: false,
      clientName: 'client',
      environment: 'prod',
      ...config,
    };
  }

  private getCacheBuster(): string {
    // Use build timestamp from environment instead of current time
    // This ensures cache is only invalidated when a new build is made
    return `?v=${environment.buildTime}`;
  }

  getTranslation(lang: string): Observable<any> {
    const requests: { [key: string]: Observable<any> } = {};

    // Add cache-busting parameter for production builds
    const cacheBuster = this.getCacheBuster();

    // 1. Always load base translations (renamed from _default to main file)
    const baseFile = `${this.config.prefix}${lang}${this.config.suffix}${cacheBuster}`;
    requests.base = this.http.get(baseFile).pipe(
      catchError((error) => {
        console.warn(`Base translation file not found: ${baseFile}`);
        return of({});
      })
    );

    // 2. Load client-specific overrides if enabled
    if (this.config.useClientOverrides) {
      const clientOverrideFile = `${this.config.prefix}${lang}_${this.config.clientName}${this.config.suffix}${cacheBuster}`;
      requests.clientOverrides = this.http.get(clientOverrideFile).pipe(catchError(() => of({})));
    }

    // 3. Load environment-specific overrides if enabled
    if (this.config.useEnvironmentOverrides) {
      const envOverrideFile = `${this.config.prefix}${lang}_${this.config.environment}${this.config.suffix}${cacheBuster}`;
      requests.envOverrides = this.http.get(envOverrideFile).pipe(catchError(() => of({})));
    }

    // Merge all translations with proper precedence
    return forkJoin(requests).pipe(
      map((translations: any) => {
        let merged = { ...(translations.base || {}) };

        // Apply client-specific overrides (higher priority)
        if (translations.clientOverrides) {
          merged = { ...merged, ...translations.clientOverrides };
        }

        // Apply environment-specific overrides (highest priority)
        if (translations.envOverrides) {
          merged = { ...merged, ...translations.envOverrides };
        }

        if (console && console.debug) {
          console.debug(`Translations loaded for ${lang}:`, {
            base: Object.keys(translations.base || {}).length,
            clientOverrides: Object.keys(translations.clientOverrides || {}).length,
            envOverrides: Object.keys(translations.envOverrides || {}).length,
            total: Object.keys(merged).length,
          });
        }

        return merged;
      })
    );
  }
}

export function CreateMergedTranslateLoader(http: HttpClient) {
  return new MergedTranslateLoader(http, {
    useClientOverrides: true,
    useEnvironmentOverrides: false,
  });
}

export function CreateMergedTranslateLoaderWithConfig(config: MergedTranslateLoaderConfig) {
  return (http: HttpClient) => new MergedTranslateLoader(http, config);
}
