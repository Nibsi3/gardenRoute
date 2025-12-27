"use client";

import { ErrorCanvas } from "../not-found";

export default function ForbiddenPage() {
  return (
    <ErrorCanvas
      code="403"
      title="Access denied"
      message="You don't have permission to view this page. Please return to the map or contact us if you think this is a mistake."
    />
  );
}

