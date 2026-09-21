import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../environments/environment';
import { Box, NuevaPrestacion, NuevoBox, Prestacion } from '../core/models';

/** Prestaciones y boxes, a través del BFF. El token lo adjunta el MsalInterceptor. */
@Injectable({ providedIn: 'root' })
export class CatalogoService {

  private readonly http = inject(HttpClient);
  private readonly base = `${environment.api.baseUrl}/api/catalog`;

  listarPrestaciones(): Promise<Prestacion[]> {
    return firstValueFrom(this.http.get<Prestacion[]>(`${this.base}/services`));
  }

  crearPrestacion(prestacion: NuevaPrestacion): Promise<Prestacion> {
    return firstValueFrom(this.http.post<Prestacion>(`${this.base}/services`, prestacion));
  }

  actualizarPrestacion(id: number, prestacion: NuevaPrestacion): Promise<Prestacion> {
    return firstValueFrom(this.http.put<Prestacion>(`${this.base}/services/${id}`, prestacion));
  }

  listarBoxes(): Promise<Box[]> {
    return firstValueFrom(this.http.get<Box[]>(`${this.base}/boxes`));
  }

  crearBox(box: NuevoBox): Promise<Box> {
    return firstValueFrom(this.http.post<Box>(`${this.base}/boxes`, box));
  }

  actualizarBox(id: number, box: NuevoBox): Promise<Box> {
    return firstValueFrom(this.http.put<Box>(`${this.base}/boxes/${id}`, box));
  }
}
