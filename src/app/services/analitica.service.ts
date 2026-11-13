import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { HistorialEntrada, ResumenAnalitica } from '../core/models';

/**
 * Analítica en tiempo real, a través del API Gateway y el BFF.
 * Los datos los calcula ms-vidasalud-analytics consumiendo Kafka.
 * El token lo adjunta el MsalInterceptor (ruta /api/*).
 */
@Injectable({ providedIn: 'root' })
export class AnaliticaService {

  private readonly http = inject(HttpClient);
  private readonly base = `${environment.api.baseUrl}/api/analitica`;

  /** Observable: el panel lo vuelve a pedir cada pocos segundos. */
  resumen(): Observable<ResumenAnalitica> {
    return this.http.get<ResumenAnalitica>(`${this.base}/resumen`);
  }

  historial(atencionId: number): Promise<HistorialEntrada[]> {
    return firstValueFrom(
      this.http.get<HistorialEntrada[]>(`${this.base}/atenciones/${atencionId}/historial`));
  }
}
