import { computed, inject, Injectable, signal } from '@angular/core';
import { MsalService } from '@azure/msal-angular';
import { AccountInfo, InteractionRequiredAuthError } from '@azure/msal-browser';

import { environment } from '../../environments/environment';

/** Claims del Access Token que usa la interfaz. */
interface ClaimsDelToken {
  roles?: string[];
  scp?: string;
}

/**
 * Estado de la sesión: cuenta activa, roles y scopes.
 *
 * Los roles y scopes se leen de los claims del Access Token emitido
 * para la API. En el frontend solo se usan para adaptar la interfaz
 * (mostrar u ocultar botones): quien de verdad autoriza es el BFF,
 * que vuelve a validar el token en cada petición.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly msal = inject(MsalService);
  private listo?: Promise<void>;

  readonly inicializado = signal(false);
  readonly cuenta = signal<AccountInfo | null>(null);
  readonly roles = signal<string[]>([]);
  readonly scopes = signal<string[]>([]);

  readonly autenticado = computed(() => this.cuenta() !== null);
  readonly nombre = computed(() => this.cuenta()?.name ?? this.cuenta()?.username ?? '');

  /** Admin y Recepcionista gestionan atenciones (confirmar, cancelar, etc.). */
  readonly esPersonal = computed(() => this.tieneRol('Admin', 'Recepcionista'));
  readonly esAdmin = computed(() => this.tieneRol('Admin'));
  readonly puedeAgendar = computed(() => this.tieneRol('Admin', 'Recepcionista', 'Paciente'));
  readonly puedeVerBoxes = computed(() => this.tieneRol('Admin', 'Recepcionista', 'Auditor'));

  /** Se ejecuta una sola vez, aunque la llamen el componente raíz y los guards. */
  inicializar(): Promise<void> {
    this.listo ??= this.cargarSesion();
    return this.listo;
  }

  tieneRol(...roles: string[]): boolean {
    return this.roles().some(rol => roles.includes(rol));
  }

  tieneScope(scope: string): boolean {
    return this.scopes().includes(scope);
  }

  login(): void {
    this.msal.instance.loginRedirect({ scopes: environment.api.scopes });
  }

  logout(): void {
    this.msal.instance.logoutRedirect({
      account: this.cuenta() ?? undefined,
      postLogoutRedirectUri: environment.msal.postLogoutRedirectUri
    });
  }

  private async cargarSesion(): Promise<void> {
    try {
      await this.msal.instance.initialize();

      // Procesa la respuesta si venimos de vuelta del login de Microsoft
      const resultado = await this.msal.instance.handleRedirectPromise();
      if (resultado?.account) {
        this.msal.instance.setActiveAccount(resultado.account);
      }

      const cuenta =
        this.msal.instance.getActiveAccount() ??
        this.msal.instance.getAllAccounts()[0] ??
        null;

      if (cuenta) {
        this.msal.instance.setActiveAccount(cuenta);
        this.cuenta.set(cuenta);
        await this.cargarPermisos(cuenta);
      }
    } catch (error) {
      console.error('Error al inicializar la sesión', error);
    } finally {
      this.inicializado.set(true);
    }
  }

  /** Obtiene el Access Token de la API y lee sus claims roles y scp. */
  private async cargarPermisos(cuenta: AccountInfo): Promise<void> {
    try {
      const resultado = await this.msal.instance.acquireTokenSilent({
        scopes: environment.api.scopes,
        account: cuenta
      });

      const claims = decodificarPayload(resultado.accessToken);
      this.roles.set(claims.roles ?? []);
      this.scopes.set(claims.scp ? claims.scp.split(' ') : []);
    } catch (error) {
      if (error instanceof InteractionRequiredAuthError) {
        // La sesión silenciosa expiró: se pide al usuario que vuelva a entrar
        await this.msal.instance.acquireTokenRedirect({
          scopes: environment.api.scopes,
          account: cuenta
        });
        return;
      }
      console.error('No se pudieron leer los permisos del token', error);
    }
  }
}

/** Decodifica el payload (segunda parte) de un JWT, respetando UTF-8. */
function decodificarPayload(token: string): ClaimsDelToken {
  const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
  const conRelleno = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const bytes = Uint8Array.from(atob(conRelleno), caracter => caracter.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes)) as ClaimsDelToken;
}
