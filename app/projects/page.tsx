import { Logout } from "@/modules/auth/components/Logout";

export default function Projects() {
  return (
    <>
      <h1>Projects Page - Protected Content</h1>
      <Logout />
    </>
  );
}
