declare global {
  namespace App {
    interface Locals {
      authToken: string | null;
      authUser: {
        id: string;
        email: string;
        name: string;
        email_verified_at?: string | null;
        profile?: {
          display_name?: string | null;
          trail_name?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
        } | null;
      } | null;
      betaProfile: {
        name: string;
        email: string;
        trailName: string;
      } | null;
      workspaceId: string | null;
    }

    interface PageData {
      authUser?: App.Locals['authUser'];
      betaProfile?: App.Locals['betaProfile'];
      isAdmin?: boolean;
    }
  }
}

export {};
