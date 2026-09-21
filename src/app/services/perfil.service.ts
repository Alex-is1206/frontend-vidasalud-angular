import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../environments/environment';
import { Perfil } from '../core/models';

@Injectable({ providedIn: 'root' })
export class PerfilService {

  private readonly http = inject(HttpClient);

  /** Lo que el BFF leyó del token después de validarlo. */
  obtener(): Promise<Perfil> {
    return firstValueFrom(this.http.get<Perfil>(`${environment.api.baseUrl}/api/me`));
  }
}
