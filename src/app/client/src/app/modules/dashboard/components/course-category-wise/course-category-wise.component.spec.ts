import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ContentCategoryWiseComponent } from './content-category-wise.component';

describe('ContentCategoryWiseComponent', () => {
  let component: ContentCategoryWiseComponent;
  let fixture: ComponentFixture<ContentCategoryWiseComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ContentCategoryWiseComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ContentCategoryWiseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
