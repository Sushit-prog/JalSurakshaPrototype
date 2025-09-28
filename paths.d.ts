

declare module '@/paths' {
  export const ReportsProvider: any;
}

declare global {
    interface Window {
        recaptchaVerifier: any;
    }
}
