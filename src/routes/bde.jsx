import { Outlet, createFileRoute } from "@tanstack/react-router";

// BDE area. Role-based access arrives with the backend; for now this is a sample-data view.
export const Route = createFileRoute("/bde")({
  component: () => <Outlet />,
});
