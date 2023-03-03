import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LearnathonLandingPageComponent } from './learnathon-landing-page.component';

describe('LearnathonLandingPageComponent', () => {
  let component: LearnathonLandingPageComponent;
  let fixture: ComponentFixture<LearnathonLandingPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LearnathonLandingPageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LearnathonLandingPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
