import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-secure',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h2>Zona protegida VidaSalud</h2>

    <p>Ruta protegida mediante MsalGuard ✅</p>

    <button (click)="probarBackend()">
      Probar BFF protegido
    </button>

    @if (respuesta()) {
      <p>{{ respuesta() }}</p>
    }
  `
})
export class SecureComponent {

  respuesta = signal('');

  constructor(private http: HttpClient) {}

  probarBackend(): void {

    this.respuesta.set('Consultando backend...');

    this.http.get(
      'http://localhost:8080/api/secure',
      {
        responseType: 'text'
      }
    ).subscribe({

      next: respuesta => {
        this.respuesta.set(respuesta);
      },

      error: error => {
        this.respuesta.set(
          'Error: ' +
          error.status +
          ' - ' +
          error.statusText
        );
      }

    });
  }
}