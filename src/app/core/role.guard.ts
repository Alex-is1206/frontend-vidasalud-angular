import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from './auth.service';

/**
 * Permite entrar a la ruta solo si el usuario tiene alguno de los roles.
 * Se usa junto al MsalGuard: MsalGuard exige sesión, este exige el rol.
 */
export function roleGuard(...rolesPermitidos: string[]): CanActivateFn {
  return async () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    await auth.inicializar();

    return auth.tieneRol(...rolesPermitidos)
      ? true
      : router.createUrlTree(['/sin-acceso']);
  };
}
