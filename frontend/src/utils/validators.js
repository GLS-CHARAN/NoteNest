export const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

// Mirrors the server's password rules.
export function passwordProblem(pw) {
  if (pw.length < 8) return 'Use at least 8 characters.';
  if (!/[a-z]/.test(pw)) return 'Add a lowercase letter.';
  if (!/[A-Z]/.test(pw)) return 'Add an uppercase letter.';
  if (!/\d/.test(pw)) return 'Add a number.';
  return null;
}

export function validateNoteForm({ title }) {
  const errors = {};
  if (!title.trim()) errors.title = 'Give your note a title.';
  else if (title.length > 200) errors.title = 'Title can be at most 200 characters.';
  return errors;
}
