"use client";

import React from 'react';
import { Button } from "@/components/ui/button";

interface RedButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
}

const RedButton = ({ children, onClick }: RedButtonProps) => {
  return (
    <Button variant="destructive" onClick={onClick}>
      {children}
    </Button>
  );
};

export default RedButton;