import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { TwoDComponent } from './two-d/two-d.component';
import { HandwrittenDigitRecognitionComponent } from './handwritten-digit-recognition/handwritten-digit-recognition.component';
import { LinearComponent } from './linear/linear.component';
const routes: Routes = [
  { path: '', redirectTo: '2d', pathMatch: 'full' },
  { path: '2d', component: TwoDComponent },
  { path: 'digit', component: HandwrittenDigitRecognitionComponent },
  { path: 'linear', component: LinearComponent },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes)
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
