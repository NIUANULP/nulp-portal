import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CertificateTemplateUploadComponent } from './certificate-template-upload.component';

describe('CertificateTemplateUploadComponent', () => {
  let component: CertificateTemplateUploadComponent;
  let fixture: ComponentFixture<CertificateTemplateUploadComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CertificateTemplateUploadComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CertificateTemplateUploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
