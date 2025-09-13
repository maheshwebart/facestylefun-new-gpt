import React from "react";
import { supabase } from "../lib/supabase";

export default function AuthButton() {
    async function onClick() {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: window.location.origin, // returns to same domain
                queryParams: { prompt: "select_account" }, // optional: force chooser
            },
        });
        if (error) console.error("Google sign-in error:", error);
    }
    return <button className="btn" onClick={onClick}>Continue with Google</button>;
}