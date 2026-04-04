import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { findOrCreateOAuthUser } from "../services/auth.service";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:2500";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? "";

if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: `${BASE_URL}/auth/google/callback`,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email =
            profile.emails?.[0]?.value ?? `${profile.id}@google.local`;
          const name = profile.displayName ?? profile.id;
          const user = await findOrCreateOAuthUser({
            email,
            name,
            oauthProvider: "google",
            oauthId: profile.id,
          });
          // Map DB 'id' to the 'userId' field expected by Express.User / our JWT payload
          done(null, { userId: user.id, email: user.email, role: user.role });
        } catch (err) {
          done(err as Error);
        }
      }
    )
  );
}

export default passport;
