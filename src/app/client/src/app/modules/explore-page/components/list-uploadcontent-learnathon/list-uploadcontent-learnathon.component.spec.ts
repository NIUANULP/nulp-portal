import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ListUploadcontentLearnathonComponent } from './list-uploadcontent-learnathon.component';

describe('ListUploadcontentLearnathonComponent', () => {
  let component: ListUploadcontentLearnathonComponent;
  let fixture: ComponentFixture<ListUploadcontentLearnathonComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ListUploadcontentLearnathonComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ListUploadcontentLearnathonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
