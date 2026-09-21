import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, signal } from '@angular/core';

import { environment } from '../environments/environment';

/** Lo que el BFF responde en GET /api/me, leído del token validado. */
interface MeResponse {
  name: string;
  username: string;
  subject: string;
  issuer: string;
  audience: string[];
  roles: string[];
  scopes: string[];
  expiresAt: string;
}

@Component({
  selector: 'app-secure',
  standalone: true,
  template: `
    <h2>Zona protegida VidaSalud</h2>
    <p>Ruta protegida mediante MsalGuard ✅</p>

    <button (click)="consultarIdentidad()">
      Consultar mi identidad en el BFF
    </button>

    @if (cargando()) {
      <p>Consultando backend...</p>
    }

    @if (error()) {
      <p>❌ {{ error() }}</p>
    }

    @if (me(); as usuario) {
      <h3>{{ usuario.name }}</h3>
      <p>{{ usuario.username }}</p>

      <p><strong>Roles:</strong>
        {{ usuario.roles.length ? usuario.roles.join(', ') : 'sin roles asignados' }}
      </p>

      <p><strong>Scopes:</strong> {{ usuario.scopes.join(', ') }}</p>
      <p><strong>Issuer:</strong> {{ usuario.issuer }}</p>
      <p><strong>Audience:</strong> {{ usuario.audience.join(', ') }}</p>
      <p><strong>Expira:</strong> {{ usuario.expiresAt }}</p>
    }
  `
})
export class SecureComponent {

  me = signal<MeResponse | null>(null);
  error = signal('');
  cargando = signal(false);

  constructor(private http: HttpClient) {}

  consultarIdentidad(): void {
    this.cargando.set(true);
    this.error.set('');
    this.me.set(null);

    // El MsalInterceptor adjunta el token automáticamente
    this.http.get<MeResponse>(`${environment.api.baseUrl}/api/me`).subscribe({
      next: respuesta => {
        this.me.set(respuesta);
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        const detalle = err.error?.message ?? err.statusText;
        this.error.set(`${err.status} - ${detalle}`);
        this.cargando.set(false);
      }
    });
  }
}