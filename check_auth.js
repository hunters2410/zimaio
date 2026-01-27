// Quick test to check authentication status
// Run this in the browser console on http://localhost:5174/checkout

(async () => {
    console.log("🔍 Checking authentication status...");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    // Check if supabase client exists
    if (typeof window === 'undefined') {
        console.error("❌ Not running in browser!");
        return;
    }

    // Try to access the global supabase client (if exists)
    const supabaseClient = (window as any).supabase || (window as any).__supabaseClient;

    if (!supabaseClient) {
        console.error("❌ Supabase client not found in window object");
        console.log("💡 Try refreshing the page");
        return;
    }

    try {
        const { data: { session }, error } = await supabaseClient.auth.getSession();

        if (error) {
            console.error("❌ Error getting session:", error);
            return;
        }

        if (!session) {
            console.log("❌ NOT LOGGED IN");
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            console.log("📝 TO FIX:");
            console.log("   1. Go to: http://localhost:5174/login");
            console.log("   2. Log in with a customer account");
            console.log("   3. Return to checkout");
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            return;
        }

        console.log("✅ LOGGED IN");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("📧 Email:", session.user.email);
        console.log("🆔 User ID:", session.user.id);
        console.log("🔑 Token (first 50 chars):", session.access_token.substring(0, 50) + "...");
        console.log("⏰ Expires:", new Date(session.expires_at * 1000).toLocaleString());
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

        // Check token expiry
        const now = Math.floor(Date.now() / 1000);
        if (session.expires_at < now) {
            console.warn("⚠️  Token is EXPIRED!");
            console.log("💡 Refresh the page to get a new token");
        } else {
            const minutesLeft = Math.floor((session.expires_at - now) / 60);
            console.log(`✅ Token is valid for ${minutesLeft} more minutes`);
        }

        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("✅ You should be able to place orders now!");

    } catch (err) {
        console.error("❌ Unexpected error:", err);
    }
})();
