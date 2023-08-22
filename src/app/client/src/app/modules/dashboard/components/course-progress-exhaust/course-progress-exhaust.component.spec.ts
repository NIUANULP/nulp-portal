import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CourseProgressExhaustComponent } from './course-progress-exhaust.component';

describe('CourseProgressExhaustComponent', () => {
  let component: CourseProgressExhaustComponent;
  let fixture: ComponentFixture<CourseProgressExhaustComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CourseProgressExhaustComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CourseProgressExhaustComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
