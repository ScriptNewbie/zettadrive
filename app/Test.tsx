"use client";
import { SessionProvider, useSession } from "next-auth/react";
import React from "react";

export default function Test() {
  return (
    <SessionProvider>
      <TestComponent />
    </SessionProvider>
  );
}

const TestComponent = () => {
  const { data } = useSession();
  console.log(data);
  return null;
};
