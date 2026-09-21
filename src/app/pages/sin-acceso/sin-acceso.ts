import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Destino del roleGuard cuando el usuario no tiene el rol necesario. */
@Component({
  selector: 'app-sin-acceso',
  imports: [RouterLink],
  template: `
    <section class="hero">
      <h1>403</h1>
      <p>No tienes permisos para acceder a esta sección.</p>
      <a class="btn btn-primary" routerLink="/">Volver al inicio</a>
    </section>
  `
})
export class SinAccesoPage {}
