const PAYPAL_API = process.env.PAYPAL_ENV === "live"
    ? "https://api.paypal.com"
    : "https://api-m.sandbox.paypal.com";

async function getAccessToken() {
    const auth = Buffer.from(
        `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`
    ).toString("base64");

    const res = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
        method: "POST",
        headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: "grant_type=client_credentials",
    });

    const data = await res.json();
    return data.access_token;
}

module.exports = { PAYPAL_API, getAccessToken };
