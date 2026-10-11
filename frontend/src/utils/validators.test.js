import { describe, expect, it } from 'vitest';
import { isValidEmail, passwordProblem, validateNoteForm } from './validators.js';

describe('validators', () => {
  it('checks email shape', () => {
    expect(isValidEmail('me@example.com')).toBe(true);
    expect(isValidEmail('nope')).toBe(false);
  });
  it('checks password rules', () => {
    expect(passwordProblem('short')).toBeTruthy();
    expect(passwordProblem('alllowercase1')).toBeTruthy();
    expect(passwordProblem('Good1234')).toBeNull();
  });
  it('requires a note title', () => {
    expect(validateNoteForm({ title: '   ' }).title).toBeTruthy();
    expect(validateNoteForm({ title: 'Hello' })).toEqual({});
  });
});
