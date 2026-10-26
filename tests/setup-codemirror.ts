import { vi } from 'vitest';

vi.mock('@codemirror/view', () => {
  class EditorViewMock {
    state = {
      doc: { toString: () => '' },
      selection: { main: { from: 0, to: 0 } },
    };
    destroy = vi.fn();
    dispatch = vi.fn();
    focus = vi.fn();
    static theme = vi.fn(() => []);
    static updateListener = Object.assign(vi.fn(() => []), { of: vi.fn(() => []) });
    static domEventHandlers = vi.fn(() => []);
    static lineWrapping = [];
  }

  class CompartmentMock {
    of = vi.fn(() => []);
    reconfigure = vi.fn(() => []);
  }

  return {
    EditorView: EditorViewMock,
    keymap: Object.assign(vi.fn(() => []), { of: vi.fn(() => []) }),
    highlightSpecialChars: vi.fn(() => []),
    drawSelection: vi.fn(() => []),
    highlightActiveLine: vi.fn(() => []),
    dropCursor: vi.fn(() => []),
    rectangularSelection: vi.fn(() => []),
    crosshairCursor: vi.fn(() => []),
    lineNumbers: vi.fn(() => []),
    highlightActiveLineGutter: vi.fn(() => []),
    Compartment: CompartmentMock,
  };
});

vi.mock('@codemirror/state', () => ({
  EditorState: {
    create: vi.fn(() => ({
      doc: { toString: () => '' },
      selection: { main: { from: 0, to: 0 } },
    })),
    allowMultipleSelections: { of: vi.fn(() => []) },
  },
  Compartment: vi.fn(function CompartmentMock() {
    return {
      of: vi.fn(() => []),
      reconfigure: vi.fn(() => []),
    };
  }),
}));

vi.mock('@codemirror/language', () => ({
  defaultHighlightStyle: {},
  syntaxHighlighting: vi.fn(() => []),
  indentOnInput: vi.fn(() => []),
  bracketMatching: vi.fn(() => []),
  foldGutter: vi.fn(() => []),
  foldKeymap: [],
}));

vi.mock('@codemirror/commands', () => ({
  defaultKeymap: [],
  history: vi.fn(() => []),
  historyKeymap: [],
}));

vi.mock('@codemirror/search', () => ({
  searchKeymap: [],
  highlightSelectionMatches: vi.fn(() => []),
}));

vi.mock('@codemirror/autocomplete', () => ({
  autocompletion: vi.fn(() => []),
  completionKeymap: [],
  closeCompletion: vi.fn(),
  startCompletion: vi.fn(),
  closeBrackets: vi.fn(() => []),
  closeBracketsKeymap: [],
}));

vi.mock('@codemirror/lint', () => ({
  lintKeymap: [],
  linter: vi.fn(() => []),
}));
