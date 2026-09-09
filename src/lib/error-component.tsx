import type { ErrorComponentProps } from "@tanstack/react-router";
import { TriangleAlert } from "lucide-react";

const FALLBACK_MESSAGE = "Đã xảy ra lỗi. Hãy tải lại trang và thử lại.";

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error) return error;
  return FALLBACK_MESSAGE;
}

export function AppErrorComponent({ error }: ErrorComponentProps) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#F5F7FB] px-6 text-center text-[#0F172A]">
      <span className="text-[#3B8FC4]" aria-hidden="true">
        <TriangleAlert className="size-10" strokeWidth={2} />
      </span>
      <h1 className="text-lg font-semibold">Có lỗi xảy ra</h1>
      <p className="max-w-md text-sm break-words text-[#64748B]">{errorMessage(error)}</p>
    </main>
  );
}
