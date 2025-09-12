export type ImageData = {
  base64: string;
  mimeType: string;
};
export { };

declare global {
  interface Window {
    Razorpay: any;
  }
}
