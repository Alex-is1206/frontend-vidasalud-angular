import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners
} from '@angular/core';

import { provideRouter } from '@angular/router';

import {
  HTTP_INTERCEPTORS,
  provideHttpClient,
  withInterceptorsFromDi
} from '@angular/common/http';

import {
  BrowserCacheLocation,
  InteractionType,
  IPublicClientApplication,
  PublicClientApplication
} from '@azure/msal-browser';

import {
  MSAL_GUARD_CONFIG,
  MSAL_INSTANCE,
  MSAL_INTERCEPTOR_CONFIG,
  MsalBroadcastService,
  MsalGuard,
  MsalGuardConfiguration,
  MsalInterceptor,
  MsalInterceptorConfiguration,
  MsalService
} from '@azure/msal-angular';

import { routes } from './app.routes';

const API_SCOPE =
  'api://46ae7608-cf06-4d26-9cd6-6b0a3e24f1c0/access_as_user';

export function MSALInstanceFactory(): IPublicClientApplication {

  return new PublicClientApplication({
    auth: {
      clientId:
        '3688fb90-195e-45d4-91ab-1db9c537fbba',

      authority:
        'https://login.microsoftonline.com/d98821f0-7585-4281-b1ab-9eafbc59c2f5',

      redirectUri:
        'http://localhost:4200',

      postLogoutRedirectUri:
        'http://localhost:4200'
    },

    cache: {
      cacheLocation:
        BrowserCacheLocation.LocalStorage
    }
  });
}

export function MSALGuardConfigFactory():
  MsalGuardConfiguration {

  return {
    interactionType: InteractionType.Redirect,

    authRequest: {
      scopes: [API_SCOPE]
    }
  };
}

export function MSALInterceptorConfigFactory():
  MsalInterceptorConfiguration {

  const protectedResourceMap =
    new Map<string, Array<string>>();

  protectedResourceMap.set(
    'http://localhost:8080/api/secure',
    [API_SCOPE]
  );

  return {
    interactionType: InteractionType.Redirect,
    protectedResourceMap
  };
}

export const appConfig: ApplicationConfig = {

  providers: [

    provideBrowserGlobalErrorListeners(),

    provideRouter(routes),

    provideHttpClient(
      withInterceptorsFromDi()
    ),

    {
      provide: HTTP_INTERCEPTORS,
      useClass: MsalInterceptor,
      multi: true
    },

    {
      provide: MSAL_INSTANCE,
      useFactory: MSALInstanceFactory
    },

    {
      provide: MSAL_GUARD_CONFIG,
      useFactory: MSALGuardConfigFactory
    },

    {
      provide: MSAL_INTERCEPTOR_CONFIG,
      useFactory: MSALInterceptorConfigFactory
    },

    MsalService,
    MsalGuard,
    MsalBroadcastService
  ]
};