"use client";

import { ErrorCanvas } from "../not-found";

export default function MaintenancePage() {
  return (
    <ErrorCanvas
      code="503"
      title="Maintenance Mode"
      message="We're tuning the Defaults Engine right now. Check back shortly or reach out if you need assistance."
    />
  );
}

