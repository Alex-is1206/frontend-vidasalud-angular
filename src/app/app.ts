import {
  Component,
  OnInit,
  signal
} from '@angular/core';

import {
  RouterLink,
  RouterOutlet
} from '@angular/router';

import { MsalService } from '@azure/msal-angular';

import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',

  imports: [
    RouterOutlet,
    RouterLink
  ],

  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {

  initialized = signal(false);
  loggedIn = signal(false);

  constructor(
    public authService: MsalService
  ) {}

  async ngOnInit(): Promise<void> {

    await this.authService.instance.initialize();

    const result =
      await this.authService.instance.handleRedirectPromise();

    if (result?.account) {

      this.authService.instance.setActiveAccount(
        result.account
      );
    }

    const accounts =
      this.authService.instance.getAllAccounts();

    if (
      accounts.length > 0 &&
      !this.authService.instance.getActiveAccount()
    ) {

      this.authService.instance.setActiveAccount(
        accounts[0]
      );
    }

    this.loggedIn.set(
      accounts.length > 0
    );

    this.initialized.set(true);
  }

  login(): void {

    this.authService.instance.loginRedirect({
      scopes: environment.api.scopes
    });

  }

  logout(): void {

    this.authService.instance.logoutRedirect({
      postLogoutRedirectUri:
        environment.msal.postLogoutRedirectUri
    });

  }
}