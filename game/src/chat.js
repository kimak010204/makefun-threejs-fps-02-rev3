// In-game chat: All chat (everyone sees it) and Team chat (own team only).
// T opens All chat, Y opens Team chat. Enter sends, Esc cancels. Bots talk
// through receive(): team messages from the other team are dropped, so the
// player only ever sees their own team's team chat plus all All chat.
export function createChat(doc, opts = {}) {
  const playerTeam = opts.team || 'attack';
  const log = doc.getElementById('chat-log');
  const row = doc.getElementById('chat-input-row');
  const modeLabel = doc.getElementById('chat-mode');
  const input = doc.getElementById('chat-input');
  const MAX_LINES = 6;
  let mode = 'all';
  let open = false;
  let onSend = null;
  let onOpen = null;
  let onClose = null;

  function teamClass(team) {
    return team === 'attack' ? 'van' : 'ember';
  }

  function addLine(name, team, text, scope) {
    const line = doc.createElement('div');
    line.className = `chat-line ${teamClass(team)}`;
    const tag = scope === 'team' ? '<span class="tag">[TEAM]</span>' : '<span class="tag">[ALL]</span>';
    line.innerHTML = `<span class="who">${name}</span>${tag} ${text}`;
    log.appendChild(line);
    while (log.children.length > MAX_LINES) log.firstChild.remove();
    // Lines persist until pushed out by newer ones (no timed fade): chat is
    // a record the player can re-read, and screenshots must show it.
  }

  function showInput() {
    modeLabel.textContent = mode === 'team' ? 'TEAM' : 'ALL';
    row.hidden = false;
    input.value = '';
    input.focus();
  }

  function hideInput() {
    row.hidden = true;
    input.blur();
  }

  input.addEventListener('keydown', (event) => {
    event.stopPropagation();
    if (event.key === 'Enter') {
      const text = input.value.trim();
      hideInput();
      open = false;
      if (onClose) onClose();
      if (text) {
        addLine('YOU', playerTeam, escapeHtml(text), mode);
        if (onSend) onSend(text, mode);
      }
    } else if (event.key === 'Escape') {
      hideInput();
      open = false;
      if (onClose) onClose();
    }
  });
  // Clicking the input row while the game has pointer lock does nothing;
  // the input is focused programmatically from open().

  function escapeHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  return {
    isOpen() { return open; },
    get mode() { return mode; },
    onSendChat(cb) { onSend = cb; },
    onChatOpen(cb) { onOpen = cb; },
    onChatClose(cb) { onClose = cb; },
    open(nextMode) {
      if (open) return false;
      mode = nextMode === 'team' ? 'team' : 'all';
      open = true;
      showInput();
      if (onOpen) onOpen();
      return true;
    },
    close() {
      if (!open) return;
      hideInput();
      open = false;
      if (onClose) onClose();
    },
    // A message from a bot (or anyone else). Team chat is only shown when
    // the sender is on the player's team; All chat is always shown.
    receive(name, team, text, scope = 'all') {
      if (scope === 'team' && team !== playerTeam) return false;
      addLine(name, team, escapeHtml(text), scope);
      return true;
    },
    // Plain system line in the player's own team colour.
    note(text) {
      addLine('YARD', playerTeam, escapeHtml(text), 'team');
    },
  };
}
