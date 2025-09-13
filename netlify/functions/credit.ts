import type { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseAnon = process.env.VITE_SUPABASE_ANON_KEY!;
// Prefer service role key in production:
// const supabaseService = process.env.SUPABASE_SERVICE_ROLE_KEY!;
// const supabase = createClient(supabaseUrl, supabaseService);

const supabase = createClient(supabaseUrl, supabaseAnon);

export const handler: Handler = async (event) => {
    try {
        const email = event.headers["x-user-email"];
        const { op, amount } = JSON.parse(event.body || "{}");

        if (!email) {
            return { statusCode: 400, body: JSON.stringify({ message: "Missing x-user-email header" }) };
        }

        // Ensure row
        await supabase.from("profiles").upsert({ email, credits: 0 }, { onConflict: "email" });

        // Fetch current
        const { data: row, error: qErr } = await supabase
            .from("profiles")
            .select("credits")
            .eq("email", email)
            .single();
        if (qErr) throw qErr;

        const curr = row?.credits ?? 0;
        let next = curr;

        if (op === "deduct") {
            const amt = Number(amount) || 1;
            if (curr < amt) return { statusCode: 400, body: JSON.stringify({ message: "Not enough credits" }) };
            next = curr - amt;
        } else if (op === "add") {
            const amt = Number(amount) || 0;
            next = curr + amt;
        } else {
            return { statusCode: 400, body: JSON.stringify({ message: "Invalid op" }) };
        }

        const { data: upd, error: uErr } = await supabase
            .from("profiles")
            .update({ credits: next })
            .eq("email", email)
            .select("credits")
            .single();
        if (uErr) throw uErr;

        return { statusCode: 200, body: JSON.stringify({ credits: upd.credits }) };
    } catch (e: any) {
        return { statusCode: 400, body: JSON.stringify({ message: e.message }) };
    }
};
