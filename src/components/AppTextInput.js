import React, { useRef } from 'react';
import { TextInput, Platform } from 'react-native';

const webStyles = Platform.OS === 'web' ? {
  outline: 'none',
  outlineWidth: 0,
  outlineStyle: 'none',
  WebkitAppearance: 'none',
  MozAppearance: 'none',
} : {};

const AppTextInput = ({ style, ...props }) => {
  const nameRef = useRef(Platform.OS === 'web' ? `field_${Math.random().toString(36).slice(2, 10)}` : undefined);

  return (
    <TextInput
      {...props}
      style={[style, Platform.OS === 'web' && webStyles]}
      name={nameRef.current}
      autoComplete={props.autoComplete || 'off'}
      textContentType="none"
      autoCompleteType="off"
      importantForAutofill="no"
    />
  );
};

export default AppTextInput;
