import React from "react";
import { supabase } from "../lib/supabase";

export default function AuthButton() {
    return (
        <button
            className="btn"
            onClick={() => supabase.auth.signInWithOAuth({ provider: "google" })}
        >
            Continue with Google
        </button>
    );
}
