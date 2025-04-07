export type User = {
  id: string;
  name?: string;
  email: string;
  password: string;
  contact?: string;
  packageId?: string;
  role: "ADMIN" | "USER";
  updatedAt: Date;
  createdAt: Date;
  deletedAt?: Date;
  package?: Package;
  imaps: Imap[];
};

export type Package = {
  id: string;
  name: string;
  price: number;
  deletedAt?: Date;
  users: User[];
};

export type Filter = {
  id: string;
  name: string;
  updatedAt: Date;
  createdAt: Date;
  deletedAt?: Date;
};

export type Imap = {
  id: string;
  email: string;
  userId?: string;
  user?: User;
  deletedAt?: Date;
  expiredAt: Date;
};

export type Token = {
  id: string;
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  scope: string;
  expiryDate: Date;
};

export type Role = "ADMIN" | "USER";
