import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ContentLeaderboardComponent } from './content-leaderboard.component';

describe('ContentLeaderboardComponent', () => {
  let component: ContentLeaderboardComponent;
  let fixture: ComponentFixture<ContentLeaderboardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ContentLeaderboardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ContentLeaderboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
