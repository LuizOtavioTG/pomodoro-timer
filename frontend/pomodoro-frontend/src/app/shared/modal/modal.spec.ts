import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModalComponent } from './modal';

@Component({
  standalone: true,
  imports: [ModalComponent],
  template: `
    <app-modal
      [isOpen]="isOpen"
      title="Teste"
      (closed)="closeCount = closeCount + 1"
    >
      <div modalBody>Conteúdo</div>
      <div modalActions>
        <button type="button">Ação</button>
      </div>
    </app-modal>
  `,
})
class TestHostComponent {
  isOpen = true;
  closeCount = 0;
}

describe('ModalComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let component: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should render projected content when open', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Conteúdo');
    expect(compiled.textContent).toContain('Ação');
  });

  it('should emit close when clicking the close button', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const closeButton = compiled.querySelector(
      '.modal-close-button'
    ) as HTMLButtonElement;

    closeButton.click();
    fixture.detectChanges();

    expect(component.closeCount).toBe(1);
  });
});
