import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/deals_/$dealHandle")({
  beforeLoad: ({ params }) => { throw redirect({ to: "/discounts/$dealHandle" as any, params: { dealHandle: params.dealHandle } as any }); },
  component: () => null,
});
