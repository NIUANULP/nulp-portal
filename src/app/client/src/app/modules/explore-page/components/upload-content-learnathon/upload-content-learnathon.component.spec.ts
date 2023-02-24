import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadContentLearnathonComponent } from './upload-content-learnathon.component';

describe('UploadContentLearnathonComponent', () => {
  let component: UploadContentLearnathonComponent;
  let fixture: ComponentFixture<UploadContentLearnathonComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ UploadContentLearnathonComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UploadContentLearnathonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
