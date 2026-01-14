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
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
