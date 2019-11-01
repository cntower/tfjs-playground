import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { TwoDComponent } from './two-d/two-d.component';
import { HandwrittenDigitRecognitionComponent } from './handwritten-digit-recognition/handwritten-digit-recognition.component';
import { AppRoutingModule } from './app-routing.module';

@NgModule({
  declarations: [
    AppComponent,
    TwoDComponent,
    HandwrittenDigitRecognitionComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
