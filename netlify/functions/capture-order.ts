import type { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseAnon = process.env.VITE_SUPABASE_ANON_KEY!;
// If you have a service role key, prefer:
// const supabaseService = process.env.SUPABASE_SERVICE_ROLE_KEY!;
// const supabase = createClient(supabaseUrl, supabaseService);

const supabase = createClient(supabaseUrl, supabaseAnon);

export const handler: Handler = async (event) => {
    try {
        const { orderID, email, pack } = JSON.parse(event.body || "{}");

        // TODO: actually call PayPal capture API with orderID to verify payment.
        // Skipping real capture for MVP; assume success.

        // Map pack -> credits to add
        const addCredits = pack === "20" ? 20 : 5;

        // Ensure row exists
        await supabase.from("profiles").upsert({ email, credits: 0 }, { onConflict: "email" });

        // Increment and return new total
        const { data, error } = await supabase
            .rpc("increment_credits", { p_email: email, p_add: addCredits }); // optional stored proc
        // If you don't want an RPC, do a simple update:
        // const { data: row } = await supabase.from("profiles").select("credits").eq("email", email).single();
        // const curr = row?.credits ?? 0;
        // const { data: upd } = await supabase.from("profiles")
        //   .update({ credits: curr + addCredits })
        //   .eq("email", email)
        //   .select("credits").single();

        if (error) throw error;

        // Return creditsAdded and new total for UI
        return {
            statusCode: 200,
            body: JSON.stringify({ creditsAdded: addCredits, credits: data ?? null }),
        };
    } catch (e: any) {
        return { statusCode: 400, body: JSON.stringify({ message: e.message }) };
    }
};
