import { Login } from "@/modules/auth/components/Login";

export default function Home() {
  return (
    <div className="grid place-items-center h-[80vh]">
      <div className="grid place-items-center gap-20">
        <div className="text-4xl sm:text-6xl">AI Code Reviewer</div>
        <Login />
      </div>
    </div>
  );
}
