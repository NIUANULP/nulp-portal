import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CourseContentLeaderboardComponent } from './course-content-leaderboard.component';

describe('CourseContentLeaderboardComponent', () => {
  let component: CourseContentLeaderboardComponent;
  let fixture: ComponentFixture<CourseContentLeaderboardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CourseContentLeaderboardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CourseContentLeaderboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
