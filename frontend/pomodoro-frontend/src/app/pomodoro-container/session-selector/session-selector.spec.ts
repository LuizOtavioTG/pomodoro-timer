import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SessionSelector } from './session-selector';

describe('SessionSelector', () => {
  let component: SessionSelector;
  let fixture: ComponentFixture<SessionSelector>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SessionSelector]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SessionSelector);
    component = fixture.componentInstance;
    component.selectedSession = 'short';
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit the selected session', () => {
    spyOn(component.sessionSelected, 'emit');

    component.selectSession('long');

    expect(component.sessionSelected.emit).toHaveBeenCalledWith('long');
  });
});
