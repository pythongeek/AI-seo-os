import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { dailySync } from "@/inngest/functions/daily-sync";
import { manualSync } from "@/inngest/functions/manual-sync";

export const { GET, POST, PUT } = serve({
    client: inngest,
    functions: [
        dailySync,
        manualSync
    ],
});
