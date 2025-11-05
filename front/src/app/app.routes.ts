import { Routes } from '@angular/router';
import { ExtratoIndividualComponent } from './extrato-individual/extrato-individual.component';

export const routes: Routes = [
  { path: ':slug', component: ExtratoIndividualComponent },
  { path: '**', redirectTo: 'demo_demo' }
];
