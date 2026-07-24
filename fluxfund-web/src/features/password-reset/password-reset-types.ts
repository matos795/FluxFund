export type RequestPasswordResetRequest = {
  email: string
}

export type ResetPasswordRequest = {
  token: string
  newPassword: string
}