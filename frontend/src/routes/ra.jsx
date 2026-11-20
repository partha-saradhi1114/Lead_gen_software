import { Outlet, createFileRoute } from "@tanstack/react-router";

// Research Analyst area. Role-based access arrives with the backend; for now this is a sample-data view.
export const Route = createFileRoute("/ra")({
  component: () => <Outlet />,
});
