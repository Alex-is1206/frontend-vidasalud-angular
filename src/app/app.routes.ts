import { Routes } from '@angular/router';
import { MsalGuard } from '@azure/msal-angular';
import { SecureComponent } from './secure';

export const routes: Routes = [
  {
    path: 'secure',
    component: SecureComponent,
    canActivate: [MsalGuard]
  }
];