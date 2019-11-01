import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HandwrittenDigitRecognitionComponent } from './handwritten-digit-recognition.component';

describe('HandwrittenDigitRecognitionComponent', () => {
  let component: HandwrittenDigitRecognitionComponent;
  let fixture: ComponentFixture<HandwrittenDigitRecognitionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HandwrittenDigitRecognitionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HandwrittenDigitRecognitionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
