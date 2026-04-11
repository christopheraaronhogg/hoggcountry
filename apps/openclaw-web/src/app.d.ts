declare global {
  namespace App {
    interface Locals {
      betaProfile: {
        name: string;
        email: string;
        trailName: string;
      } | null;
    }

    interface PageData {
      betaProfile?: App.Locals['betaProfile'];
    }
  }
}

export {};
