import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PomodoroContainer } from './pomodoro-container';

describe('PomodoroContainer', () => {
  let component: PomodoroContainer;
  let fixture: ComponentFixture<PomodoroContainer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PomodoroContainer]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PomodoroContainer);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
