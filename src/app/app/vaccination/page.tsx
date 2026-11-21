"use client";

import { Suspense } from "react";
import VaccinationPageContent from "./VaccinationPageContent";

export default function VaccinationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>}>
      <VaccinationPageContent />
    </Suspense>
  );
}