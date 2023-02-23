import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { learnathonDashboardComponent } from './learnathonDashboard.component';

describe('learnathonDashboardComponent', () => {
  let component: learnathonDashboardComponent;
  let fixture: ComponentFixture<learnathonDashboardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ learnathonDashboardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(learnathonDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
