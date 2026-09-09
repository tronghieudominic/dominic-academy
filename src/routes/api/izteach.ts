import { createFileRoute } from "@tanstack/react-router";
import { proxyIzteach } from "@/lib/izteach-proxy";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type, Accept, Range",
};

export const Route = createFileRoute("/api/izteach")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: corsHeaders }),
      GET: async ({ request }) => proxyIzteach(request),
      POST: async ({ request }) => proxyIzteach(request),
      PUT: async ({ request }) => proxyIzteach(request),
    },
  },
});
