document.querySelectorAll('.nav-group').forEach(group => {
  let closeTimer;
  const open = () => {
    clearTimeout(closeTimer);
    group.classList.add('is-open');
  };
  const close = () => {
    closeTimer = setTimeout(() => group.classList.remove('is-open'), 220);
  };
  group.addEventListener('mouseenter', open);
  group.addEventListener('mouseleave', close);
  group.addEventListener('focusin', open);
  group.addEventListener('focusout', close);
});
