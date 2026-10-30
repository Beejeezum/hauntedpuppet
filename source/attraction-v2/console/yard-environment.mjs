// The reviewed public package replaces only this literal. Local capabilities
// still require the private server's actual status and explicit pairing.
export const PICTURE_ONLY = false;

export function mountPreviewNotice() {
  if (!PICTURE_ONLY || document.getElementById('yard-preview-note')) return;
  const note = document.createElement('p'); note.id = 'yard-preview-note';
  note.className = 'yard-preview-note';
  note.textContent = 'Yard preview · Pictures, saved voices, effects and projector output. New spoken lines and phone control run in the laptop console.';
  const header = document.querySelector('header');
  if (header) header.after(note);
}
