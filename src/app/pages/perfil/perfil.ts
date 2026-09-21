import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';

import { AuthService } from '../../core/auth.service';
import { mensajeDeError } from '../../core/http-error';
import { Perfil } from '../../core/models';
import { PerfilService } from '../../services/perfil.service';

/**
 * Muestra el mismo token visto desde los dos lados:
 * lo que leyó el frontend y lo que validó el BFF.
 */
@Component({
  selector: 'app-perfil',
  imports: [DatePipe],
  templateUrl: './perfil.html'
})
export class PerfilPage implements OnInit {

  readonly auth = inject(AuthService);
  private readonly perfilApi = inject(PerfilService);

  readonly perfil = signal<Perfil | null>(null);
  readonly cargando = signal(false);
  readonly error = signal('');

  async ngOnInit(): Promise<void> {
    await this.auth.inicializar();
    await this.consultar();
  }

  async consultar(): Promise<void> {
    this.cargando.set(true);
    this.error.set('');
    try {
      this.perfil.set(await this.perfilApi.obtener());
    } catch (err) {
      this.error.set(mensajeDeError(err));
    } finally {
      this.cargando.set(false);
    }
  }
}
