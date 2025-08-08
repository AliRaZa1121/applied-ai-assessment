import { User } from "@prisma/client";

export interface UserAuthInterface {
  id: string;
  user: User;
}

export interface UserAuthTokenInterface {
  accessToken: string;
  refreshToken: string;
}
