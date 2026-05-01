import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/account")({
  beforeLoad: () => {
    throw redirect({ to: "/profile" });
  },
  component: () => null,
});

export default Route;
