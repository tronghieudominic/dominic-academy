import { createFileRoute } from "@tanstack/react-router";
import { DominicApp } from "@/components/dominic-app";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <DominicApp />;
}
