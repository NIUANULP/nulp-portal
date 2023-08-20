import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CourseProgressReportComponent } from './course-progress-report.component';

describe('CourseProgressReportComponent', () => {
  let component: CourseProgressReportComponent;
  let fixture: ComponentFixture<CourseProgressReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CourseProgressReportComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CourseProgressReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
