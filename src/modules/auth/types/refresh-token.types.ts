export interface RefreshTokenResult {
  refreshToken: string;
  sessionId: string;
  userId: string;
  expiresAt: Date;
}
