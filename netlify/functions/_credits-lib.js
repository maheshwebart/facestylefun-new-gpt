import { getStore } from "@netlify/blobs";
const STORE = "credits";

export async function getCredits(email) {
    const store = getStore(STORE);
    const key = `user:${email.toLowerCase()}`;
    const data = await store.get(key, { type: "json" });
    return data?.credits ?? 0;
}

export async function setCredits(email, credits) {
    const store = getStore(STORE);
    const key = `user:${email.toLowerCase()}`;
    await store.set(key, JSON.stringify({ credits }), { metadata: { email } });
    return credits;
}

export async function addCredits(email, amount) {
    const current = await getCredits(email);
    return setCredits(email, current + amount);
}

export async function deductCredits(email, amount) {
    const current = await getCredits(email);
    if (current < amount) throw new Error("Not enough credits");
    return setCredits(email, current - amount);
}
