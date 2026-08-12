/* ============================================================================
   split-text.js — a word splitter, so the paid SplitText plugin isn't needed

   Each word becomes <span class="word" aria-hidden><span>word</span></span>.
   The outer span clips (overflow:hidden in CSS), the inner one moves.

   Accessibility: splitting shreds the text node, and some screen readers
   announce inline-block fragments one at a time with pauses. So the original
   sentence is put back on the container as aria-label and the generated
   fragments are hidden from the accessibility tree — assistive tech reads one
   clean sentence, sighted users get the stagger.
   ========================================================================= */

export function splitWords(el) {
  if (!el || el.dataset.split === 'done') return [];

  const text = el.textContent.replace(/\s+/g, ' ').trim();
  if (!text) return [];

  el.setAttribute('aria-label', text);
  el.textContent = '';

  const words = text.split(' ');
  const frag = document.createDocumentFragment();
  const inners = [];

  words.forEach((w, i) => {
    const outer = document.createElement('span');
    outer.className = 'word';
    outer.setAttribute('aria-hidden', 'true');

    const inner = document.createElement('span');
    inner.textContent = w;

    outer.appendChild(inner);
    frag.appendChild(outer);
    /* A real text node between words, so wrapping and copy-paste behave. */
    if (i < words.length - 1) frag.appendChild(document.createTextNode(' '));

    inners.push(inner);
  });

  el.appendChild(frag);
  el.dataset.split = 'done';
  return inners;
}
