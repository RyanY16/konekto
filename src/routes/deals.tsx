import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/deals")({
  beforeLoad: () => { throw redirect({ to: "/discounts" }); },
  component: () => null,
});
