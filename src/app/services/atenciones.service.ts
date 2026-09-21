import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../environments/environment';
import { Atencion, EstadoAtencion, NuevaAtencion } from '../core/models';

/** Atenciones, a través del BFF. El token lo adjunta el MsalInterceptor. */
@Injectable({ providedIn: 'root' })
export class AtencionesService {

  private readonly http = inject(HttpClient);
  private readonly base = `${environment.api.baseUrl}/api/appointments`;

  /** Si el usuario es Paciente, el BFF filtra y devuelve solo las suyas. */
  listar(estado?: EstadoAtencion): Promise<Atencion[]> {
    const params = estado ? new HttpParams().set('status', estado) : undefined;
    return firstValueFrom(this.http.get<Atencion[]>(this.base, { params }));
  }

  crear(atencion: NuevaAtencion): Promise<Atencion> {
    return firstValueFrom(this.http.post<Atencion>(this.base, atencion));
  }

  cambiarEstado(id: number, estado: EstadoAtencion): Promise<Atencion> {
    return firstValueFrom(
      this.http.put<Atencion>(`${this.base}/${id}/status`, { status: estado })
    );
  }
}
