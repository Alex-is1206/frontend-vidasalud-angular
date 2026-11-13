import { Routes } from '@angular/router';
import { MsalGuard } from '@azure/msal-angular';

import { roleGuard } from './core/role.guard';
import { AnaliticaPage } from './pages/analitica/analitica';
import { AtencionesPage } from './pages/atenciones/atenciones';
import { BoxesPage } from './pages/boxes/boxes';
import { HomePage } from './pages/home/home';
import { PerfilPage } from './pages/perfil/perfil';
import { PrestacionesPage } from './pages/prestaciones/prestaciones';
import { SinAccesoPage } from './pages/sin-acceso/sin-acceso';

export const routes: Routes = [
  { path: '', component: HomePage, title: 'VidaSalud' },

  // MsalGuard: exige sesión iniciada
  {
    path: 'atenciones',
    component: AtencionesPage,
    canActivate: [MsalGuard],
    title: 'Atenciones · VidaSalud'
  },
  {
    path: 'prestaciones',
    component: PrestacionesPage,
    canActivate: [MsalGuard],
    title: 'Prestaciones · VidaSalud'
  },
  {
    path: 'perfil',
    component: PerfilPage,
    canActivate: [MsalGuard],
    title: 'Mi perfil · VidaSalud'
  },

  // MsalGuard + roleGuard: exige sesión Y un rol del personal
  {
    path: 'boxes',
    component: BoxesPage,
    canActivate: [MsalGuard, roleGuard('Admin', 'Recepcionista', 'Auditor')],
    title: 'Boxes · VidaSalud'
  },

  // Panel en tiempo real alimentado por Kafka: solo Admin y Auditor
  {
    path: 'analitica',
    component: AnaliticaPage,
    canActivate: [MsalGuard, roleGuard('Admin', 'Auditor')],
    title: 'Analítica · VidaSalud'
  },

  { path: 'sin-acceso', component: SinAccesoPage, title: 'Sin acceso · VidaSalud' },
  { path: '**', redirectTo: '' }
];
