import { NextResponse } from "next/server";

export const UnexpectedErrorResponse = () =>
  NextResponse.json({ message: unexpectedErrorMessage }, { status: 500 });

export const unexpectedErrorMessage = "An unexpected error ocurred!";
