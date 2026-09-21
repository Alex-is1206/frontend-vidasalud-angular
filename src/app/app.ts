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

  readonly scope =
    'api://46ae7608-cf06-4d26-9cd6-6b0a3e24f1c0/access_as_user';

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
      scopes: [this.scope]
    });

  }

  logout(): void {

    this.authService.instance.logoutRedirect({
      postLogoutRedirectUri:
        'http://localhost:4200'
    });

  }
}