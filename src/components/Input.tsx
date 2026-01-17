"use client";

import React from 'react';

const Input = ({ value, onChange }) => {
  return (
    <input
      type="number"
      min={0}
      value={value}
      onChange={(event) => onChange(parseInt(event.target.value))}
    />
  );
};

export default Input;