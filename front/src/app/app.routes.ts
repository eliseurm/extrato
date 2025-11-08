import { Routes } from '@angular/router';
import { ExtratoIndividualComponent } from './extrato-individual/extrato-individual.component';
import { LoginComponent } from './login/login.component';
import { AdminPessoasComponent } from './admin-pessoa/admin-pessoas.component';
import { authGuard } from './login/auth.guard';

export const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'admin/pessoas', component: AdminPessoasComponent, canActivate: [authGuard] },
  { path: 'extrato/:slug', component: ExtratoIndividualComponent },
  // Compatibilidade com links antigos sem prefixo
  { path: ':slug', component: ExtratoIndividualComponent },
  { path: '**', redirectTo: '' }
];
