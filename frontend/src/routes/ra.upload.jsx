import { createFileRoute } from "@tanstack/react-router";
import { UploadWizard } from "@/components/ra/UploadWizard";
import { pageHead } from "@/lib/leadgen/head";

export const Route = createFileRoute("/ra/upload")({
  head: () =>
    pageHead(
      "Upload Leads",
      "Upload, validate and submit Excel or CSV lead sheets for admin review.",
    ),
  component: UploadWizard,
});
