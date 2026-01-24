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

  it('should open the settings modal', () => {
    component.openSettingsModal();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.modal-backdrop')).not.toBeNull();
    expect(compiled.textContent).toContain('Configuracoes');
  });
});
