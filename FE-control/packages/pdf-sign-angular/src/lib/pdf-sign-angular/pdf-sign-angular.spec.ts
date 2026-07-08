import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PdfSignAngular } from './pdf-sign-angular';

describe('PdfSignAngular', () => {
  let component: PdfSignAngular;
  let fixture: ComponentFixture<PdfSignAngular>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PdfSignAngular],
    }).compileComponents();

    fixture = TestBed.createComponent(PdfSignAngular);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
