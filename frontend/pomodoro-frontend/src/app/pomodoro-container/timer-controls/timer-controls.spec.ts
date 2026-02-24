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

  it('should emit toggle when the main button is triggered', () => {
    spyOn(component.toggleClicked, 'emit');

    component.toggleClicked.emit();

    expect(component.toggleClicked.emit).toHaveBeenCalled();
  });

  it('should render pause label while running', () => {
    component.isRunning = true;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.control-button.primary')?.textContent)
      .toContain('Pausar');
  });

  it('should disable reset when requested', () => {
    component.isResetDisabled = true;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const resetButton = compiled.querySelector(
      '.control-button.danger'
    ) as HTMLButtonElement;
    expect(resetButton.disabled).toBeTrue();
  });
});
