import React, { useEffect } from 'react';
import { Platform, View } from 'react-native';

const AUTOCOMPLETE_CSS = `
  input, textarea, select, [contenteditable] {
    outline: none !important;
    outline-width: 0 !important;
    outline-style: none !important;
    outline-color: transparent !important;
    box-shadow: none !important;
    -webkit-focus-ring-color: transparent !important;
    -webkit-appearance: none !important;
    -moz-appearance: none !important;
  }
  input:focus, textarea:focus, select:focus, [contenteditable]:focus {
    outline: none !important;
    outline-width: 0 !important;
    outline-style: none !important;
    outline-color: transparent !important;
    box-shadow: none !important;
    -webkit-focus-ring-color: transparent !important;
  }
  input:focus-visible, textarea:focus-visible, select:focus-visible, [contenteditable]:focus-visible {
    outline: none !important;
    outline-width: 0 !important;
    outline-style: none !important;
    outline-color: transparent !important;
    box-shadow: none !important;
    -webkit-focus-ring-color: transparent !important;
  }
  input:-webkit-autofill,
  input:-webkit-autofill:hover,
  input:-webkit-autofill:focus,
  input:-webkit-autofill:active {
    -webkit-box-shadow: 0 0 0 1000px transparent inset !important;
    box-shadow: 0 0 0 1000px transparent inset !important;
    -webkit-text-fill-color: inherit !important;
    transition: background-color 5000s ease-in-out 0s !important;
  }
  form {
    margin: 0;
    padding: 0;
  }
`;

export const Form = ({ children, ...props }) => {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const id = '__autocomplete-css';
    if (document.getElementById(id)) return;
    const style = document.createElement('style');
    style.id = id;
    style.textContent = AUTOCOMPLETE_CSS;
    document.head.appendChild(style);
    return () => {
      const el = document.getElementById(id);
      if (el) el.remove();
    };
  }, []);

  if (Platform.OS === 'web') {
    return (
      <form autoComplete="off" {...props}>
        <input
          type="text"
          autoComplete="off"
          style={{ position: 'absolute', top: -9999, left: -9999, height: 1, width: 1, opacity: 0.01, pointerEvents: 'none' }}
          tabIndex={-1}
          readOnly
          aria-hidden="true"
        />
        <input
          type="password"
          autoComplete="new-password"
          style={{ position: 'absolute', top: -9999, left: -9999, height: 1, width: 1, opacity: 0.01, pointerEvents: 'none' }}
          tabIndex={-1}
          readOnly
          aria-hidden="true"
        />
        <input
          type="email"
          autoComplete="off"
          style={{ position: 'absolute', top: -9999, left: -9999, height: 1, width: 1, opacity: 0.01, pointerEvents: 'none' }}
          tabIndex={-1}
          readOnly
          aria-hidden="true"
        />
        {children}
      </form>
    );
  }

  return (
    <View
      {...props}
      importantForAutofill="no"
    >
      {children}
    </View>
  );
};

export default Form;
