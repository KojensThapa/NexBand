export interface User {
  id: string;
  email: string;
  name: string;
  role: "USER";
  image?: string;
  createdAt: string;
}
