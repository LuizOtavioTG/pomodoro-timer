import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TimerControls } from './timer-controls';

describe('TimerControls', () => {
  let component: TimerControls;
  let fixture: ComponentFixture<TimerControls>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimerControls]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TimerControls);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit start when start button is triggered', () => {
    spyOn(component.startClicked, 'emit');

    component.startClicked.emit();

    expect(component.startClicked.emit).toHaveBeenCalled();
  });
});
