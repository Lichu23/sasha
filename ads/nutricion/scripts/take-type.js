// Runs in the page, once per action of a take: types the next character of the booking form, the way a person would (React sees real
// input events). The first character of a field also focuses it, so its ring shows. Fields and texts are in order below.
(() => {
  const FIELDS = [
    ['[role=dialog] input[name=name]', 'Lucía Fernández'],
    ['[role=dialog] input[name=phone]', '11 2345-6789'],
    ['[role=dialog] textarea[name=notes]', 'Quiero bajar de peso'],
  ];
  const queue = FIELDS.flatMap(([selector, text]) => [...text].map((ch, i) => ({selector, ch, first: i === 0})));
  const i = (window.__typed = (window.__typed ?? -1) + 1);
  const step = queue[i];
  if (!step) return;
  const el = document.querySelector(step.selector);
  if (step.first) el.focus();
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, el.value + step.ch);
  el.dispatchEvent(new Event('input', {bubbles: true}));
})();
