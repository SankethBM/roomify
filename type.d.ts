interface AuthState {
    isSignedIn: boolean;
    userName: String | null,
    userId: String | null,
}

type AuthContext = {
    isSignedIn: boolean;
    userName: String | null,
    userId: String | null,
    refreshAuth: () => Promise<boolean>;
    signIn: () => Promise<boolean>;
    signOut: () => Promise<boolean>;
}